import { QueryClient, QueryClientConfig } from '@tanstack/query-core';
import { DEFAULT_CACHE_OPTIONS } from 'src/constants';

export type ScallopQueryClientParams = {
  queryClient?: QueryClient;
  queryClientConfig?: QueryClientConfig;
};

class ScallopQueryClient {
  private _queryClient: QueryClient;
  constructor(params: ScallopQueryClientParams = {}) {
    this._queryClient =
      params.queryClient ?? new QueryClient(this.defaultQueryClientConfig);
  }

  get queryClient() {
    return this._queryClient;
  }

  set queryClient(queryClient: QueryClient) {
    this._queryClient = queryClient;
  }

  get defaultQueryClientConfig() {
    return DEFAULT_CACHE_OPTIONS;
  }
}

export default ScallopQueryClient;
