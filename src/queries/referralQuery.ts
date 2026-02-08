import type { ScallopAddress, ScallopSuiKit } from 'src/models/index.js';

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
  const jsonData = referralBindObject?.json as any;

  if (jsonData?.dataType !== 'moveObject') return null;

  const fields = jsonData.fields as any;
  return fields.value;
};
