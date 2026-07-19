import type { SuiClientTypes } from '@mysten/sui/client';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { normalizeStructTag } from '@mysten/sui/utils';
import type { QueryClient } from '@tanstack/query-core';
import { RateLimiter } from './rateLimiter.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import { createFetchWithCache, type FetchWithCache } from 'src/utils/cache.js';
import { Logger, noopLogger } from 'src/logger/index.js';
import { ScallopRpcError } from 'src/errors/index.js';

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
      queryFn: () =>
        this.limiter.execute(async () => {
          const resp = await this.client.query<
            MultiGetBalancesResult,
            MultiGetBalancesVariables
          >({
            query: COIN_BALANCES_BY_TYPES_QUERY,
            variables: { address, coinTypes: normalizedTypes },
          });
          if (resp.errors?.length) {
            const error = new ScallopRpcError(
              `GraphQL multiGetBalances failed: ${resp.errors[0].message}`,
              { context: { address, coinTypes: normalizedTypes } }
            );
            this.logger.error(error.message, error.context);
            throw error;
          }
          return resp.data?.address?.multiGetBalances ?? [];
        }),
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
}
