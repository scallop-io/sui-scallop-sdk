import { GrpcDataSource } from 'src/datasources/grpc.js';
import { BaseRepository } from '../base.js';
import { QuerySource, runWithDataSourceFallback } from '../utils.js';
import {
  getIsolatedAssetsFromApi,
  getIsolatedAssetsFromOnChain,
} from './helpers.js';
import {
  IsolatedAssetsMetadata,
  IsolatedAssetsRepoParams,
  IsolatedAssetsRepoContext,
} from './types.js';

export class IsolatedAssetsRepository extends BaseRepository<
  IsolatedAssetsRepoContext,
  IsolatedAssetsMetadata
> {
  private readonly grpc: GrpcDataSource;

  constructor(params: IsolatedAssetsRepoParams) {
    const { grpc, ...rest } = params;
    super(rest);
    this.grpc = grpc;
  }

  get context() {
    return {
      ...this.baseContext,
      grpc: this.grpc,
    };
  }

  getIsolatedAssets({ source }: { source?: QuerySource }) {
    return runWithDataSourceFallback({
      source,
      label: 'IsolatedAssetsRepository.getIsolatedAssets',
      logger: this.logger,
      api: () => getIsolatedAssetsFromApi(this.context),
      onchain: () => getIsolatedAssetsFromOnChain(this.context),
    });
  }
}
