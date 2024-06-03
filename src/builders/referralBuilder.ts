import { ScallopBuilder } from 'src/models';
import { ScallopTxBlock, SupportCoins, SupportPoolCoins } from 'src/types';
import {
  SUI_CLOCK_OBJECT_ID,
  SuiTxBlock as SuiKitTxBlock,
  SuiObjectArg,
  TransactionBlock,
} from '@scallop-io/sui-kit';
import {
  GenerateReferralNormalMethod,
  GenerateReferralQuickMethod,
  ReferralIds,
  ReferralTxBlock,
  SuiTxBlockWithReferralNormalMethods,
} from 'src/types/builder/referral';
import { SUPPORT_POOLS } from 'src/constants';
import { requireSender } from 'src/utils';

const generateReferralNormalMethod: GenerateReferralNormalMethod = ({
  builder,
  txBlock,
}) => {
  const referralIds: ReferralIds = {
    referralPgkId: builder.address.get('referral.id'),
    referralBindings: builder.address.get('referral.referralBindings'),
    referralRevenuePool: builder.address.get('referral.referralRevenuePool'),
    authorizedWitnessList: builder.address.get(
      'referral.authorizedWitnessList'
    ),
    referralTiers: builder.address.get('referral.referralTiers'),
    version: builder.address.get('referral.version'),
  };

  const veScaTable = builder.address.get('vesca.table');

  return {
    bindToReferral: (veScaKeyId: string) => {
      return txBlock.moveCall(
        `${referralIds.referralPgkId}::referral_bindings::bind_ve_sca_referrer`,
        [
          referralIds.referralBindings,
          txBlock.pure(veScaKeyId),
          veScaTable,
          SUI_CLOCK_OBJECT_ID,
        ],
        []
      );
    },
    claimReferralTicket: (poolCoinName: SupportCoins) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      return txBlock.moveCall(
        `${referralIds.referralPgkId}::scallop_referral_program::claim_ve_sca_referral_ticket`,
        [
          referralIds.version,
          veScaTable,
          referralIds.referralBindings,
          referralIds.authorizedWitnessList,
          referralIds.referralTiers,
          SUI_CLOCK_OBJECT_ID,
        ],
        [coinType]
      );
    },
    burnReferralTicket: (ticket: SuiObjectArg, poolCoinName: SupportCoins) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      return txBlock.moveCall(
        `${referralIds.referralPgkId}::scallop_referral_program::burn_ve_sca_referral_ticket`,
        [
          referralIds.version,
          ticket,
          referralIds.referralRevenuePool,
          SUI_CLOCK_OBJECT_ID,
        ],
        [coinType]
      );
    },
    claimReferralRevenue: (
      veScaKey: SuiObjectArg,
      poolCoinName: SupportCoins
    ) => {
      const coinType = builder.utils.parseCoinType(poolCoinName);
      return txBlock.moveCall(
        `${referralIds.referralPgkId}::referral_revenue_pool::claim_revenue_with_ve_sca_key`,
        [
          referralIds.version,
          referralIds.referralRevenuePool,
          veScaKey,
          SUI_CLOCK_OBJECT_ID,
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
      coinNames: SupportPoolCoins[] = [...SUPPORT_POOLS]
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
            const coins = await builder.suiKit.suiInteractor.selectCoins(
              sender,
              Infinity,
              builder.utils.parseCoinType(coinName)
            );
            txBlock.mergeCoins(rewardCoin, coins);
          } catch (e) {
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
 * @return Scallop borrow incentive txBlock.
 */
export const newReferralTxBlock = (
  builder: ScallopBuilder,
  initTxBlock?: ScallopTxBlock | SuiKitTxBlock | TransactionBlock
) => {
  const txBlock =
    initTxBlock instanceof TransactionBlock
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
