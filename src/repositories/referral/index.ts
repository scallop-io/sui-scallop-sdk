import { BaseRepository } from '../base.js';
import { getVeScaKeyIdFromRefBindingsFromOnChain } from './helper.js';
import {
  ReferralRepoArgs,
  ReferralRepoContext,
  ReferralRepoMetadata,
} from './types.js';

export class ReferralRepository extends BaseRepository<
  ReferralRepoContext,
  ReferralRepoMetadata
> {
  constructor(args: ReferralRepoArgs) {
    super(args);
  }

  get context() {
    return this.baseContext;
  }

  getVeScaKeyIdFromReferralBindings(refereeAddress: string) {
    return getVeScaKeyIdFromRefBindingsFromOnChain(
      this.context,
      refereeAddress
    );
  }
}
