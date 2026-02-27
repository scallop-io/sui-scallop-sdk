import type { SuiObjectData } from 'src/types/index.js';
import { BigNumber } from 'bignumber.js';
import { MAX_LOCK_DURATION } from 'src/constants/index.js';
import { ScallopQuery } from 'src/models/index.js';
import {
  LoyaltyProgramInfo,
  VeScaLoyaltyProgramInfo,
} from 'src/types/index.js';
import { z as zod } from 'zod';
import { parseObjectAs } from 'src/utils/index.js';

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
  .string()
  .transform((value) => BigNumber(value).shiftedBy(-9).toNumber());

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
  const rewardPoolResponse =
    await query.scallopSuiKit.queryGetObject(rewardPool);
  const rewardPoolObject = rewardPoolResponse?.object;
  if (!rewardPoolObject) return null;
  const rewardPoolFields =
    parseObjectAs<Record<string, unknown>>(rewardPoolObject);
  const { isClaimEnabled, totalPoolReward } = rewardPoolFieldsZod.parse(
    rewardPoolFields
  ) as RewardPoolFields;

  const result: LoyaltyProgramInfo = {
    pendingReward: 0,
    totalPoolReward,
    isClaimEnabled,
  };

  // query the user pending reward if exist
  veScaKey = veScaKey ?? (await query.getVeScas())[0]?.keyId;
  if (!veScaKey) return result;

  const userRewardTableId = query.address.get(
    'loyaltyProgram.userRewardTableId'
  );

  const userRewardObject = await query.scallopSuiKit
    .queryGetDynamicFieldObject({
      parentId: userRewardTableId,
      name: {
        type: '0x2::object::ID',
        value: typeof veScaKey === 'string' ? veScaKey : veScaKey.objectId,
      },
    })
    .catch(() => null);

  const userRewardObjData = userRewardObject?.object;
  if (!userRewardObjData) return result;
  const userRewardFields = parseObjectAs<string>(userRewardObjData);
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
  .string()
  .transform((value) => BigNumber(value).shiftedBy(-9).toNumber());

type VeScaRewardPoolFields = zod.infer<typeof veScaRewardPoolFieldsZod>;
type UserVeScaRewardFields = zod.infer<typeof userVeScaRewardFieldsZod>;

export const getVeScaLoyaltyProgramInformations = async (
  query: ScallopQuery,
  veScaKey?: string | SuiObjectData
): Promise<VeScaLoyaltyProgramInfo | null> => {
  const rewardPool = query.address.get('veScaLoyaltyProgram.veScaRewardPool');

  // get fields from rewardPool object
  const rewardPoolResponse =
    await query.scallopSuiKit.queryGetObject(rewardPool);
  const rewardPoolObject = rewardPoolResponse?.object;
  if (!rewardPoolObject) return null;
  const rewardPoolFields =
    parseObjectAs<Record<string, unknown>>(rewardPoolObject);
  const parsedVeScaRewardPool =
    veScaRewardPoolFieldsZod.safeParse(rewardPoolFields);
  const { isClaimEnabled, reserveVeScaKey } = parsedVeScaRewardPool.success
    ? (parsedVeScaRewardPool.data as VeScaRewardPoolFields)
    : {
        isClaimEnabled: false,
        reserveVeScaKey: undefined,
      };

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
  veScaKey = veScaKey ?? (await query.getVeScas())[0]?.keyId;
  if (!veScaKey) return result;

  const veScaRewardTableId = query.address.get(
    'veScaLoyaltyProgram.veScaRewardTableId'
  );

  const userRewardObject = await query.scallopSuiKit
    .queryGetDynamicFieldObject({
      parentId: veScaRewardTableId,
      name: {
        type: '0x2::object::ID',
        value: typeof veScaKey === 'string' ? veScaKey : veScaKey.objectId,
      },
    })
    .catch(() => null);

  const userRewardObjData = userRewardObject?.object;
  if (!userRewardObjData) return result;
  const userRewardFields = parseObjectAs<string>(userRewardObjData);
  const parsedUserVeScaReward =
    userVeScaRewardFieldsZod.safeParse(userRewardFields);
  if (!parsedUserVeScaReward.success) return result;
  result.pendingScaReward = parsedUserVeScaReward.data as UserVeScaRewardFields;

  const remainingLockPeriodInMilliseconds = Math.max(
    (reserveVeSca?.unlockAt ?? 0) - Date.now(),
    0
  );

  result.pendingVeScaReward =
    result.pendingScaReward *
    (Math.floor(remainingLockPeriodInMilliseconds / 1000) / MAX_LOCK_DURATION);

  return result;
};
