import type {
  FetchQueryOptions,
  QueryClient,
  QueryKey,
} from '@tanstack/query-core';
import { OnChainDataSource } from 'src/datasources/onchain.js';
import { noopLogger, Logger } from 'src/logger/index.js';
import { QUERY_CLIENT } from './cache.js';
import type { BaseContext, BaseRepoArgs } from './types.js';

export abstract class BaseRepository<Context, Metadata = unknown> {
  protected readonly queryClient: QueryClient;
  protected readonly logger: Logger;
  protected readonly onchain: OnChainDataSource;
  protected readonly metadata: Metadata;

  constructor({
    queryClient = QUERY_CLIENT,
    logger = noopLogger,
    onchain,
    metadata,
  }: BaseRepoArgs<Metadata>) {
    this.onchain = onchain;
    this.queryClient = queryClient;
    this.logger = logger;
    this.metadata = metadata;
  }

  protected async fetchWithCache<T>(
    options: FetchQueryOptions<T, Error, T, QueryKey>
  ): Promise<T> {
    try {
      return await this.queryClient.fetchQuery(options);
    } catch (error) {
      this.logger?.error('Error fetching query', {
        queryKey: options.queryKey,
      });
      throw error;
    }
  }

  get baseContext(): BaseContext & { metadata: Metadata } {
    return {
      onchain: this.onchain,
      fetchWithCache: this.fetchWithCache.bind(this),
      logger: this.logger,
      metadata: this.metadata,
    };
  }

  abstract get context(): Context & BaseContext;
}
