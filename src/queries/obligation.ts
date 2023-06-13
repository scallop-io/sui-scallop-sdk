import { SuiKit, SuiTxBlock } from '@scallop-io/sui-kit';
import { ScallopAddress } from '../models';
import { ObligationInterface } from '../types';

export const queryObligation = async (
  obligationId: string,
  scallopAddress: ScallopAddress,
  suiKit: SuiKit
) => {
  const packageId = scallopAddress.get('core.packages.query.id');
  const queryTarget = `${packageId}::obligation_query::obligation_data`;
  const txBlock = new SuiTxBlock();
  txBlock.moveCall(queryTarget, [obligationId]);
  const queryResult = await suiKit.inspectTxn(txBlock);
  return queryResult.events[0].parsedJson as ObligationInterface;
};

export const getObligations = async (
  ownerAddress: string,
  scallopAddress: ScallopAddress,
  suiKit: SuiKit
) => {
  const owner = ownerAddress || suiKit.currentAddress();
  const keyObjectRefs = await suiKit.provider().getOwnedObjects({
    owner,
    filter: {
      StructType: `${scallopAddress.get(
        'core.packages.protocol.id'
      )}::obligation::ObligationKey`,
    },
  });
  const keyIds = keyObjectRefs.data
    .map((ref: any) => ref?.data?.objectId)
    .filter((id: any) => id !== undefined) as string[];
  const keyObjects = await suiKit.getObjects(keyIds);
  const obligations: { id: string; keyId: string }[] = [];
  for (const keyObject of keyObjects) {
    const keyId = keyObject.objectId;
    const fields = keyObject.objectFields as any;
    const obligationId = fields['ownership']['fields']['of'];
    obligations.push({ id: obligationId, keyId });
  }
  return obligations;
};
