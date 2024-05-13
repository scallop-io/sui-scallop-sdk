import { ScallopQuery } from 'src/models';

/**
 * Query the veScaKeyId from the referral bindings table using the borrower address
 * @param query
 * @returns
 */
export const queryVeScaKeyIdFromReferralBindings = async (
  query: ScallopQuery,
  senderAddress: string
): Promise<string | null> => {
  const referralBindingTableId = query.address.get('referral.bindingTableId');

  const referralBindResponse = await query.cache.queryGetDynamicFieldObject({
    parentId: referralBindingTableId,
    name: {
      type: 'address',
      value: senderAddress,
    },
  });

  if (referralBindResponse.data?.content?.dataType !== 'moveObject')
    return null;

  const fields = referralBindResponse.data.content.fields as any;
  return fields.value;
};
