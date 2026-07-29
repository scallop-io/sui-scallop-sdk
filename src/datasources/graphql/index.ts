import type { SuiClientTypes } from '@mysten/sui/client';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import {
  deriveDynamicFieldID,
  fromBase64,
  normalizeStructTag,
} from '@mysten/sui/utils';
import { partitionArray } from 'src/utils/array.js';
import type { QueryClient } from '@tanstack/query-core';
import { RateLimiter } from '../rateLimiter.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import { createFetchWithCache, type FetchWithCache } from 'src/utils/cache.js';
import { Logger, noopLogger } from 'src/logger/index.js';
import { ScallopRpcError } from 'src/errors/index.js';
import { recordRpcCall } from '../rpcStats.js';
import {
  MultiGetBalancesResult,
  MultiGetBalancesVariables,
  GraphQLDynamicField,
  DynamicFieldValueNode,
} from 'src/datasources/graphql/types.js';
import {
  COIN_BALANCES_BY_TYPES_QUERY,
  DYNAMIC_FIELD_NODE_SELECTION,
} from 'src/datasources/graphql/queries.js';
import type { OnChainDataSource } from 'src/datasources/onchain.js';

/**
 * Max coin types per `multiGetBalances` query. The Sui GraphQL endpoint caps a
 * query payload at ~5000 bytes; coin types (esp. nested market-coin generics)
 * are long, so a large set overflows. 15 keeps the payload under the cap even
 * for the longest types; larger requests are split and merged.
 */
const MAX_COIN_TYPES_PER_BALANCE_QUERY = 15;

/** Default Sui GraphQL endpoint. Mainnet only for now. */
export const MAINNET_GRAPHQL_URL = 'https://graphql.mainnet.sui.io/graphql';

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
 * GraphQL-backed balance datasource. Unlike {@link GrpcDataSource} (a thin
 * rate-limited transport wrapper), this owns the typed GraphQL queries that have
 * no gRPC transport-method equivalent — currently `multiGetBalances` — and is
 * self-caching: every read is memoised through its own `fetchWithCache` and
 * throttled through a shared `RateLimiter`. Used where the GraphQL balance
 * service is more stable than gRPC (currently `coinBalance`).
 */
export class GraphQLDataSource implements OnChainDataSource<SuiGraphQLClient> {
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
   * Object read, delegated straight to the underlying client (which resolves it
   * through GraphQL Core). Present so this datasource satisfies
   * {@link OnChainDataSource} alongside {@link GrpcDataSource}; unlike the gRPC
   * datasource it does NOT coalesce — this source's hot path is balance reads,
   * not object fetches, so the request-batching buffer would be dead weight here.
   */
  getObject<Include extends SuiClientTypes.ObjectInclude = {}>(
    options: SuiClientTypes.GetObjectOptions<Include>
  ): Promise<SuiClientTypes.GetObjectResponse<Include>> {
    return this.client.getObject(options);
  }

  /**
   * Run one throttled GraphQL request, recording it in the shared RPC accounting
   * under the `graphql` transport (mirrors the on-chain proxy). `waitMs` is the
   * time spent waiting for a rate-limit token; `cardinality` is how many logical
   * items the request carried (coin types, field names) — `1` for a page read.
   */
  private recordedExecute<T>(
    method: string,
    cardinality: number,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    return this.limiter.execute(() => {
      recordRpcCall('graphql', method, Date.now() - start, cardinality);
      return fn();
    });
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
          const batch = await this.recordedExecute(
            'multiGetBalances',
            chunk.length,
            async () => {
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
            }
          );
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
            this.recordedExecute(
              'multiGetDynamicFields',
              chunk.length,
              async () => {
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
              }
            ),
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
