import { AddressesInterface } from 'src/types/address.js';
import { OnChainDataSource } from 'src/datasources/onchain.js';
import { BaseContext, BaseRepoParams } from '../types.js';

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

export type QueryRewardPoolContext = BaseContext & {
  onchain: OnChainDataSource;
};

export type QueryUserRewardContext = BaseContext & {
  onchain: OnChainDataSource;
  metadata: {
    addresses: VeScaLoyaltyProgramAddresses<'veScaRewardTableId'>;
  };
};

export type VeScaLoyaltyProgramRepoContext = BaseContext & {
  onchain: OnChainDataSource;
  metadata: VeScaLoyaltyProgramRepoMetadata;
};

export type VeScaLoyaltyProgramRepoParams = BaseRepoParams & {
  onchain: OnChainDataSource;
  metadata: VeScaLoyaltyProgramRepoMetadata;
};

export type VeScaLoyaltyProgramInfo = {
  pendingVeScaReward: number;
  pendingScaReward: number;
  totalPoolReward: number;
  isClaimEnabled: boolean;
};
