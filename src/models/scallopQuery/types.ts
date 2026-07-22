import { QueryClient, QueryClientConfig } from '@tanstack/query-core';
import ScallopUtils from '../scallopUtils/index.js';
import { ScallopUtilsConstructorParams } from '../scallopUtils/types.js';

export type ScallopQueryConstructorParams = {
  utils?: ScallopUtils;
  queryClient?: QueryClient;
  queryClientConfig?: QueryClientConfig;
  /** Cache lifetime (ms) for the full Pyth price-feed list. Defaults to 5_000. */
  priceTimeout?: number;
  // `graphqlUrl` / `graphqlClient` are inherited from
  // `ScallopUtilsConstructorParams` — they configure both the GraphQL read
  // transport (`readTransport: 'graphql'`) and the GraphQL balance datasource.
  pythApiKey?: string;
  /**
   * Pyth (Hermes) endpoints. The first is used as the default price-read
   * endpoint when no explicit `pythPriceServiceConfig` is supplied.
   */
  pythEndpoints?: string[];
} & ScallopUtilsConstructorParams;
