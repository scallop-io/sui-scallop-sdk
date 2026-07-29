import { AddressesInterface } from 'src/types/address.js';
import { GrpcDataSource } from 'src/datasources/grpc.js';
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
  grpc: GrpcDataSource;
};

export type QueryUserRewardContext = BaseContext & {
  grpc: GrpcDataSource;
  metadata: {
    addresses: VeScaLoyaltyProgramAddresses<'veScaRewardTableId'>;
  };
};

export type VeScaLoyaltyProgramRepoContext = BaseContext & {
  grpc: GrpcDataSource;
  metadata: VeScaLoyaltyProgramRepoMetadata;
};

export type VeScaLoyaltyProgramRepoParams = BaseRepoParams & {
  grpc: GrpcDataSource;
  metadata: VeScaLoyaltyProgramRepoMetadata;
};

export type VeScaLoyaltyProgramInfo = {
  pendingVeScaReward: number;
  pendingScaReward: number;
  totalPoolReward: number;
  isClaimEnabled: boolean;
};
