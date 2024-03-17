import { QueryClientConfig } from '@tanstack/query-core';

/**
 * Default cache options for the QueryClient.
 * @type {QueryClientConfig}
 * @description Default cache options for the QueryClient
 * We set the default to 1000ms to prevent duplicate requests from being made (e.g. query MarketObject, etc.)
 */
export const DEFAULT_CACHE_OPTIONS: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 8000,
    },
  },
};
