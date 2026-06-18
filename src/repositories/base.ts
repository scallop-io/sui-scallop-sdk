import type { QueryClient } from '@tanstack/query-core';
import { Logger, noopLogger } from 'src/logger/index.js';
import { createFetchWithCache, FetchWithCache } from 'src/utils/cache.js';
import { QUERY_CLIENT } from './cache.js';
import type { BaseContext, BaseRepoParams } from './types.js';

export abstract class BaseRepository<Context, Metadata = unknown> {
  protected readonly queryClient: QueryClient;
  protected readonly logger: Logger;
  // protected readonly onchain: OnChainDataSource;
  protected readonly metadata: Metadata;
  protected readonly fetchWithCache: FetchWithCache;

  constructor({
    queryClient = QUERY_CLIENT,
    logger = noopLogger,
    metadata,
  }: BaseRepoParams<Metadata>) {
    this.queryClient = queryClient;
    this.logger = logger;
    // `metadata` is optional on `BaseRepoParams` (api-only repos have none).
    // Repos that need it re-require it in their own `*RepoParams`, so for those
    // it's always present; for the rest `Metadata` is `unknown` and the value
    // is genuinely `undefined`. The cast bridges the optional param to the field.
    this.metadata = metadata as Metadata;
    this.fetchWithCache = createFetchWithCache(this.queryClient, this.logger);
  }

  get baseContext(): BaseContext & { metadata: Metadata } {
    return {
      fetchWithCache: this.fetchWithCache,
      logger: this.logger,
      metadata: this.metadata,
    };
  }

  abstract get context(): Context & BaseContext;
}
