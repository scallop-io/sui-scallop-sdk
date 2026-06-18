import type { QueryClient } from '@tanstack/query-core';
import { Logger } from 'src/logger/Logger.js';
import { FetchWithCache } from 'src/utils/cache.js';

export type BaseRepoParams<Metadata = unknown> = {
  queryClient?: QueryClient;
  logger?: Logger;
  // Optional at the base: not every repo has a metadata dependency (e.g. an
  // api-only repo like addressApi). Domains that DO need it re-require it in
  // their own `*RepoParams` (e.g. `BaseRepoParams & { metadata: MarketRepoMetadata }`),
  // so the construction-time guarantee is preserved exactly where it matters.
  metadata?: Metadata;
};

export type BaseContext = {
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
