import { GrpcDataSource } from 'src/datasources/grpc.js';
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
  private readonly grpc: GrpcDataSource;

  constructor({ grpc, ...params }: LoyaltyProgramRepoParams) {
    super(params);
    this.grpc = grpc;
  }

  get context() {
    return { ...this.baseContext, grpc: this.grpc };
  }

  getLoyaltyProgramInfos(veScaKey?: string) {
    return getLoyaltyProgramInfosOnChain(this.context, veScaKey);
  }
}
