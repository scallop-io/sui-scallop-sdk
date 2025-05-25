import { SuiObjectData } from '@mysten/sui/client';
import BigNumber from 'bignumber.js';
import { MAX_LOCK_DURATION } from 'src/constants';
import { ScallopQuery } from 'src/models';
import { LoyaltyProgramInfo, VeScaLoyaltyProgramInfo } from 'src/types';
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
  const rewardPoolObject = await query.scallopSuiKit.queryGetObject(rewardPool);

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
  veScaKey = veScaKey ?? (await query.getVeScas())[0]?.keyObject;
  if (!veScaKey) return result;

  const userRewardTableId = query.address.get(
    'loyaltyProgram.userRewardTableId'
  );

  const userRewardObject = await query.scallopSuiKit.queryGetDynamicFieldObject(
    {
      parentId: userRewardTableId,
      name: {
        type: '0x2::object::ID',
        value: typeof veScaKey === 'string' ? veScaKey : veScaKey.objectId,
      },
    }
  );

  if (userRewardObject?.data?.content?.dataType !== 'moveObject') return result;
  const userRewardFields = userRewardObject.data.content.fields;
  result.pendingReward = userRewardFieldsZod.parse(
    userRewardFields
  ) as UserRewardFields;
  return result;
};

const veScaRewardPoolFieldsZod = zod
  .object({
    reserve_ve_sca_key: zod.nullable(
      zod.object({
        fields: zod.object({
          id: zod.object({
            id: zod.string(),
          }),
        }),
        type: zod.string(),
      })
    ),
    enable_claim: zod.boolean(),
  })
  .transform((value) => ({
    reserveVeScaKey: value.reserve_ve_sca_key?.fields.id.id,
    isClaimEnabled: value.enable_claim,
  }));

const userVeScaRewardFieldsZod = zod
  .object({
    value: zod.string(),
  })
  .transform((value) => BigNumber(value.value).shiftedBy(-9).toNumber());

type VeScaRewardPoolFields = zod.infer<typeof veScaRewardPoolFieldsZod>;
type UserVeScaRewardFields = zod.infer<typeof userVeScaRewardFieldsZod>;

export const getVeScaLoyaltyProgramInformations = async (
  query: ScallopQuery,
  veScaKey?: string | SuiObjectData
): Promise<VeScaLoyaltyProgramInfo | null> => {
  const rewardPool = query.address.get('veScaLoyaltyProgram.veScaRewardPool');

  // get fields from rewardPool object
  const rewardPoolObject = await query.scallopSuiKit.queryGetObject(rewardPool);

  if (rewardPoolObject?.data?.content?.dataType !== 'moveObject') return null;
  const rewardPoolFields = rewardPoolObject.data.content.fields;
  const { isClaimEnabled, reserveVeScaKey } = veScaRewardPoolFieldsZod.parse(
    rewardPoolFields
  ) as VeScaRewardPoolFields;

  const result: VeScaLoyaltyProgramInfo = {
    pendingVeScaReward: 0,
    pendingScaReward: 0,
    totalPoolReward: 0,
    isClaimEnabled,
  };

  let reserveVeSca;
  // calculate totalPoolreward from reserveVeScaKey
  if (reserveVeScaKey) {
    reserveVeSca = await query.getVeSca(reserveVeScaKey);
    result.totalPoolReward = reserveVeSca?.currentVeScaBalance ?? 0;
  }

  // query the user pending reward if exist
  veScaKey = veScaKey ?? (await query.getVeScas())[0]?.keyObject;
  if (!veScaKey) return result;

  const veScaRewardTableId = query.address.get(
    'veScaLoyaltyProgram.veScaRewardTableId'
  );

  const userRewardObject = await query.scallopSuiKit.queryGetDynamicFieldObject(
    {
      parentId: veScaRewardTableId,
      name: {
        type: '0x2::object::ID',
        value: typeof veScaKey === 'string' ? veScaKey : veScaKey.objectId,
      },
    }
  );

  if (userRewardObject?.data?.content?.dataType !== 'moveObject') return result;
  const userRewardFields = userRewardObject.data.content.fields;
  result.pendingScaReward = userVeScaRewardFieldsZod.parse(
    userRewardFields
  ) as UserVeScaRewardFields;

  const remainingLockPeriodInMilliseconds = Math.max(
    (reserveVeSca?.unlockAt ?? 0) - Date.now(),
    0
  );

  result.pendingVeScaReward =
    result.pendingScaReward *
    (Math.floor(remainingLockPeriodInMilliseconds / 1000) / MAX_LOCK_DURATION);

  return result;
};
