/**
 * obligations by owner
 * obligation by id
 * obligation accounts raw/normalized (moved to service due to requiring multiple repos)
 * binded obligation lookup maybe if obligation-domain
 */

import { BaseRepository } from '../base.js';
import {
  getBindedObligation,
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
  declare protected readonly metadata: ObligationRepoMetadata;
  constructor(args: ObligationRepoArgs) {
    super(args);
  }

  get context() {
    return {
      ...this.baseContext,
      metadata: this.metadata,
    };
  }

  getObligations(address: string) {
    return getObligationsFromOnChain(this.context, { address });
  }

  getObligationData(obligationId: string) {
    return queryObligationData(this.context, obligationId);
  }

  getBindedObligation(veScaKey: string) {
    return getBindedObligation(this.context, veScaKey);
  }
}
