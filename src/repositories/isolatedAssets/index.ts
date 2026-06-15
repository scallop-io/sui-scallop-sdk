import { BaseRepository } from '../base.js';
import { QuerySource, runWithDataSourceFallback } from '../utils.js';
import {
  getIsolatedAssetsFromApi,
  getIsolatedAssetsFromOnChain,
} from './helpers.js';
import {
  IsolatedAssetsMetadata,
  IsolatedAssetsRepoArgs,
  IsolatedAssetsRepoContext,
} from './types.js';

export class IsolatedAssetsRepository extends BaseRepository<
  IsolatedAssetsRepoContext,
  IsolatedAssetsMetadata
> {
  constructor(args: IsolatedAssetsRepoArgs) {
    super(args);
  }

  get context() {
    return this.baseContext;
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
