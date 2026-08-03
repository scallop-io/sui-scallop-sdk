import { SuiObjectArg } from '@scallop-io/sui-kit';
import { ScallopParseError } from 'src/errors/ScallopParseError.js';
import ScallopBuilder from 'src/models/scallopBuilder/index.js';
import type { ReadTransport } from 'src/models/scallopQuery/types.js';

export const getObligationCoinNames = async (
  builder: ScallopBuilder<ReadTransport>,
  obligationId: SuiObjectArg
) => {
  const id =
    typeof obligationId === 'string'
      ? obligationId
      : 'objectId' in obligationId
        ? obligationId.objectId
        : undefined;
  if (id === undefined) {
    throw new ScallopParseError(
      'getObligationCoinNames expects an object id (string) or an object reference'
    );
  }
  const obligation = await builder.query.repos.obligation.getObligationData(id);
  if (!obligation) return undefined;

  const collateralCoinTypes = obligation.collaterals.map((collateral) => {
    return collateral.type;
  });
  const debtCoinTypes = obligation.debts.map((debt) => {
    return debt.type;
  });
  const obligationCoinTypes = [
    ...new Set([...collateralCoinTypes, ...debtCoinTypes]),
  ];
  const obligationCoinNames = obligationCoinTypes.map((coinType) => {
    return builder.utils.parseCoinNameFromType(coinType);
  });
  return obligationCoinNames;
};
