import { QueryClientConfig } from '@tanstack/query-core';

/**
 * Default cache options for the QueryClient.
 * @type {QueryClientConfig}
 * @description Default cache options for the QueryClient
 * We set the default to 5s to prevent duplicate requests from being requested (e.g. query MarketObject, etc.)
 */
export const DEFAULT_CACHE_OPTIONS: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 2000,
    },
  },
};
