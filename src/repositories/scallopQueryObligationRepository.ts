import type { SuiObjectArg } from '@scallop-io/sui-kit';
import type ScallopQuery from 'src/models/scallopQuery.js';
import type { ObligationRepository } from './obligationRepository.js';

export const createScallopQueryObligationRepository = (
  query: ScallopQuery
): ObligationRepository => ({
  getObligations: (ownerAddress?: string) => query.getObligations(ownerAddress),
  queryObligation: (obligationId: SuiObjectArg) =>
    query.queryObligation(obligationId),
});
