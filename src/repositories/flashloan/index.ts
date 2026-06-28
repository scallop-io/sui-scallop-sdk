/**
 * Flashloan Fees
 */

import { BaseRepository } from '../base.js';
import { OnChainDataSource } from '../../datasources/onchain.js';
import { getFlashloanFeesFromOnChain } from './helpers.js';
import {
  FlashloanMetadata,
  FlashloanRepoParams,
  FlashloanRepoContext,
} from './types.js';

export class FlashloanRepository extends BaseRepository<
  FlashloanRepoContext,
  FlashloanMetadata
> {
  private readonly onchain: OnChainDataSource;

  constructor({ onchain, ...params }: FlashloanRepoParams) {
    super(params);
    this.onchain = onchain;
  }

  get context() {
    return { ...this.baseContext, onchain: this.onchain };
  }

  getFlashloanFees(assetNames: string[]) {
    return getFlashloanFeesFromOnChain(this.context, {
      assetNames,
    });
  }
}
