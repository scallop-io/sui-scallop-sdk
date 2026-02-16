import type { ScallopAddress, ScallopSuiKit } from 'src/models/index.js';
import { parseObjectAs } from 'src/utils/index.js';

/**
 * Query the veScaKeyId from the referral bindings table using the borrower address
 * @param query
 * @returns
 */
export const queryVeScaKeyIdFromReferralBindings = async (
  {
    address,
    scallopSuiKit,
  }: {
    address: ScallopAddress;
    scallopSuiKit: ScallopSuiKit;
  },
  refereeAddress: string
): Promise<string | null> => {
  const referralBindingTableId = address.get('referral.bindingTableId');
  const referralBindResponse = await scallopSuiKit.queryGetDynamicFieldObject({
    parentId: referralBindingTableId,
    name: {
      type: 'address',
      value: refereeAddress,
    },
  });

  const referralBindObject = referralBindResponse?.object;
  if (!referralBindObject) return null;

  const value = parseObjectAs<unknown>(referralBindObject);
  if (typeof value === 'string') return value;

  if (value && typeof value === 'object') {
    const asObj = value as Record<string, unknown>;
    if (typeof asObj.id === 'string') return asObj.id;
    const nestedId = (asObj.id as Record<string, unknown> | undefined)?.id;
    if (typeof nestedId === 'string') return nestedId;
  }

  return null;
};
