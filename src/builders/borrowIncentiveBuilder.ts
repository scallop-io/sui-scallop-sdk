import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import {
  getObligations,
  getObligationLocked,
  getBindedObligationId,
} from '../queries';
import { requireSender } from '../utils';
import type { SuiObjectArg } from '@scallop-io/sui-kit';
import type { ScallopBuilder } from 'src/models';
import type {
  BorrowIncentiveIds,
  GenerateBorrowIncentiveNormalMethod,
  GenerateBorrowIncentiveQuickMethod,
  SuiTxBlockWithBorrowIncentiveNormalMethods,
  BorrowIncentiveTxBlock,
  ScallopTxBlock,
  VescaIds,
} from '../types';
import { requireVeSca } from './vescaBuilder';
import { OLD_BORROW_INCENTIVE_PROTOCOL_ID } from 'src/constants';

/**
 * Check and get Obligation information from transaction block.
 *
 * @description
 * If the obligation id is provided, directly return it.
 * If both obligation id and key is provided, directly return them.
 * Otherwise, automatically get obligation id and key from the sender.
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - TxBlock created by SuiKit.
 * @param obligationId - Obligation id.
 * @param obligationKey - Obligation key.
 * @return Obligation id and key.
 */
const requireObligationInfo = async (
  ...params: [
    builder: ScallopBuilder,
    txBlock: SuiKitTxBlock,
    obligationId?: SuiObjectArg,
    obligationKey?: SuiObjectArg,
  ]
) => {
  const [builder, txBlock, obligationId, obligationKey] = params;
  if (
    params.length === 4 &&
    obligationId &&
    obligationKey &&
    typeof obligationId === 'string'
  ) {
    const obligationLocked = await getObligationLocked(
      builder.query,
      obligationId
    );
    return { obligationId, obligationKey, obligationLocked };
  }
  const sender = requireSender(txBlock);
  const obligations = await getObligations(builder.query, sender);
  if (obligations.length === 0) {
    throw new Error(`No obligation found for sender ${sender}`);
  }

  const selectedObligation =
    obligations.find(
      (obligation) =>
        obligation.id === obligationId || obligation.keyId === obligationKey
    ) ?? obligations[0];

  return {
    obligationId: selectedObligation.id,
    obligationKey: selectedObligation.keyId,
    obligationLocked: selectedObligation.locked,
  };
};

/**
 * Generate borrow incentive normal methods.
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - TxBlock created by SuiKit .
 * @return Borrow incentive normal methods.
 */
const generateBorrowIncentiveNormalMethod: GenerateBorrowIncentiveNormalMethod =
  ({ builder, txBlock }) => {
    const borrowIncentiveIds: BorrowIncentiveIds = {
      borrowIncentivePkg: builder.address.get('borrowIncentive.id'),
      query: builder.address.get('borrowIncentive.query'),
      config: builder.address.get('borrowIncentive.config'),
      incentivePools: builder.address.get('borrowIncentive.incentivePools'),
      incentiveAccounts: builder.address.get(
        'borrowIncentive.incentiveAccounts'
      ),
      obligationAccessStore: builder.address.get('core.obligationAccessStore'),
    };

    const veScaIds: Omit<VescaIds, 'pkgId'> = {
      table: builder.address.get('vesca.table'),
      treasury: builder.address.get('vesca.treasury'),
      config: builder.address.get('vesca.config'),
    };

    return {
      stakeObligation: (obligationId, obligationKey) => {
        txBlock.moveCall(
          `${borrowIncentiveIds.borrowIncentivePkg}::user::stake`,
          [
            borrowIncentiveIds.config,
            borrowIncentiveIds.incentivePools,
            borrowIncentiveIds.incentiveAccounts,
            obligationKey,
            obligationId,
            borrowIncentiveIds.obligationAccessStore,
            SUI_CLOCK_OBJECT_ID,
          ]
        );
      },
      stakeObligationWithVesca: (obligationId, obligationKey, veScaKey) => {
        txBlock.moveCall(
          `${borrowIncentiveIds.borrowIncentivePkg}::user::stake_with_ve_sca`,
          [
            borrowIncentiveIds.config,
            borrowIncentiveIds.incentivePools,
            borrowIncentiveIds.incentiveAccounts,
            obligationKey,
            obligationId,
            borrowIncentiveIds.obligationAccessStore,
            veScaIds.config,
            veScaIds.treasury,
            veScaIds.table,
            veScaKey,
            SUI_CLOCK_OBJECT_ID,
          ],
          []
        );
      },
      unstakeObligation: (obligationId, obligationKey) => {
        txBlock.moveCall(
          `${borrowIncentiveIds.borrowIncentivePkg}::user::unstake`,
          [
            borrowIncentiveIds.config,
            borrowIncentiveIds.incentivePools,
            borrowIncentiveIds.incentiveAccounts,
            obligationKey,
            obligationId,
            SUI_CLOCK_OBJECT_ID,
          ]
        );
      },
      claimBorrowIncentive: (
        obligationId,
        obligationKey,
        coinName,
        rewardCoinName
      ) => {
        const rewardCoinNames =
          builder.utils.getBorrowIncentiveRewardCoinName(coinName);
        if (rewardCoinNames.includes(rewardCoinName) === false) {
          throw new Error(`Invalid reward coin name ${rewardCoinName}`);
        }
        const rewardType = builder.utils.parseCoinType(rewardCoinName);
        return txBlock.moveCall(
          `${borrowIncentiveIds.borrowIncentivePkg}::user::redeem_rewards`,
          [
            borrowIncentiveIds.config,
            borrowIncentiveIds.incentivePools,
            borrowIncentiveIds.incentiveAccounts,
            obligationKey,
            obligationId,
            SUI_CLOCK_OBJECT_ID,
          ],
          [rewardType]
        );
      },
      deactivateBoost: (obligation, veScaKey) => {
        return txBlock.moveCall(
          `${borrowIncentiveIds.borrowIncentivePkg}::user::deactivate_boost`,
          [
            borrowIncentiveIds.config,
            borrowIncentiveIds.incentivePools,
            borrowIncentiveIds.incentiveAccounts,
            obligation,
            veScaKey,
            SUI_CLOCK_OBJECT_ID,
          ]
        );
      },
    };
  };

/**
 * Generate spool quick methods.
 *
 * @description
 * The quick methods are the same as the normal methods, but they will automatically
 * help users organize transaction blocks, include get stake account info, and transfer
 * coins to the sender. So, they are all asynchronous methods.
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - TxBlock created by SuiKit .
 * @return Borrow Incentive quick methods.
 */
const generateBorrowIncentiveQuickMethod: GenerateBorrowIncentiveQuickMethod =
  ({ builder, txBlock }) => {
    return {
      stakeObligationQuick: async (obligation, obligationKey) => {
        const {
          obligationId: obligationArg,
          obligationKey: obligationtKeyArg,
          obligationLocked: obligationLocked,
        } = await requireObligationInfo(
          builder,
          txBlock,
          obligation,
          obligationKey
        );

        const unstakeObligationBeforeStake =
          !!txBlock.txBlock.blockData.transactions.find(
            (txn) =>
              txn.kind === 'MoveCall' &&
              (txn.target ===
                `${OLD_BORROW_INCENTIVE_PROTOCOL_ID}::user::unstake` ||
                txn.target ===
                  `${builder.address.get('borrowIncentive.id')}::user::unstake`)
          );

        if (!obligationLocked || unstakeObligationBeforeStake) {
          txBlock.stakeObligation(obligationArg, obligationtKeyArg);
        }
      },
      stakeObligationWithVeScaQuick: async (
        obligation,
        obligationKey,
        veScaKey
      ) => {
        const {
          obligationId: obligationArg,
          obligationKey: obligationtKeyArg,
          obligationLocked: obligationLocked,
        } = await requireObligationInfo(
          builder,
          txBlock,
          obligation,
          obligationKey
        );

        const unstakeObligationBeforeStake =
          !!txBlock.txBlock.blockData.transactions.find(
            (txn) =>
              txn.kind === 'MoveCall' &&
              (txn.target ===
                `${OLD_BORROW_INCENTIVE_PROTOCOL_ID}::user::unstake` ||
                txn.target ===
                  `${builder.address.get('borrowIncentive.id')}::user::unstake`)
          );

        if (!obligationLocked || unstakeObligationBeforeStake) {
          const veSca = await requireVeSca(builder, txBlock, veScaKey);
          if (veSca) {
            const bindedObligationId = await getBindedObligationId(
              builder.query,
              veSca.keyId
            );

            // if bindedObligationId is equal to obligationId, then use it again
            if (
              (!bindedObligationId || bindedObligationId === obligationArg) &&
              veSca.currentVeScaBalance > 0
            ) {
              txBlock.stakeObligationWithVesca(
                obligationArg,
                obligationtKeyArg,
                veSca.keyId
              );
            } else {
              txBlock.stakeObligation(obligationArg, obligationtKeyArg);
            }
          } else {
            txBlock.stakeObligation(obligationArg, obligationtKeyArg);
          }
        }
      },
      unstakeObligationQuick: async (obligation, obligationKey) => {
        const {
          obligationId: obligationArg,
          obligationKey: obligationtKeyArg,
          obligationLocked: obligationLocked,
        } = await requireObligationInfo(
          builder,
          txBlock,
          obligation,
          obligationKey
        );

        if (obligationLocked) {
          txBlock.unstakeObligation(obligationArg, obligationtKeyArg);
        }
      },
      claimBorrowIncentiveQuick: async (
        coinName,
        rewardCoinName,
        obligation,
        obligationKey
      ) => {
        const {
          obligationId: obligationArg,
          obligationKey: obligationtKeyArg,
        } = await requireObligationInfo(
          builder,
          txBlock,
          obligation,
          obligationKey
        );

        return txBlock.claimBorrowIncentive(
          obligationArg,
          obligationtKeyArg,
          coinName,
          rewardCoinName
        );
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
export const newBorrowIncentiveTxBlock = (
  builder: ScallopBuilder,
  initTxBlock?: ScallopTxBlock | SuiKitTxBlock | Transaction
) => {
  const txBlock =
    initTxBlock instanceof Transaction
      ? new SuiKitTxBlock(initTxBlock)
      : initTxBlock
      ? initTxBlock
      : new SuiKitTxBlock();

  const normalMethod = generateBorrowIncentiveNormalMethod({
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
  }) as SuiTxBlockWithBorrowIncentiveNormalMethods;

  const quickMethod = generateBorrowIncentiveQuickMethod({
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
  }) as BorrowIncentiveTxBlock;
};
