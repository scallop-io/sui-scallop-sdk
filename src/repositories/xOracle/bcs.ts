import { bcs, BcsType } from '@mysten/sui/bcs';

const PriceRuleTypeName = bcs.struct('TypeName', { name: bcs.string() });
const VecSet = (T: BcsType<{ name: string }>) =>
  bcs.struct('VecSet', { contents: bcs.vector(T) });

export const PricePolicyRulesVecSet = VecSet(PriceRuleTypeName);
