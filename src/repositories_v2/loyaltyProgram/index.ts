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
  declare protected readonly metadata: LoyaltyProgramRepoMetadata;

  constructor(args: LoyaltyProgramRepoArgs) {
    super(args);
  }

  get context() {
    return {
      ...this.baseContext,
      metadata: this.metadata,
    };
  }

  getLoyaltyProgramInfos(veScaKey: string) {
    return getLoyaltyProgramInfosOnChain(this.context, veScaKey);
  }
}
