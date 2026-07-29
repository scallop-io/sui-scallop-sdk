import { BaseRepository } from '../base.js';
import { OnChainDataSource } from 'src/datasources/onchain.js';
import {
  getAssetOraclesFromOnChain,
  getOnDemandAggObjectIdsFromOnChain,
  getPriceUpdatePoliciesFromOnChain,
} from './helpers.js';
import {
  XOracleMetadata,
  XOracleRepoParams,
  XOracleRepoContext,
} from './types.js';

export class XOracleRepository extends BaseRepository<
  XOracleRepoContext,
  XOracleMetadata
> {
  private readonly onchain: OnChainDataSource;

  constructor({ onchain, ...params }: XOracleRepoParams) {
    super(params);
    this.onchain = onchain;
  }

  get context() {
    return { ...this.baseContext, onchain: this.onchain };
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
