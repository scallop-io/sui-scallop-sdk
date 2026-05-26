import type { ObligationQueryInterface } from 'src/types/index.js';
import { mapTypeNameField } from './moveTypeMapper.js';

export type MappedObligationQueryData = {
  collaterals: Array<
    Omit<ObligationQueryInterface['collaterals'][number], 'type'> & {
      type: string;
    }
  >;
  debts: Array<
    Omit<ObligationQueryInterface['debts'][number], 'type'> & {
      type: string;
    }
  >;
};

export const mapObligationEventToObligationData = (
  raw: ObligationQueryInterface | undefined
): MappedObligationQueryData | undefined => {
  if (!raw) return undefined;

  return {
    ...raw,
    collaterals: (raw.collaterals ?? []).map((collateral, index) => ({
      ...collateral,
      type: mapTypeNameField(
        collateral.type,
        `obligation.collaterals[${index}].type`
      ),
    })),
    debts: (raw.debts ?? []).map((debt, index) => ({
      ...debt,
      type: mapTypeNameField(debt.type, `obligation.debts[${index}].type`),
    })),
  };
};
