import { ClientWithCoreApi } from '@mysten/sui/client';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import type { QueryClient } from '@tanstack/query-core';
import type { Logger } from 'src/logger/index.js';
import { API_BASE_URL, SDK_API_BASE_URL } from 'src/constants/api.js';
import { ApiDataSource } from 'src/datasources/api.js';
import { IndexerDataSource } from 'src/datasources/indexer.js';
import { OnChainDataSource } from 'src/datasources/onchain.js';
import {
  GraphQLDataSource,
  MAINNET_GRAPHQL_URL,
} from 'src/datasources/graphql.js';

export { MAINNET_GRAPHQL_URL };

/**
 * The on-chain datasource is the only repo datasource that needs to be instantiated with a client,
 * since it needs to call on-chain methods that require a client. The indexer and API datasources
 * are just thin wrappers around fetch, so they don't need a client and can be instantiated with
 * just a URL (which defaults to the appropriate base URL if not provided).
 */
export const createOnChainDataSource = (
  client: ClientWithCoreApi,
  url: string, // for cache keys
  options?: { tokensPerSecond?: number; objectBatchWindowMs?: number | null }
): OnChainDataSource =>
  new OnChainDataSource({
    // new-gen transport methods (getObjects/simulateTransaction/…) live on `.core`
    client: client.core,
    url,
    // The datasource is now the single rate-limit point for every repo read
    // (the old ScallopSuiKit query path is gone).
    tokensPerSecond: options?.tokensPerSecond,
    objectBatchWindowMs: options?.objectBatchWindowMs,
  });

/**
 * GraphQL-backed balance datasource. Owns the typed GraphQL queries with no gRPC
 * transport-method equivalent (currently `multiGetBalances`) and self-caches
 * every read. Used only where the GraphQL balance service is more stable than
 * gRPC (currently `coinBalance`). Pass a prebuilt `client` to fully override
 * transport, or `url` to point at a non-default endpoint; both default to
 * mainnet. `queryClient` backs the datasource's own read cache.
 */
export const createGraphQLDataSource = (opts: {
  client?: SuiGraphQLClient;
  url?: string;
  queryClient: QueryClient;
  logger?: Logger;
  tokensPerSecond?: number;
}): GraphQLDataSource => new GraphQLDataSource(opts);

/**
 * The indexer base URL defaults to `SDK_API_BASE_URL` inside `IndexerDataSource`.
 * Pass `url` only to point at a non-default indexer.
 */
export const createIndexerDataSource = (
  url: string = SDK_API_BASE_URL
): IndexerDataSource => new IndexerDataSource({ url });

/**
 * Plain Scallop API datasource (defaults to `API_BASE_URL`, distinct from the
 * indexer base). Injected into repos that read the public API rather than the
 * indexer (e.g. `poolAddresses`). Pass `url` to override.
 */
export const createApiDataSource = (
  url: string = API_BASE_URL
): ApiDataSource => new ApiDataSource({ url });
