import { AddressesInterface } from 'src/types/address.js';
import { BaseContext, BaseRepoArgs } from '../type.js';

type LoyaltyProgramKeys = 'rewardPool';
type LoyaltyProgramAddresses<
  T extends LoyaltyProgramKeys = LoyaltyProgramKeys,
> = {
  loyaltyProgram: Pick<AddressesInterface['loyaltyProgram'], T>;
};

export type LoyaltyProgramRepoMetadata = {
  addresses: LoyaltyProgramAddresses;
};

export type QueryRewardPoolContext = BaseContext;
export type QueryUserRewardContext = BaseContext;

export type LoyaltyProgramRepoContext = BaseContext & {
  metadata: LoyaltyProgramRepoMetadata;
};

export type LoyaltyProgramRepoArgs = BaseRepoArgs & {
  metadata: LoyaltyProgramRepoMetadata;
};

export type LoyaltyProgramInfo = {
  pendingReward: number;
  totalPoolReward: number;
  isClaimEnabled: boolean;
};
