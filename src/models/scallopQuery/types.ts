import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { QueryClient, QueryClientConfig } from '@tanstack/query-core';
import { ScallopUtilsConstructorParams } from 'src/models/scallopUtils/types.js';
import type { DistributiveMerge } from 'src/types/utils.js';
import ScallopUtils from '../scallopUtils/index.js';
import { Logger } from 'src/logger/Logger.js';

/**
 * gRPC read transport (the default). Core reads and **all writes** go over gRPC
 * via `fullnodeUrl` (or an injected `suiClient`). `readTransport` may be omitted
 * — gRPC is the default. GraphQL-only options are rejected in this mode.
 */
type SuiGrpcTransport = {
  readTransport?: 'grpc';
  /** Override the gRPC Core client (defaults to one built from `fullnodeUrl`). */
  graphqlClient?: never;
  graphqlUrl?: never;
} & (
  | {
      /** Preconfigured `SuiGraphQLClient`. Takes precedence over `graphqlUrl`. */
      suiClient: SuiGrpcClient;
      /** GraphQL endpoint URL. Defaults to mainnet. Ignored when `graphqlClient` is set. */
      fullnodeUrl?: never;
    }
  | {
      suiClient?: never;
      fullnodeUrl: string;
    }
);

/**
 * GraphQL read transport. Core reads and **all writes still go over gRPC** via
 * `fullnodeUrl` (defaults to the mainnet fullnode when omitted);
 * `readTransport: 'graphql'` only makes balance reads and the Tier-2
 * dynamic-field repos (pool addresses, xOracle, veSCA, …) prefer native GraphQL
 * queries. Configure the GraphQL endpoint with `graphqlClient` (preferred) or
 * `graphqlUrl`. Injecting a gRPC `suiClient` is not supported in this mode — the
 * Core client is always built from `fullnodeUrl`.
 */
type SuiGraphqlTransport = {
  readTransport: 'graphql';
  suiClient?: never;
  /** gRPC fullnode for the Core read path + writes. Defaults to mainnet. */
  fullnodeUrl?: string;
} & (
  | {
      /** Preconfigured `SuiGraphQLClient`. Takes precedence over `graphqlUrl`. */
      graphqlClient: SuiGraphQLClient;
      /** GraphQL endpoint URL. Defaults to mainnet. Ignored when `graphqlClient` is set. */
      graphqlUrl?: never;
    }
  | {
      graphqlClient?: never;
      graphqlUrl: string;
    }
);

export type ScallopQueryBaseParams = {
  indexerUrl?: string;
  logger?: Logger;
  /**
   * Coalescing window (ms) for batched `getObject` reads. Default `0` (flush on
   * the next macrotask); raise to batch reads spread over a few ms, or `null`
   * for microtask-only. See `GrpcDataSource`.
   */
  objectBatchWindowMs?: number | null;
  /** Cache lifetime (ms) for the full Pyth price-feed list. Defaults to 5_000. */
  priceTimeout?: number;
  pythApiKey?: string;
  /**
   * Pyth (Hermes) endpoints. The first is used as the default price-read
   * endpoint when no explicit `pythPriceServiceConfig` is supplied.
   */
  pythEndpoints?: string[];
  queryClient?: QueryClient;
  queryClientConfig?: QueryClientConfig;
  readTransport?: 'grpc' | 'graphql';
  tokensPerSecond?: number;
  utils?: ScallopUtils;
};

// `DistributiveMerge` (not `{...} & ScallopUtilsConstructorParams`) so the
// `readTransport` transport union stays at the top level and its guard survives
// downstream. See `DistributiveMerge`.
export type ScallopQueryConstructorParams = DistributiveMerge<
  SuiGrpcTransport | SuiGraphqlTransport,
  ScallopQueryBaseParams &
    Omit<ScallopUtilsConstructorParams, 'coreClient'> &
    Partial<Pick<ScallopUtilsConstructorParams, 'coreClient'>>
>;
