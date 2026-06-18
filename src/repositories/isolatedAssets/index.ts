import { OnChainDataSource } from 'src/datasources/onchain.js';
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
  private readonly onchain: OnChainDataSource;

  constructor(params: IsolatedAssetsRepoParams) {
    const { onchain, ...rest } = params;
    super(rest);
    this.onchain = onchain;
  }

  get context() {
    return {
      ...this.baseContext,
      onchain: this.onchain,
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
