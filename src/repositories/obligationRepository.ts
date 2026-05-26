import type { SuiObjectArg } from '@scallop-io/sui-kit';
import type { MappedObligationQueryData } from 'src/mappers/index.js';
import type { Obligation } from 'src/types/index.js';

export interface ObligationRepository {
  getObligations(ownerAddress?: string): Promise<Obligation[]>;
  queryObligation(
    obligationId: SuiObjectArg
  ): Promise<MappedObligationQueryData | undefined>;
}
