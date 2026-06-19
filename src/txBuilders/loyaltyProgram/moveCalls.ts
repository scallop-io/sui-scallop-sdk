import { GenerateLoyaltyProgramNormalMethod } from 'src/types/index.js';

export const generateLoyaltyProgramNormalMethod: GenerateLoyaltyProgramNormalMethod =
  ({ ctx, txBlock }) => {
    const loyaltyProgramIds = {
      pkgId: ctx.address.get('loyaltyProgram.id'),
      scaRewardPool: ctx.address.get('loyaltyProgram.rewardPool'),
    };

    const veScaProgramIds = {
      object: ctx.address.get('vesca.object'),
      protocolConfig: ctx.address.get('vesca.config'),
      veScaTable: ctx.address.get('vesca.table'),
      subsTable: ctx.address.get('vesca.subsTable'),
    };

    const veScaLoyaltyProgramIds = {
      pkgId: ctx.address.get('veScaLoyaltyProgram.id'),
      veScaRewardPool: ctx.address.get('veScaLoyaltyProgram.veScaRewardPool'),
    };

    return {
      claimLoyaltyRevenue: (veScaKey) => {
        return ctx.moveCall(
          txBlock,
          `${loyaltyProgramIds.pkgId}::reward_pool::redeem_reward`,
          [loyaltyProgramIds.scaRewardPool, veScaKey]
        );
      },
      claimVeScaLoyaltyReward: (veScaKey) => {
        return ctx.moveCall(
          txBlock,
          `${veScaLoyaltyProgramIds.pkgId}::ve_sca_reward::redeem_reward`,
          [
            veScaLoyaltyProgramIds.veScaRewardPool,
            veScaKey,
            veScaProgramIds.protocolConfig,
            veScaProgramIds.veScaTable,
            veScaProgramIds.subsTable,
          ]
        );
      },
    };
  };
