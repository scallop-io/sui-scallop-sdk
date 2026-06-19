import type { ScallopBuilder } from 'src/models/index.js';
import { GenerateLoyaltyProgramQuickMethod } from 'src/types/index.js';
import { requireSender } from '../../utils/builder.js';

/**
 * The explicit orchestration toolkit a loyalty-program quick method needs.
 *
 * @description
 * Narrow context injected into {@link generateLoyaltyProgramQuickMethod}. Built
 * once from `builder` in the factory and passed (instead of `builder`) into the
 * quick generator.
 */
export type LoyaltyProgramActionContext = {
  utils: ScallopBuilder['utils'];
  reads: {
    getVeScas: ScallopBuilder['query']['getVeScas'];
  };
  constants: {
    coinTypes: ScallopBuilder['constants']['coinTypes'];
  };
};

export const generateLoyaltyProgramQuickMethod: GenerateLoyaltyProgramQuickMethod =
  ({ ctx, txBlock }) => {
    return {
      claimLoyaltyRevenueQuick: async (veScaKey) => {
        veScaKey = veScaKey ?? (await ctx.reads.getVeScas())[0]?.keyId;
        const sender = requireSender(txBlock);
        if (!veScaKey) throw new Error(`No veScaKey found for user ${sender}`);

        // claim the pending reward
        const rewardCoin = txBlock.claimLoyaltyRevenue(veScaKey);

        // get existing sca coin to merge with
        const scaCoinType = ctx.constants.coinTypes.sca;
        if (!scaCoinType) throw new Error('Coin type sca not found');

        await ctx.utils.mergeSimilarCoins(
          txBlock,
          rewardCoin,
          scaCoinType,
          requireSender(txBlock)
        );
        txBlock.transferObjects([rewardCoin], sender);
      },
      claimVeScaLoyaltyRewardQuick: async (veScaKey) => {
        veScaKey = veScaKey ?? (await ctx.reads.getVeScas())[0]?.keyId;
        const sender = requireSender(txBlock);
        if (!veScaKey) throw new Error(`No veScaKey found for user ${sender}`);

        // claim the pending reward
        const rewardVeScaKey = txBlock.claimVeScaLoyaltyReward(veScaKey);

        // transfer the reward veSca key to the sender
        txBlock.transferObjects([rewardVeScaKey], sender);
      },
    };
  };
