import { BaseRepository } from '../base.js';
import { getVeScaLoyaltyProgramInfosOnChain } from './helpers.js';
import {
  VeScaLoyaltyProgramRepoArgs,
  VeScaLoyaltyProgramRepoContext,
  VeScaLoyaltyProgramRepoMetadata,
} from './types.js';

export class VeScaLoyaltyProgramRepository extends BaseRepository<
  VeScaLoyaltyProgramRepoContext,
  VeScaLoyaltyProgramRepoMetadata
> {
  declare protected readonly metadata: VeScaLoyaltyProgramRepoMetadata;
  constructor(args: VeScaLoyaltyProgramRepoArgs) {
    super(args);
  }

  get context() {
    return {
      ...this.baseContext,
      metadata: this.metadata,
    };
  }

  getVeScaLoyaltyProgramInfos(veScaKey?: string) {
    return getVeScaLoyaltyProgramInfosOnChain(this.context, veScaKey);
  }
}
