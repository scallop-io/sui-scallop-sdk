import { FetchQueryOptions, QueryClient, QueryKey } from '@tanstack/query-core';
import { Logger } from 'src/logger/Logger.js';

export type FetchWithCacheOptions = {
  /**
   * Log the error before rethrowing. Defaults to `true`. Set `false` for queries
   * whose failure is expected and handled by the caller (e.g. a dynamic-field
   * lookup that legitimately misses), to avoid spurious error logs.
   */
  logErrors?: boolean;
};

export type FetchWithCache = <T>(
  options: FetchQueryOptions<T, Error, T, QueryKey>,
  cacheOptions?: FetchWithCacheOptions
) => Promise<T>;

export const createFetchWithCache =
  (queryClient: QueryClient, logger: Logger): FetchWithCache =>
  async (options, { logErrors = true } = {}) => {
    try {
      return await queryClient.fetchQuery(options);
    } catch (error) {
      if (logErrors) {
        logger.error('Error fetching query', {
          queryKey: options.queryKey,
          message: (error as Error)?.message,
        });
      }
      throw error;
    }
  };
