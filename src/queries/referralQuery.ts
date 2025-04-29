import type { ScallopConstants, ScallopSuiKit } from 'src/models';

/**
 * Query the veScaKeyId from the referral bindings table using the borrower address
 * @param query
 * @returns
 */
export const queryVeScaKeyIdFromReferralBindings = async (
  {
    constants,
    scallopSuiKit,
  }: {
    constants: ScallopConstants;
    scallopSuiKit: ScallopSuiKit;
  },
  refereeAddress: string
): Promise<string | null> => {
  const referralBindingTableId = constants.get('referral.bindingTableId');
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
