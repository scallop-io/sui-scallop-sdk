import type { SuiClientTypes } from '@mysten/sui/client';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import {
  deriveDynamicFieldID,
  fromBase64,
  normalizeStructTag,
} from '@mysten/sui/utils';
import { partitionArray } from 'src/utils/array.js';
import type { QueryClient } from '@tanstack/query-core';
import { RateLimiter } from './rateLimiter.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import { createFetchWithCache, type FetchWithCache } from 'src/utils/cache.js';
import { Logger, noopLogger } from 'src/logger/index.js';
import { ScallopRpcError } from 'src/errors/index.js';

/**
 * Max coin types per `multiGetBalances` query. The Sui GraphQL endpoint caps a
 * query payload at ~5000 bytes; coin types (esp. nested market-coin generics)
 * are long, so a large set overflows. 15 keeps the payload under the cap even
 * for the longest types; larger requests are split and merged.
 */
const MAX_COIN_TYPES_PER_BALANCE_QUERY = 15;

/** Default Sui GraphQL endpoint. Mainnet only for now. */
export const MAINNET_GRAPHQL_URL = 'https://graphql.mainnet.sui.io/graphql';

/**
 * Fetch balances for a specific set of coin types in one round trip
 * (`multiGetBalances`), instead of paging every balance via `listBalances`.
 * gRPC has no multi-coin balance call, so this is a GraphQL-only read.
 */
const COIN_BALANCES_BY_TYPES_QUERY = /* GraphQL */ `
  query CoinBalancesByTypes($address: SuiAddress!, $coinTypes: [String!]!) {
    address(address: $address) {
      multiGetBalances(keys: $coinTypes) {
        coinType {
          repr
        }
        totalBalance
        coinBalance
        addressBalance
      }
    }
  }
`;

type MultiGetBalancesResult = {
  address: {
    multiGetBalances: {
      coinType: { repr: string };
      totalBalance: string | null;
      coinBalance: string | null;
      addressBalance: string | null;
    }[];
  } | null;
};

type MultiGetBalancesVariables = {
  address: string;
  coinTypes: string[];
};

/**
 * Enumerate an object's dynamic fields WITH their values inline, in one paged
 * query. gRPC's `listDynamicFields` returns only field metadata (forcing a
 * second `getObjects` per value); GraphQL returns name + value together, so a
 * table walk collapses from "list ids + batch-fetch values" into a single paged
 * read. Mirrors the SDK's own `GetDynamicFieldsDocument` (see
 * `@mysten/sui/dist/graphql/generated/queries`) with `includeValue: true`,
 * requesting both `bcs` (for BCS parsers) and `json` (for shape-based parsers).
 */
const DYNAMIC_FIELDS_WITH_VALUES_QUERY = /* GraphQL */ `
  query DynamicFieldsWithValues(
    $parentId: SuiAddress!
    $first: Int
    $cursor: String
  ) {
    address(address: $parentId) {
      dynamicFields(first: $first, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          name {
            bcs
            type {
              repr
            }
          }
          value {
            __typename
            ... on MoveValue {
              bcs
              json
              type {
                repr
              }
            }
            ... on MoveObject {
              address
              contents {
                bcs
                json
                type {
                  repr
                }
              }
            }
          }
        }
      }
    }
  }
`;

// Single shape with all selected fields optional, discriminated at runtime on
// `__typename`. A proper `MoveValue | MoveObject | Other` union would defeat
// narrowing here (an `{ __typename: string }` member widens the discriminant),
// so we keep one shape and branch on the string.
type DynamicFieldValueNode = {
  __typename: string;
  // MoveValue
  bcs?: string | null;
  json?: unknown;
  type?: { repr: string } | null;
  // MoveObject
  address?: string;
  contents?: {
    bcs: string | null;
    json: unknown;
    type: { repr: string } | null;
  } | null;
} | null;

type DynamicFieldsQueryResult = {
  address: {
    dynamicFields: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: {
        name: { bcs: string; type: { repr: string } | null } | null;
        value: DynamicFieldValueNode;
      }[];
    } | null;
  } | null;
};

type DynamicFieldsQueryVariables = {
  parentId: string;
  first: number;
  cursor: string | null;
};

/**
 * One normalized dynamic-field entry with its value resolved inline. `fieldId`
 * is derived exactly as the Sui SDK's own GraphQL Core does
 * (`deriveDynamicFieldID`), so it matches the `fieldId` a gRPC
 * `listDynamicFields` would return for the same field.
 */
export type GraphQLDynamicField = {
  /** Derived dynamic-field object id (matches Core `listDynamicFields`). */
  fieldId: string;
  /** Field key: Move type repr + base64 BCS bytes of the name. */
  name: { type: string; bcs: string };
  /** Value Move type repr. */
  valueType: string;
  /** True for dynamic OBJECT fields (value is a separately-stored object). */
  isDynamicObject: boolean;
  /** Referenced object id, for dynamic object fields only. */
  childId?: string;
  /** Base64 BCS of the value (`MoveValue.bcs` / `MoveObject.contents.bcs`). */
  valueBcs: string | null;
  /** JSON of the value (`MoveValue.json` / `MoveObject.contents.json`). */
  valueJson: unknown;
};

export type GraphQLDataSourceParams = {
  /** Preconfigured client (full transport override). Takes precedence over `url`. */
  client?: SuiGraphQLClient;
  /** Endpoint to build a client against when `client` is omitted. Defaults to mainnet. */
  url?: string;
  /** Cache backing store — the datasource caches its own reads via `fetchWithCache`. */
  queryClient: QueryClient;
  logger?: Logger;
  /** Transport throughput cap (token-bucket). Omit to use `RateLimiter`'s default. */
  tokensPerSecond?: number;
};

/**
 * GraphQL-backed balance datasource. Unlike {@link OnChainDataSource} (a thin
 * rate-limited transport wrapper), this owns the typed GraphQL queries that have
 * no gRPC transport-method equivalent — currently `multiGetBalances` — and is
 * self-caching: every read is memoised through its own `fetchWithCache` and
 * throttled through a shared `RateLimiter`. Used where the GraphQL balance
 * service is more stable than gRPC (currently `coinBalance`).
 */
export class GraphQLDataSource {
  public readonly client: SuiGraphQLClient;
  public readonly url: string;
  private readonly fetchWithCache: FetchWithCache;
  private readonly logger: Logger;
  private readonly limiter: RateLimiter;

  constructor({
    client,
    url,
    queryClient,
    logger = noopLogger,
    tokensPerSecond,
  }: GraphQLDataSourceParams) {
    this.url = url ?? MAINNET_GRAPHQL_URL;
    this.client =
      client ?? new SuiGraphQLClient({ url: this.url, network: 'mainnet' });
    this.logger = logger;
    this.fetchWithCache = createFetchWithCache(queryClient, logger);
    this.limiter = new RateLimiter(tokensPerSecond);
  }

  /**
   * Balances for a KNOWN set of coin types in one `multiGetBalances` round trip.
   * Returns a map keyed by normalized coin type; `.balance` mirrors the transport
   * `Balance` contract (total balance), so downstream `.balance` reads match the
   * `listBalances` path. Coin types absent on-chain are omitted from the map.
   */
  async multiGetBalances(
    address: string,
    coinTypes: string[]
  ): Promise<Record<string, SuiClientTypes.Balance>> {
    if (!coinTypes.length) return {};

    const normalizedTypes = coinTypes.map((t) => normalizeStructTag(t));

    const entries = await this.fetchWithCache({
      queryKey: queryKeys.rpc.getCoinBalancesByTypes({
        node: this.url,
        address,
        coinTypes: [...normalizedTypes].sort(),
      }),
      // Split into sub-batches so no single query exceeds the endpoint's
      // ~5000-byte payload cap, then concatenate the entries.
      queryFn: async () => {
        const all: NonNullable<
          MultiGetBalancesResult['address']
        >['multiGetBalances'] = [];
        for (const chunk of partitionArray(
          normalizedTypes,
          MAX_COIN_TYPES_PER_BALANCE_QUERY
        )) {
          const batch = await this.limiter.execute(async () => {
            const resp = await this.client.query<
              MultiGetBalancesResult,
              MultiGetBalancesVariables
            >({
              query: COIN_BALANCES_BY_TYPES_QUERY,
              variables: { address, coinTypes: chunk },
            });
            if (resp.errors?.length) {
              const error = new ScallopRpcError(
                `GraphQL multiGetBalances failed: ${resp.errors[0].message}`,
                { context: { address, coinTypes: chunk } }
              );
              this.logger.error(error.message, error.context);
              throw error;
            }
            return resp.data?.address?.multiGetBalances ?? [];
          });
          all.push(...batch);
        }
        return all;
      },
    });

    return entries.reduce(
      (acc, entry) => {
        const coinType = normalizeStructTag(entry.coinType.repr);
        acc[coinType] = {
          coinType,
          balance: entry.totalBalance ?? '0',
          coinBalance: entry.coinBalance ?? '0',
          addressBalance: entry.addressBalance ?? '0',
        };
        return acc;
      },
      {} as Record<string, SuiClientTypes.Balance>
    );
  }

  /**
   * List ALL dynamic fields of `parentId` with their values inline, paging the
   * GraphQL connection internally. The whole scan is memoised under one stable
   * cache key (like the Pyth full-feed read) so repeated table walks in a tick
   * share it. Each page is throttled through the shared rate limiter.
   *
   * Returns entries whose `fieldId` matches what a gRPC `listDynamicFields`
   * would return, so callers can swap their "list ids + batch-fetch values"
   * two-step for this single read without changing the field ids they persist.
   */
  async listDynamicFieldsWithValues(
    parentId: string,
    { pageLimit = 50 }: { pageLimit?: number } = {}
  ): Promise<GraphQLDynamicField[]> {
    return this.fetchWithCache({
      queryKey: queryKeys.rpc.getDynamicFieldsWithValues({
        node: this.url,
        parentId,
        includeValue: true,
      }),
      queryFn: async () => {
        const fields: GraphQLDynamicField[] = [];
        let cursor: string | null = null;

        do {
          const resp = await this.limiter.execute(() =>
            this.client.query<
              DynamicFieldsQueryResult,
              DynamicFieldsQueryVariables
            >({
              query: DYNAMIC_FIELDS_WITH_VALUES_QUERY,
              variables: { parentId, first: pageLimit, cursor },
            })
          );
          if (resp.errors?.length) {
            const error = new ScallopRpcError(
              `GraphQL listDynamicFieldsWithValues failed: ${resp.errors[0].message}`,
              { context: { parentId } }
            );
            this.logger.error(error.message, error.context);
            throw error;
          }

          const connection = resp.data?.address?.dynamicFields;
          if (!connection) break;

          for (const node of connection.nodes) {
            const normalized = normalizeDynamicField(parentId, node);
            if (normalized) fields.push(normalized);
          }

          cursor = connection.pageInfo.hasNextPage
            ? connection.pageInfo.endCursor
            : null;
        } while (cursor);

        return fields;
      },
    });
  }

  /**
   * Fetch N SPECIFIC dynamic fields of `parentId` by name, in one aliased query
   * per chunk — the right shape for owner-key → global-table lookups (veSca /
   * obligation names) where a full table scan would be an anti-optimization.
   * Replaces N separate `getDynamicField` round trips with ~1. Results are
   * aligned to the input `names` order; a missing field is `null`.
   */
  async multiGetDynamicFields(
    parentId: string,
    names: GraphQLDynamicFieldName[],
    { chunkSize = 40 }: { chunkSize?: number } = {}
  ): Promise<Array<GraphQLDynamicField | null>> {
    if (!names.length) return [];

    const chunks: GraphQLDynamicFieldName[][] = [];
    for (let i = 0; i < names.length; i += chunkSize) {
      chunks.push(names.slice(i, i + chunkSize));
    }

    const perChunk = await Promise.all(
      chunks.map((chunk) =>
        this.fetchWithCache({
          queryKey: queryKeys.rpc.getMultiDynamicFields({
            node: this.url,
            parentId,
            // order-sensitive: aliases map back to input positions
            names: chunk.map((n) => `${n.type}:${n.bcs}`),
          }),
          queryFn: () =>
            this.limiter.execute(async () => {
              const query = buildAliasedDynamicFieldQuery(chunk.length);
              const variables: Record<string, string> = { parentId };
              chunk.forEach((name, i) => {
                variables[`t${i}`] = name.type;
                variables[`b${i}`] = name.bcs;
              });

              const resp = await this.client.query<
                Record<string, Record<string, unknown> | null>,
                Record<string, string>
              >({ query, variables });
              if (resp.errors?.length) {
                const error = new ScallopRpcError(
                  `GraphQL multiGetDynamicFields failed: ${resp.errors[0].message}`,
                  { context: { parentId } }
                );
                this.logger.error(error.message, error.context);
                throw error;
              }

              const address = resp.data?.address as
                | Record<string, DynamicFieldNode | null>
                | null
                | undefined;
              return chunk.map((_name, i) => {
                const node = address?.[`f${i}`] ?? null;
                return node ? normalizeDynamicField(parentId, node) : null;
              });
            }),
        })
      )
    );

    return perChunk.flat();
  }
}

/** One dynamic-field name key: Move type repr + base64 BCS of the key. */
export type GraphQLDynamicFieldName = { type: string; bcs: string };

/** A raw `dynamicField` result node (name + inline value). */
type DynamicFieldNode = {
  name: { bcs: string; type: { repr: string } | null } | null;
  value: DynamicFieldValueNode;
};

/**
 * The name+value sub-selection shared by the single-field alias reads. Requests
 * both `bcs` (for BCS parsers) and `json` (for shape-based parsers).
 */
const DYNAMIC_FIELD_NODE_SELECTION = /* GraphQL */ `
  name {
    bcs
    type {
      repr
    }
  }
  value {
    __typename
    ... on MoveValue {
      bcs
      json
      type {
        repr
      }
    }
    ... on MoveObject {
      address
      contents {
        bcs
        json
        type {
          repr
        }
      }
    }
  }
`;

/**
 * Build an aliased query fetching `count` dynamic fields by name in one request:
 * `f0: dynamicField(name: {type: $t0, bcs: $b0}) { … }`, one alias per name.
 */
const buildAliasedDynamicFieldQuery = (count: number): string => {
  const varDecls = ['$parentId: SuiAddress!'];
  const selections: string[] = [];
  for (let i = 0; i < count; i++) {
    varDecls.push(`$t${i}: String!`, `$b${i}: Base64!`);
    selections.push(
      `f${i}: dynamicField(name: { type: $t${i}, bcs: $b${i} }) { ${DYNAMIC_FIELD_NODE_SELECTION} }`
    );
  }
  return `query MultiGetDynamicFields(${varDecls.join(', ')}) {
    address(address: $parentId) {
      ${selections.join('\n')}
    }
  }`;
};

/**
 * Normalize one raw GraphQL dynamic-field node into a {@link GraphQLDynamicField}.
 * Derives `fieldId` the same way the Sui SDK's GraphQL Core does — for dynamic
 * OBJECT fields the name type is wrapped in `dynamic_object_field::Wrapper<...>`
 * before derivation. Returns `null` for nodes missing a name/value (defensive).
 */
const normalizeDynamicField = (
  parentId: string,
  node: {
    name: { bcs: string; type: { repr: string } | null } | null;
    value: DynamicFieldValueNode;
  }
): GraphQLDynamicField | null => {
  const { name, value } = node;
  if (!name?.type?.repr || !value || !('__typename' in value)) return null;

  const isDynamicObject = value.__typename === 'MoveObject';
  const nameTypeRepr = name.type.repr;
  const derivedNameType = isDynamicObject
    ? `0x2::dynamic_object_field::Wrapper<${nameTypeRepr}>`
    : nameTypeRepr;
  const fieldId = deriveDynamicFieldID(
    parentId,
    derivedNameType,
    fromBase64(name.bcs)
  );

  if (value.__typename === 'MoveObject') {
    return {
      fieldId,
      name: { type: nameTypeRepr, bcs: name.bcs },
      valueType: value.contents?.type?.repr ?? '',
      isDynamicObject: true,
      childId: value.address,
      valueBcs: value.contents?.bcs ?? null,
      valueJson: value.contents?.json ?? null,
    };
  }
  if (value.__typename === 'MoveValue') {
    return {
      fieldId,
      name: { type: nameTypeRepr, bcs: name.bcs },
      valueType: value.type?.repr ?? '',
      isDynamicObject: false,
      valueBcs: value.bcs ?? null,
      valueJson: value.json ?? null,
    };
  }
  return null;
};
