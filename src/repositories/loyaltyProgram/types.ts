import { AddressesInterface } from 'src/types/address.js';
import { OnChainDataSource } from 'src/datasources/onchain.js';
import { BaseContext, BaseRepoParams } from '../types.js';

type LoyaltyProgramKeys = 'rewardPool';
type LoyaltyProgramAddresses<
  T extends LoyaltyProgramKeys = LoyaltyProgramKeys,
> = {
  loyaltyProgram: Pick<AddressesInterface['loyaltyProgram'], T>;
};

export type LoyaltyProgramRepoMetadata = {
  addresses: LoyaltyProgramAddresses;
};

export type QueryRewardPoolContext = BaseContext & {
  onchain: OnChainDataSource;
};
export type QueryUserRewardContext = BaseContext & {
  onchain: OnChainDataSource;
};

export type LoyaltyProgramRepoContext = BaseContext & {
  onchain: OnChainDataSource;
  metadata: LoyaltyProgramRepoMetadata;
};

export type LoyaltyProgramRepoParams = BaseRepoParams & {
  onchain: OnChainDataSource;
  metadata: LoyaltyProgramRepoMetadata;
};

export type LoyaltyProgramInfo = {
  pendingReward: number;
  totalPoolReward: number;
  isClaimEnabled: boolean;
};
