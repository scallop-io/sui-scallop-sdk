import { ScallopBuilder } from 'src/models';
import { ScallopTxBlock } from 'src/types';
import {
  SUI_CLOCK_OBJECT_ID,
  SuiTxBlock as SuiKitTxBlock,
  SuiObjectArg,
  Transaction,
} from '@scallop-io/sui-kit';
import {
  GenerateReferralNormalMethod,
  GenerateReferralQuickMethod,
  ReferralIds,
  ReferralTxBlock,
  SuiTxBlockWithReferralNormalMethods,
} from 'src/types/builder/referral';
import { requireSender } from 'src/utils';

const generateReferralNormalMethod: GenerateReferralNormalMethod = ({
  builder,
  txBlock,
}) => {
  const referralIds: ReferralIds = {
    referralPgkId: builder.constants.get('referral.id'),
    referralBindings: builder.constants.get('referral.referralBindings'),
    referralRevenuePool: builder.constants.get('referral.referralRevenuePool'),
    authorizedWitnessList: builder.constants.get(
      'referral.authorizedWitnessList'
    ),
    referralTiers: builder.constants.get('referral.referralTiers'),
    version: builder.constants.get('referral.version'),
  };

  const veScaTable = builder.constants.get('vesca.table');
  const clockObjectRef = txBlock.sharedObjectRef({
    objectId: SUI_CLOCK_OBJECT_ID,
    mutable: false,
    initialSharedVersion: '1',
  });

  return {
    bindToReferral: (veScaKeyId: string) => {
      builder.moveCall(
        txBlock,
        `${referralIds.referralPgkId}::referral_bindings::bind_ve_sca_referrer`,
        [
          referralIds.referralBindings,
          txBlock.pure.id(veScaKeyId),
          veScaTable,
          clockObjectRef,
        ],
        []
      );
    },
    claimReferralTicket: (poolCoinName: string) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      return builder.moveCall(
        txBlock,
        `${referralIds.referralPgkId}::scallop_referral_program::claim_ve_sca_referral_ticket`,
        [
          referralIds.version,
          veScaTable,
          referralIds.referralBindings,
          referralIds.authorizedWitnessList,
          referralIds.referralTiers,
          clockObjectRef,
        ],
        [coinType]
      );
    },
    burnReferralTicket: (ticket: SuiObjectArg, poolCoinName: string) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      builder.moveCall(
        txBlock,
        `${referralIds.referralPgkId}::scallop_referral_program::burn_ve_sca_referral_ticket`,
        [
          referralIds.version,
          ticket,
          referralIds.referralRevenuePool,
          clockObjectRef,
        ],
        [coinType]
      );
    },
    claimReferralRevenue: (veScaKey: SuiObjectArg, poolCoinName: string) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      return builder.moveCall(
        txBlock,
        `${referralIds.referralPgkId}::referral_revenue_pool::claim_revenue_with_ve_sca_key`,
        [
          referralIds.version,
          referralIds.referralRevenuePool,
          veScaKey,
          clockObjectRef,
        ],
        [coinType]
      );
    },
  };
};

const generateReferralQuickMethod: GenerateReferralQuickMethod = ({
  builder,
  txBlock,
}) => {
  return {
    claimReferralRevenueQuick: async (
      veScaKey: SuiObjectArg,
      coinNames: string[] = [...builder.address.getWhitelist('lending')]
    ) => {
      const sender = requireSender(txBlock);
      const objToTransfer: SuiObjectArg[] = [];
      for (const coinName of coinNames) {
        if (coinName === 'sui') {
          const rewardCoin = await txBlock.claimReferralRevenue(
            veScaKey,
            coinName
          );
          objToTransfer.push(rewardCoin);
        } else {
          const rewardCoin = await txBlock.claimReferralRevenue(
            veScaKey,
            coinName
          );
          try {
            // get the matching user coin if exists
            const coins = await builder.suiKit.suiInteractor.selectCoins(
              sender,
              Infinity,
              builder.utils.parseCoinType(coinName)
            );
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

/**
 * Create an enhanced transaction block instance for interaction with borrow incentive modules of the Scallop contract.
 *
 * @param builder - Scallop builder instance.
 * @param initTxBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
 * @return Scallop referral txBlock.
 */
export const newReferralTxBlock = (
  builder: ScallopBuilder,
  initTxBlock?: ScallopTxBlock | SuiKitTxBlock | Transaction
) => {
  const txBlock =
    initTxBlock instanceof Transaction
      ? new SuiKitTxBlock(initTxBlock)
      : initTxBlock
        ? initTxBlock
        : new SuiKitTxBlock();

  const normalMethod = generateReferralNormalMethod({
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
  }) as SuiTxBlockWithReferralNormalMethods;

  const quickMethod = generateReferralQuickMethod({
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
  }) as ReferralTxBlock;
};
