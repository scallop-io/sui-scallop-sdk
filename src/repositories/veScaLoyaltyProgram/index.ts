import { GrpcDataSource } from 'src/datasources/grpc.js';
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
  private readonly grpc: GrpcDataSource;

  constructor({ grpc, ...params }: VeScaLoyaltyProgramRepoParams) {
    super(params);
    this.grpc = grpc;
  }

  get context() {
    return { ...this.baseContext, grpc: this.grpc };
  }

  getVeScaLoyaltyProgramInfos(veScaKey?: string) {
    return getVeScaLoyaltyProgramInfosOnChain(this.context, veScaKey);
  }
}
