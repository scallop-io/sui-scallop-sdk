import { FetchQueryOptions, QueryClient, QueryKey } from '@tanstack/query-core';
import { Logger } from 'src/logger/Logger.js';

export type FetchWithCache = <T>(
  options: FetchQueryOptions<T, Error, T, QueryKey>
) => Promise<T>;

export const createFetchWithCache =
  (queryClient: QueryClient, logger: Logger): FetchWithCache =>
  async (options) => {
    try {
      return await queryClient.fetchQuery(options);
    } catch (error) {
      logger.error('Error fetching query', { queryKey: options.queryKey });
      throw error;
    }
  };
