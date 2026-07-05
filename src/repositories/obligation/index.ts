/**
 * obligations by owner
 * obligation by id
 * obligation accounts raw/normalized (moved to service due to requiring multiple repos)
 */

import { BaseRepository } from '../base.js';
import { OnChainDataSource } from 'src/datasources/onchain.js';
import {
  getObligationLockedFromOnChain,
  getObligationNamesFromOnChain,
  getObligationObjectsFromOnChain,
  getObligationsFromOnChain,
  queryObligationData,
} from './helpers.js';
import {
  ObligationRepoParams,
  ObligationRepoContext,
  ObligationRepoMetadata,
} from './types.js';

export class ObligationRepository extends BaseRepository<
  ObligationRepoContext,
  ObligationRepoMetadata
> {
  private readonly onchain: OnChainDataSource;

  constructor({ onchain, ...params }: ObligationRepoParams) {
    super(params);
    this.onchain = onchain;
  }

  get context() {
    return { ...this.baseContext, onchain: this.onchain };
  }

  getObligations(address: string) {
    return getObligationsFromOnChain(this.context, { address });
  }

  getObligationData(obligationId: string) {
    return queryObligationData(this.context, obligationId);
  }

  getObligationLocked(obligationId: string) {
    return getObligationLockedFromOnChain(this.context, obligationId);
  }

  getObligationObjects(ids: string[]) {
    return getObligationObjectsFromOnChain(this.context, ids);
  }

  getObligationNames(address: string) {
    return getObligationNamesFromOnChain(this.context, address);
  }
}
