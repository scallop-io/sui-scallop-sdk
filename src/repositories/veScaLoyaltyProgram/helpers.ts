import { SuiClientTypes } from '@mysten/sui/client';
import {
  QueryRewardPoolContext,
  QueryUserRewardContext,
  VeScaLoyaltyProgramRepoContext,
} from './types.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import { VeScaRewardPoolSchema } from './schema.js';
import { VeScaLoyaltyProgramInfo } from 'src/types/index.js';
import { getVeScaDataFromOnChain } from '../veSca/helpers.js';
import { encodeDynamicFieldNameForV2 } from 'src/utils/dynamicField.js';
import { logError } from '../utils.js';
import { ScallopRpcError } from 'src/errors/index.js';
import { UserRewardBcs } from './bcs.js';
import { BigNumber } from 'bignumber.js';
import { MAX_LOCK_DURATION } from 'src/constants/vesca.js';

/**
 * Query the user pending reward in the reward table based on the veSca key
 * @returns Reward amount in string shifted by decimals
 */
const queryUserRewardAmount = async (
  ctx: QueryUserRewardContext,
  veScaKey: string
) => {
  const {
    onchain,
    metadata: { addresses },
    fetchWithCache,
  } = ctx;
  const { veScaRewardTableId } = addresses.veScaLoyaltyProgram;
  const fetchOptions: SuiClientTypes.GetDynamicFieldOptions = {
    parentId: veScaRewardTableId,
    name: encodeDynamicFieldNameForV2({
      type: '0x2::object::ID',
      value: veScaKey,
    }),
  };

  const {
    dynamicField: { value },
  } = await fetchWithCache({
    queryKey: queryKeys.rpc.getDynamicFieldObject({
      ...fetchOptions,
      node: onchain.url,
    }),
    queryFn: () => onchain.client.getDynamicField(fetchOptions),
  });

  return BigNumber(UserRewardBcs.parse(value.bcs)).shiftedBy(-9).toNumber();
};

const queryRewardPool = async (
  ctx: QueryRewardPoolContext,
  rewardPoolId: string
) => {
  const { onchain, fetchWithCache } = ctx;

  // Fetch the rewardPool object
  const fetchOptions: SuiClientTypes.GetObjectOptions<{ json: true }> = {
    objectId: rewardPoolId,
    include: {
      json: true,
    },
  };

  const { object: rewardPoolObject } = await fetchWithCache({
    queryKey: queryKeys.rpc.getObject({
      ...fetchOptions,
      node: onchain.url,
    }),
    queryFn: () => onchain.getObject(fetchOptions),
  });

  if (!rewardPoolObject) {
    throw logError(
      ctx.logger,
      new ScallopRpcError('Failed to fetch reward pool object', {
        context: { rewardPoolId },
      })
    );
  }

  return rewardPoolObject;
};

export const getVeScaLoyaltyProgramInfosOnChain = async (
  ctx: VeScaLoyaltyProgramRepoContext,
  veScaKey?: string
): Promise<VeScaLoyaltyProgramInfo> => {
  const {
    metadata: { addresses },
  } = ctx;
  const { veScaRewardPool } = addresses.veScaLoyaltyProgram;
  const rewardPoolObject = await queryRewardPool(ctx, veScaRewardPool);
  // Parse the json fields
  const { data, success } = VeScaRewardPoolSchema.safeParse(
    rewardPoolObject.json
  );
  if (!success || !data.reserveVeScaKey) {
    return {
      isClaimEnabled: false,
      totalPoolReward: 0,
      pendingVeScaReward: 0,
      pendingScaReward: 0,
    };
  }

  // query the total pool reward from pool reward veScaKey
  const rewardPoolVeSca = await getVeScaDataFromOnChain(
    ctx,
    data.reserveVeScaKey
  );

  // No veSca key → pool info only; missing user reward entry → 0
  // (mirrors the legacy query's optional-key + catch-to-zero behavior).
  const pendingScaReward = veScaKey
    ? await queryUserRewardAmount(ctx, veScaKey).catch(() => 0)
    : 0;

  const remainingLockPeriodInMilliseconds = Math.max(
    (rewardPoolVeSca?.unlockAt ?? 0) - Date.now(),
    0
  );

  return {
    pendingScaReward,
    pendingVeScaReward:
      pendingScaReward *
      (Math.floor(remainingLockPeriodInMilliseconds / 1000) /
        MAX_LOCK_DURATION),
    totalPoolReward: rewardPoolVeSca?.currentVeScaBalance ?? 0,
    isClaimEnabled: data.isClaimEnabled,
  };
};
