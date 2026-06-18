import { BaseRepository } from '../base.js';
import { OnChainDataSource } from 'src/datasources/onchain.js';
import { getVeScaKeyIdFromRefBindingsFromOnChain } from './helper.js';
import {
  ReferralRepoParams,
  ReferralRepoContext,
  ReferralRepoMetadata,
} from './types.js';

export class ReferralRepository extends BaseRepository<
  ReferralRepoContext,
  ReferralRepoMetadata
> {
  private readonly onchain: OnChainDataSource;

  constructor({ onchain, ...params }: ReferralRepoParams) {
    super(params);
    this.onchain = onchain;
  }

  get context() {
    return { ...this.baseContext, onchain: this.onchain };
  }

  getVeScaKeyIdFromReferralBindings(refereeAddress: string) {
    return getVeScaKeyIdFromRefBindingsFromOnChain(
      this.context,
      refereeAddress
    );
  }
}
