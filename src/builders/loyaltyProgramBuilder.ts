import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiObjectArg, SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { coinIds } from 'src/constants';
import { ScallopBuilder } from 'src/models';
import {
  GenerateLoyaltyProgramNormalMethod,
  GenerateLoyaltyProgramQuickMethod,
  LoyaltyProgramIds,
  LoyaltyProgramTxBlock,
  ScallopTxBlock,
  SuiTxBlockWithLoyaltyProgramNormalMethods,
} from 'src/types';
import { requireSender } from 'src/utils';

const generateLoyaltyProgramNormalMethod: GenerateLoyaltyProgramNormalMethod =
  ({ builder, txBlock }) => {
    const loyaltyProgramIds: LoyaltyProgramIds = {
      loyaltyProgramPkgId: builder.address.get('loyaltyProgram.id'),
      rewardPool: builder.address.get('loyaltyProgram.rewardPool'),
      userRewardTableId: builder.address.get(
        'loyaltyProgram.userRewardTableId'
      ),
    };

    return {
      claimLoyaltyRevenue: (veScaKey) => {
        return txBlock.moveCall(
          `${loyaltyProgramIds.loyaltyProgramPkgId}::reward_pool::redeem_reward`,
          [loyaltyProgramIds.rewardPool, veScaKey]
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
      veScaKey = veScaKey || (await builder.query.getVeScas())[0]?.keyObject;
      const sender = requireSender(txBlock);
      if (!veScaKey) throw new Error(`No veScaKey found for user ${sender}`);

      // claim the pending reward
      const toTransferObject: SuiObjectArg[] = [];
      const rewardCoin = txBlock.claimLoyaltyRevenue(veScaKey);

      // get existing sca coin to merge with
      try {
        const existingScaCoin = await builder.suiKit.suiInteractor.selectCoins(
          sender,
          Infinity,
          coinIds.sca
        );
        txBlock.mergeCoins(rewardCoin, existingScaCoin);
      } catch (e) {
        // ignore
      } finally {
        toTransferObject.push(rewardCoin);
      }

      if (toTransferObject.length > 0) {
        txBlock.transferObjects(toTransferObject, sender);
      }
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
  initTxBlock?: ScallopTxBlock | SuiKitTxBlock | TransactionBlock
) => {
  const txBlock =
    initTxBlock instanceof TransactionBlock
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
