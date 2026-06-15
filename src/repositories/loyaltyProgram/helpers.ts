import { SuiClientTypes } from '@mysten/sui/client';
import {
  LoyaltyProgramInfo,
  LoyaltyProgramRepoContext,
  QueryRewardPoolContext,
  QueryUserRewardContext,
} from './types.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import { RewardPoolSchema } from './schema.js';
import { UserRewardBcs } from './bcs.js';
import { encodeDynamicFieldNameForV2 } from 'src/utils/dynamicField.js';
import { logError } from '../utils.js';
import { BigNumber } from 'bignumber.js';

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
    throw logError(ctx.logger, 'Failed to fetch reward pool object');
  }

  return rewardPoolObject;
};

const queryUserRewardAmount = async (
  ctx: QueryUserRewardContext,
  {
    veScaKey,
    tableId,
  }: {
    veScaKey: string;
    tableId: string;
  }
) => {
  const { onchain, fetchWithCache } = ctx;

  const fetchOptions: SuiClientTypes.GetDynamicFieldOptions = {
    parentId: tableId,
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

export const getLoyaltyProgramInfosOnChain = async (
  ctx: LoyaltyProgramRepoContext,
  veScaKey?: string
): Promise<LoyaltyProgramInfo> => {
  const {
    metadata: { addresses },
  } = ctx;
  const { rewardPool } = addresses.loyaltyProgram;

  const rewardPoolobject = await queryRewardPool(ctx, rewardPool);
  const { data, success } = RewardPoolSchema.safeParse(rewardPoolobject.json);

  if (!success) {
    return {
      pendingReward: 0,
      totalPoolReward: 0,
      isClaimEnabled: false,
    };
  }

  // No veSca key → pool info only; a user with no reward entry yet → 0
  // (mirrors the legacy query's optional-key + catch-to-zero behavior).
  const pendingReward = veScaKey
    ? await queryUserRewardAmount(ctx, {
        veScaKey,
        tableId: data.userRewardTableId,
      }).catch(() => 0)
    : 0;

  return {
    pendingReward,
    totalPoolReward: data.totalPoolReward,
    isClaimEnabled: data.isClaimEnabled,
  };
};
