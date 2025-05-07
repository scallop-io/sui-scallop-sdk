import { Transaction } from '@mysten/sui/transactions';
import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { ScallopBuilder } from 'src/models';
import {
  GenerateLoyaltyProgramNormalMethod,
  GenerateLoyaltyProgramQuickMethod,
  LoyaltyProgramTxBlock,
  ScallopTxBlock,
  SuiTxBlockWithLoyaltyProgramNormalMethods,
} from 'src/types';
import { requireSender } from 'src/utils';

const generateLoyaltyProgramNormalMethod: GenerateLoyaltyProgramNormalMethod =
  ({ builder, txBlock }) => {
    const loyaltyProgramIds = {
      pkgId: builder.address.get('loyaltyProgram.id'),
      scaRewardPool: builder.address.get('loyaltyProgram.rewardPool'),
    };

    const veScaProgramIds = {
      protocolConfig: builder.address.get('vesca.config'),
      veScaTable: builder.address.get('vesca.table'),
      subsTable: builder.address.get('vesca.subsTable'),
    };

    const veScaLoyaltyProgramIds = {
      pkgId: builder.address.get('veScaLoyaltyProgram.id'),
      veScaRewardPool: builder.address.get(
        'veScaLoyaltyProgram.veScaRewardPool'
      ),
    };

    return {
      claimLoyaltyRevenue: (veScaKey) => {
        return builder.moveCall(
          txBlock,
          `${loyaltyProgramIds.pkgId}::reward_pool::redeem_reward`,
          [loyaltyProgramIds.scaRewardPool, veScaKey]
        );
      },
      claimVeScaLoyaltyReward: (veScaKey) => {
        return builder.moveCall(
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

const generateLoyaltyProgramQuickMethod: GenerateLoyaltyProgramQuickMethod = ({
  builder,
  txBlock,
}) => {
  return {
    claimLoyaltyRevenueQuick: async (veScaKey) => {
      veScaKey = veScaKey ?? (await builder.query.getVeScas())[0]?.keyObject;
      const sender = requireSender(txBlock);
      if (!veScaKey) throw new Error(`No veScaKey found for user ${sender}`);

      // claim the pending reward
      const rewardCoin = txBlock.claimLoyaltyRevenue(veScaKey);

      // get existing sca coin to merge with
      const scaCoinType = builder.constants.coinTypes.sca;
      if (!scaCoinType) throw new Error('Coin type sca not found');

      await builder.utils.mergeSimilarCoins(
        txBlock,
        rewardCoin,
        scaCoinType,
        requireSender(txBlock)
      );
      txBlock.transferObjects([rewardCoin], sender);
    },
    claimVeScaLoyaltyRewardQuick: async (veScaKey) => {
      veScaKey = veScaKey ?? (await builder.query.getVeScas())[0]?.keyObject;
      const sender = requireSender(txBlock);
      if (!veScaKey) throw new Error(`No veScaKey found for user ${sender}`);

      // claim the pending reward
      const rewardVeScaKey = txBlock.claimVeScaLoyaltyReward(veScaKey);

      // transfer the reward veSca key to the sender
      txBlock.transferObjects([rewardVeScaKey], sender);
    },
  };
};

/**
 * Create an enhanced transaction block instance for interaction with loyalty program modules of the Scallop contract.
 *
 * @param builder - Scallop builder instance.
 * @param initTxBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
 * @return Scallop loyalty program txBlock.
 */
export const newLoyaltyProgramTxBlock = (
  builder: ScallopBuilder,
  initTxBlock?: ScallopTxBlock | SuiKitTxBlock | Transaction
) => {
  const txBlock =
    initTxBlock instanceof Transaction
      ? new SuiKitTxBlock(initTxBlock)
      : initTxBlock
        ? initTxBlock
        : new SuiKitTxBlock();

  const normalMethod = generateLoyaltyProgramNormalMethod({
    builder,
    txBlock,
  });

  const normalTxBlock = new Proxy(txBlock, {
    get: (target, prop) => {
      if (prop in normalMethod) {
        return Reflect.get(normalMethod, prop);
      }
      return Reflect.get(target, prop);
    },
  }) as SuiTxBlockWithLoyaltyProgramNormalMethods;

  const quickMethod = generateLoyaltyProgramQuickMethod({
    builder,
    txBlock: normalTxBlock,
  });

  return new Proxy(normalTxBlock, {
    get: (target, prop) => {
      if (prop in quickMethod) {
        return Reflect.get(quickMethod, prop);
      }
      return Reflect.get(target, prop);
    },
  }) as LoyaltyProgramTxBlock;
};
