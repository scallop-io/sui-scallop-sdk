/**
 * obligations by owner
 * obligation by id
 * obligation accounts raw/normalized (moved to service due to requiring multiple repos)
 */

import { BaseRepository } from '../base.js';
import {
  getObligationLockedFromOnChain,
  getObligationsFromOnChain,
  queryObligationData,
} from './helpers.js';
import {
  ObligationRepoArgs,
  ObligationRepoContext,
  ObligationRepoMetadata,
} from './types.js';

export class ObligationRepository extends BaseRepository<
  ObligationRepoContext,
  ObligationRepoMetadata
> {
  constructor(args: ObligationRepoArgs) {
    super(args);
  }

  get context() {
    return this.baseContext;
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
}
