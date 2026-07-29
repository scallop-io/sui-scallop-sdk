import { BaseRepository } from '../base.js';
import { GrpcDataSource } from 'src/datasources/grpc.js';
import {
  getVeScaDataFromOnChain,
  getVeScasByAddressBatchedFromOnChain,
  getVeScasByAddressFromOnChain,
  getVeScaTreasuryInfoFromOnChain,
  isVeScaKeyInSubsTableFromOnChain,
} from './helpers.js';
import {
  VeScaRepoParams,
  VeScaRepoContext,
  VeScaRepoMetadata,
} from './types.js';
import { runByReadTransport } from '../utils.js';

export class VeScaRepository extends BaseRepository<
  VeScaRepoContext,
  VeScaRepoMetadata
> {
  private readonly grpc: GrpcDataSource;
  private readonly preferGraphql: boolean;

  constructor({ grpc, preferGraphql = false, ...params }: VeScaRepoParams) {
    super(params);
    this.grpc = grpc;
    this.preferGraphql = preferGraphql;
  }

  get context() {
    return { ...this.baseContext, grpc: this.grpc };
  }

  getVeSca(veScaKey: string) {
    return getVeScaDataFromOnChain(this.context, veScaKey);
  }

  getVeScasByAddress({
    address,
    excludeEmpty = true,
  }: {
    address: string;
    excludeEmpty?: boolean;
  }) {
    const ctx = this.context;
    // Under the GraphQL transport, prefer the batched derive-ids + one
    // `getObjects` read (N→1); fall back to the per-key `getDynamicField` path.
    return runByReadTransport({
      preferGraphql: this.preferGraphql,
      logger: this.logger,
      label: 'VeScaRepository.getVeScasByAddress',
      graphql: () =>
        getVeScasByAddressBatchedFromOnChain(ctx, { address, excludeEmpty }),
      onchain: () =>
        getVeScasByAddressFromOnChain(ctx, { address, excludeEmpty }),
    });
  }

  getVeScaTreasuryInfo() {
    return getVeScaTreasuryInfoFromOnChain(this.context);
  }

  isVeScaKeyInSubsTable(veScaKey: string, tableId: string) {
    return isVeScaKeyInSubsTableFromOnChain(this.context, {
      veScaKey,
      tableId,
    });
  }
}
