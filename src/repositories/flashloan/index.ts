/**
 * Flashloan Fees
 */

import { BaseRepository } from '../base.js';
import { getFlashloanFeesFromOnChain } from './helpers.js';
import {
  FlashloanMetadata,
  FlashloanRepoArgs,
  FlashloanRepoContext,
} from './types.js';

export class FlashloanRepository extends BaseRepository<
  FlashloanRepoContext,
  FlashloanMetadata
> {
  constructor(args: FlashloanRepoArgs) {
    super(args);
  }

  get context() {
    return this.baseContext;
  }

  getFlashloanFees(assetNames: string[]) {
    return getFlashloanFeesFromOnChain(this.context, {
      assetNames,
    });
  }
}
