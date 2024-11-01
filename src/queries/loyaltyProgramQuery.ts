import { SuiObjectData } from '@mysten/sui/client';
import BigNumber from 'bignumber.js';
import { ScallopQuery } from 'src/models';
import { LoyaltyProgramInfo } from 'src/types';
import { z as zod } from 'zod';

const rewardPoolFieldsZod = zod
  .object({
    balance: zod.string(),
    enable_claim: zod.boolean(),
  })
  .transform((value) => ({
    totalPoolReward: BigNumber(value.balance).shiftedBy(-9).toNumber(),
    isClaimEnabled: value.enable_claim,
  }));

const userRewardFieldsZod = zod
  .object({
    value: zod.string(),
  })
  .transform((value) => BigNumber(value.value).shiftedBy(-9).toNumber());

type RewardPoolFields = zod.infer<typeof rewardPoolFieldsZod>;
type UserRewardFields = zod.infer<typeof userRewardFieldsZod>;

/**
 * Get user's loyalty program information and pending rewards if exists
 * @param query
 * @param veScaKey
 * @returns
 */
export const getLoyaltyProgramInformations = async (
  query: ScallopQuery,
  veScaKey?: string | SuiObjectData
): Promise<LoyaltyProgramInfo | null> => {
  const rewardPool = query.address.get('loyaltyProgram.rewardPool');

  // get fields from rewardPool object
  const rewardPoolObject = await query.cache.queryGetObject(rewardPool, {
    showContent: true,
  });

  if (rewardPoolObject?.data?.content?.dataType !== 'moveObject') return null;
  const rewardPoolFields = rewardPoolObject.data.content.fields;
  const { isClaimEnabled, totalPoolReward } = rewardPoolFieldsZod.parse(
    rewardPoolFields
  ) as RewardPoolFields;

  const result: LoyaltyProgramInfo = {
    pendingReward: 0,
    totalPoolReward,
    isClaimEnabled,
  };

  // query the user pending reward if exist
  veScaKey = veScaKey || (await query.getVeScas())[0]?.keyObject;
  if (!veScaKey) return result;

  const userRewardTableId = query.address.get(
    'loyaltyProgram.userRewardTableId'
  );

  const userRewardObject = await query.cache.queryGetDynamicFieldObject({
    parentId: userRewardTableId,
    name: {
      type: '0x2::object::ID',
      value: typeof veScaKey === 'string' ? veScaKey : veScaKey.objectId,
    },
  });

  if (userRewardObject?.data?.content?.dataType !== 'moveObject') return result;
  const userRewardFields = userRewardObject.data.content.fields;
  result.pendingReward = userRewardFieldsZod.parse(
    userRewardFields
  ) as UserRewardFields;
  return result;
};
