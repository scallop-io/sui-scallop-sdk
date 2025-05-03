import type { ScallopAddress, ScallopSuiKit } from 'src/models';

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

  if (referralBindResponse?.data?.content?.dataType !== 'moveObject')
    return null;

  const fields = referralBindResponse.data.content.fields as any;
  return fields.value;
};
