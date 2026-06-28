import { SuiClientTypes } from '@mysten/sui/client';
import { getDynamicFieldOrNull } from '../utils.js';
import { ReferralBindingContext } from './types.js';
import { encodeDynamicFieldNameForV2 } from 'src/utils/dynamicField.js';
import { ReferrerVeScaKeyBcs } from './bcs.js';

export const getVeScaKeyIdFromRefBindingsFromOnChain = async (
  ctx: ReferralBindingContext,
  refereeAddress: string
) => {
  const {
    metadata: { addresses },
  } = ctx;
  const fetchOptions: SuiClientTypes.GetDynamicFieldOptions = {
    parentId: addresses.referral.bindingTableId,
    name: encodeDynamicFieldNameForV2({
      type: 'address',
      value: refereeAddress,
    }),
  };
  const result = await getDynamicFieldOrNull(ctx, fetchOptions);
  if (!result) return null;
  return ReferrerVeScaKeyBcs.parse(result.dynamicField.value.bcs);
};
