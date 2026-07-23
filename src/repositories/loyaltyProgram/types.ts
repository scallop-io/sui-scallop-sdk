import { AddressesInterface } from 'src/types/address.js';
import { GrpcDataSource } from 'src/datasources/grpc.js';
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
  grpc: GrpcDataSource;
};
export type QueryUserRewardContext = BaseContext & {
  grpc: GrpcDataSource;
};

export type LoyaltyProgramRepoContext = BaseContext & {
  grpc: GrpcDataSource;
  metadata: LoyaltyProgramRepoMetadata;
};

export type LoyaltyProgramRepoParams = BaseRepoParams & {
  grpc: GrpcDataSource;
  metadata: LoyaltyProgramRepoMetadata;
};

export type LoyaltyProgramInfo = {
  pendingReward: number;
  totalPoolReward: number;
  isClaimEnabled: boolean;
};
