/**
 * Default cache options for the QueryClient.
 * @type {QueryClientConfig}
 * @description Default cache options for the QueryClient
 * We set the default to 5s to prevent duplicate requests from being requested (e.g. query MarketObject, etc.)
 */
export const DEFAULT_CACHE_OPTIONS = {
  defaultOptions: {
    queries: {
      staleTime: 5000,
      gcTime: 5000,
    },
  },
};
