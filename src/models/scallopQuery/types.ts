import { QueryClient, QueryClientConfig } from '@tanstack/query-core';
import type { SuiGraphQLClient } from '@mysten/sui/graphql';
import ScallopUtils from '../scallopUtils/index.js';
import { ScallopUtilsConstructorParams } from '../scallopUtils/types.js';

export type ScallopQueryConstructorParams = {
  utils?: ScallopUtils;
  queryClient?: QueryClient;
  queryClientConfig?: QueryClientConfig;
  /** Cache lifetime (ms) for the full Pyth price-feed list. Defaults to 5_000. */
  priceTimeout?: number;
  /**
   * Override the Sui GraphQL endpoint used for `coinBalance` balance reads
   * (defaults to mainnet). Ignored when `graphqlClient` is provided.
   */
  graphqlUrl?: string;
  /**
   * Inject a preconfigured `SuiGraphQLClient` for `coinBalance` balance reads
   * (full transport override). Takes precedence over `graphqlUrl`.
   */
  graphqlClient?: SuiGraphQLClient;
  pythApiKey?: string;
  /**
   * Pyth (Hermes) endpoints. The first is used as the default price-read
   * endpoint when no explicit `pythPriceServiceConfig` is supplied.
   */
  pythEndpoints?: string[];
} & ScallopUtilsConstructorParams;
