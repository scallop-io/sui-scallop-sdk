import { BaseRepository } from '../base.js';
import {
  getAssetOraclesFromOnChain,
  getOnDemandAggObjectIdsFromOnChain,
  getPriceUpdatePoliciesFromOnChain,
} from './helpers.js';
import {
  XOracleMetadata,
  XOracleRepoArgs,
  XOracleRepoContext,
} from './types.js';

export class XOracleRepository extends BaseRepository<
  XOracleRepoContext,
  XOracleMetadata
> {
  constructor(args: XOracleRepoArgs) {
    super(args);
  }

  get context() {
    return this.baseContext;
  }

  /**
   * Return supported primary and secondary oracles for supported assets
   */
  getAssetOracles() {
    return getAssetOraclesFromOnChain(this.context);
  }

  /** Primary/secondary price-update-policy dynamic fields. */
  getPriceUpdatePolicies() {
    return getPriceUpdatePoliciesFromOnChain(this.context);
  }

  /** Switchboard on-demand aggregator object ids for the given coins. */
  getOnDemandAggObjectIds(coinNames: string[]) {
    return getOnDemandAggObjectIdsFromOnChain(this.context, coinNames);
  }
}
