import { AddressesInterface } from 'src/types/address.js';
import { BaseContext, BaseRepoArgs } from '../types.js';

type VeScaKeys = 'tableId';
type VeScaAddresses<T extends VeScaKeys = VeScaKeys> = {
  veSca: Pick<AddressesInterface['vesca'], T>;
};

type VeScaLoyaltyProgramKeys = 'veScaRewardPool' | 'veScaRewardTableId';
type VeScaLoyaltyProgramAddresses<
  T extends VeScaLoyaltyProgramKeys = VeScaLoyaltyProgramKeys,
> = {
  veScaLoyaltyProgram: Pick<AddressesInterface['veScaLoyaltyProgram'], T>;
};

export type VeScaLoyaltyProgramRepoMetadata = {
  addresses: VeScaAddresses & VeScaLoyaltyProgramAddresses;
};

export type QueryRewardPoolContext = BaseContext;

export type QueryUserRewardContext = BaseContext & {
  metadata: {
    addresses: VeScaLoyaltyProgramAddresses<'veScaRewardTableId'>;
  };
};

export type VeScaLoyaltyProgramRepoContext = BaseContext & {
  metadata: VeScaLoyaltyProgramRepoMetadata;
};

export type VeScaLoyaltyProgramRepoArgs = BaseRepoArgs & {
  metadata: VeScaLoyaltyProgramRepoMetadata;
};

export type VeScaLoyaltyProgramInfo = {
  pendingVeScaReward: number;
  pendingScaReward: number;
  totalPoolReward: number;
  isClaimEnabled: boolean;
};
