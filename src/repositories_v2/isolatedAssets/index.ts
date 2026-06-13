import { BaseRepository } from '../base.js';
import { QuerySource, runWithDataSourceFallback } from '../util.js';
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
  declare protected readonly metadata: IsolatedAssetsMetadata;

  constructor(args: IsolatedAssetsRepoArgs) {
    super(args);
  }

  get context() {
    return {
      ...this.baseContext,
      metadata: this.metadata,
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
