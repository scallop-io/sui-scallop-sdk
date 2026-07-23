import { BaseRepository } from '../base.js';
import { GrpcDataSource } from 'src/datasources/grpc.js';
import { getVeScaKeyIdFromRefBindingsFromOnChain } from './helper.js';
import {
  ReferralRepoParams,
  ReferralRepoContext,
  ReferralRepoMetadata,
} from './types.js';

export class ReferralRepository extends BaseRepository<
  ReferralRepoContext,
  ReferralRepoMetadata
> {
  private readonly grpc: GrpcDataSource;

  constructor({ grpc, ...params }: ReferralRepoParams) {
    super(params);
    this.grpc = grpc;
  }

  get context() {
    return { ...this.baseContext, grpc: this.grpc };
  }

  getVeScaKeyIdFromReferralBindings(refereeAddress: string) {
    return getVeScaKeyIdFromRefBindingsFromOnChain(
      this.context,
      refereeAddress
    );
  }
}
