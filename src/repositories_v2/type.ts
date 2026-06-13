import type {
  FetchQueryOptions,
  QueryClient,
  QueryKey,
} from '@tanstack/query-core';
import { OnChainDataSource } from 'src/datasources/onchain.js';
import { Logger } from 'src/logger/Logger.js';

export type BaseRepoArgs<Metadata = unknown> = {
  queryClient?: QueryClient;
  logger?: Logger;
  onchain: OnChainDataSource;
  metadata?: Metadata;
};

export type FetchWithCache = <T>(
  options: FetchQueryOptions<T, Error, T, QueryKey>
) => Promise<T>;

export type BaseContext = {
  onchain: OnChainDataSource;
  fetchWithCache: FetchWithCache;
  logger?: Logger;
};
