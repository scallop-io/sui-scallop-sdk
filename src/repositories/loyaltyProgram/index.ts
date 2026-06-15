import { BaseRepository } from '../base.js';
import { getLoyaltyProgramInfosOnChain } from './helpers.js';
import {
  LoyaltyProgramRepoArgs,
  LoyaltyProgramRepoContext,
  LoyaltyProgramRepoMetadata,
} from './types.js';

export class LoyaltyProgramRepository extends BaseRepository<
  LoyaltyProgramRepoContext,
  LoyaltyProgramRepoMetadata
> {
  constructor(args: LoyaltyProgramRepoArgs) {
    super(args);
  }

  get context() {
    return this.baseContext;
  }

  getLoyaltyProgramInfos(veScaKey?: string) {
    return getLoyaltyProgramInfosOnChain(this.context, veScaKey);
  }
}
