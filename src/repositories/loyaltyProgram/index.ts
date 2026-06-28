import { OnChainDataSource } from 'src/datasources/onchain.js';
import { BaseRepository } from '../base.js';
import { getLoyaltyProgramInfosOnChain } from './helpers.js';
import {
  LoyaltyProgramRepoParams,
  LoyaltyProgramRepoContext,
  LoyaltyProgramRepoMetadata,
} from './types.js';

export class LoyaltyProgramRepository extends BaseRepository<
  LoyaltyProgramRepoContext,
  LoyaltyProgramRepoMetadata
> {
  private readonly onchain: OnChainDataSource;

  constructor({ onchain, ...params }: LoyaltyProgramRepoParams) {
    super(params);
    this.onchain = onchain;
  }

  get context() {
    return { ...this.baseContext, onchain: this.onchain };
  }

  getLoyaltyProgramInfos(veScaKey?: string) {
    return getLoyaltyProgramInfosOnChain(this.context, veScaKey);
  }
}
