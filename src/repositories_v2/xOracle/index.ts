import { BaseRepository } from '../base.js';
import { getAssetOraclesFromOnChain } from './helpers.js';
import {
  XOracleMetadata,
  XOracleRepoArgs,
  XOracleRepoContext,
} from './types.js';

export class XOracleRepository extends BaseRepository<
  XOracleRepoContext,
  XOracleMetadata
> {
  declare protected readonly metadata: XOracleMetadata;

  constructor(args: XOracleRepoArgs) {
    super(args);
  }

  get context() {
    return {
      ...this.baseContext,
      metadata: this.metadata,
    };
  }

  /**
   * Return supported primary and secondary oracles for supported assets
   */
  getAssetOracles() {
    return getAssetOraclesFromOnChain(this.context);
  }
}
