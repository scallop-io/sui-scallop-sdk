import { z } from 'zod';
import { BigNumber } from 'bignumber.js';

export const RewardPoolSchema = z
  .object({
    balance: z.string(),
    enable_claim: z.boolean(),
    id: z.string(),
    user_rewards: z.object({
      id: z.string(),
      size: z.string(),
    }),
  })
  .transform((value) => ({
    isClaimEnabled: value.enable_claim,
    totalPoolReward: BigNumber(value.balance).shiftedBy(-9).toNumber(),
    userRewardTableId: value.user_rewards.id,
  }));
