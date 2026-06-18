import { OnChainDataSource } from 'src/datasources/onchain.js';
import { BaseRepository } from '../base.js';
import { getVeScaLoyaltyProgramInfosOnChain } from './helpers.js';
import {
  VeScaLoyaltyProgramRepoParams,
  VeScaLoyaltyProgramRepoContext,
  VeScaLoyaltyProgramRepoMetadata,
} from './types.js';

export class VeScaLoyaltyProgramRepository extends BaseRepository<
  VeScaLoyaltyProgramRepoContext,
  VeScaLoyaltyProgramRepoMetadata
> {
  private readonly onchain: OnChainDataSource;

  constructor({ onchain, ...params }: VeScaLoyaltyProgramRepoParams) {
    super(params);
    this.onchain = onchain;
  }

  get context() {
    return { ...this.baseContext, onchain: this.onchain };
  }

  getVeScaLoyaltyProgramInfos(veScaKey?: string) {
    return getVeScaLoyaltyProgramInfosOnChain(this.context, veScaKey);
  }
}
