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
  metadata: Metadata;
};

export type FetchWithCache = <T>(
  options: FetchQueryOptions<T, Error, T, QueryKey>
) => Promise<T>;

export type BaseContext = {
  onchain: OnChainDataSource;
  fetchWithCache: FetchWithCache;
  logger?: Logger;
};

export type QuerySource = 'onchain' | 'api' | 'api-first';

export type OnChainOnlyFallbackArgs<T> = {
  source?: 'onchain';
  onchain: () => Promise<T>;
  label: string;
  logger?: Logger;
};

type ApiFallbackArgs<T> = {
  source: 'api' | 'api-first';
  api: () => Promise<T>;
  onchain: () => Promise<T>;
  label: string;
  logger?: Logger;
};

export type DataSourceFallbackArgs<T> =
  | OnChainOnlyFallbackArgs<T>
  | ApiFallbackArgs<T>;
