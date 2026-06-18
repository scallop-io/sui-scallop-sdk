import { BaseRepository } from '../base.js';
import { OnChainDataSource } from 'src/datasources/onchain.js';
import {
  getVeScaDataFromOnChain,
  getVeScasByAddressFromOnChain,
  getVeScaTreasuryInfoFromOnChain,
  isVeScaKeyInSubsTableFromOnChain,
} from './helpers.js';
import {
  VeScaRepoParams,
  VeScaRepoContext,
  VeScaRepoMetadata,
} from './types.js';

export class VeScaRepository extends BaseRepository<
  VeScaRepoContext,
  VeScaRepoMetadata
> {
  private readonly onchain: OnChainDataSource;

  constructor({ onchain, ...params }: VeScaRepoParams) {
    super(params);
    this.onchain = onchain;
  }

  get context() {
    return { ...this.baseContext, onchain: this.onchain };
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
    return getVeScasByAddressFromOnChain(this.context, {
      address,
      excludeEmpty,
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
