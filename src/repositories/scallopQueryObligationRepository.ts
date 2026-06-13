import type { SuiObjectArg } from '@scallop-io/sui-kit';
import type ScallopQuery from 'src/models/scallopQuery.js';
import type { ObligationRepository } from './obligationRepository.js';

/**
 * Compatibility adapter, not a real data-source repository.
 *
 * This wraps the public `ScallopQuery` facade behind the
 * `ObligationRepository` interface for older tests/internal call sites.
 */
export const createScallopQueryObligationRepository = (
  query: ScallopQuery
): ObligationRepository => ({
  getObligations: (ownerAddress?: string) => query.getObligations(ownerAddress),
  queryObligation: (obligationId: SuiObjectArg) =>
    query.queryObligation(obligationId),
});
