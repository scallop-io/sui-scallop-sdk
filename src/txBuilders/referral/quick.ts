import { SuiObjectArg } from '@scallop-io/sui-kit';
import { GenerateReferralQuickMethod } from 'src/types/builder/referral.js';
import type { ScallopBuilder } from 'src/models/index.js';
import { requireSender } from '../../utils/builder.js';

/**
 * The explicit orchestration toolkit a referral quick method needs.
 *
 * @description
 * Narrow context injected into {@link generateReferralQuickMethod}. Built once
 * from `builder` in the factory and passed (instead of `builder`) into the quick
 * generator. Exposes only the coin selection / parsing helpers and the lending
 * whitelist slice that `claimReferralRevenueQuick` actually reads.
 */
export type ReferralActionContext = {
  utils: ScallopBuilder['utils'];
  constants: { whitelist: ScallopBuilder['constants']['whitelist'] };
};

export const generateReferralQuickMethod: GenerateReferralQuickMethod = ({
  ctx,
  txBlock,
}) => {
  return {
    claimReferralRevenueQuick: async (
      veScaKey: SuiObjectArg,
      coinNames: string[] = [...ctx.constants.whitelist.lending]
    ) => {
      const sender = requireSender(txBlock);
      const objToTransfer: SuiObjectArg[] = [];
      for (const coinName of coinNames) {
        if (coinName === 'sui') {
          const rewardCoin = txBlock.claimReferralRevenue(veScaKey, coinName);
          objToTransfer.push(rewardCoin);
        } else {
          const rewardCoin = txBlock.claimReferralRevenue(veScaKey, coinName);
          try {
            // get the matching user coin if exists
            const coins = await ctx.utils.selectCoins({
              amount: Infinity, // Select all coins
              coinType: ctx.utils.parseCoinType(coinName),
              ownerAddress: sender,
            });
            txBlock.mergeCoins(rewardCoin, coins.slice(0, 500));
          } catch (_e) {
            // ignore
          } finally {
            objToTransfer.push(rewardCoin);
          }
        }
      }
      if (objToTransfer.length > 0) {
        txBlock.transferObjects(objToTransfer, sender);
      }
    },
  };
};
