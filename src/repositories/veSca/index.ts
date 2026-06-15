import { BaseRepository } from '../base.js';
import {
  getVeScaDataFromOnChain,
  getVeScasByAddressFromOnChain,
  getVeScaTreasuryInfoFromOnChain,
} from './helpers.js';
import { VeScaRepoArgs, VeScaRepoContext, VeScaRepoMetadata } from './types.js';

export class VeScaRepository extends BaseRepository<
  VeScaRepoContext,
  VeScaRepoMetadata
> {
  constructor(args: VeScaRepoArgs) {
    super(args);
  }

  get context() {
    return this.baseContext;
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
}
