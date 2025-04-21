import { Transaction } from '@mysten/sui/transactions';
import {
  SuiTxBlock as SuiKitTxBlock,
  SUI_CLOCK_OBJECT_ID,
} from '@scallop-io/sui-kit';
import { getObligations, getObligationLocked } from 'src/queries';
import { requireSender } from 'src/utils';
import type { SuiObjectArg } from '@scallop-io/sui-kit';
import type { ScallopBuilder } from 'src/models';
import type {
  BorrowIncentiveIds,
  GenerateBorrowIncentiveNormalMethod,
  GenerateBorrowIncentiveQuickMethod,
  SuiTxBlockWithBorrowIncentiveNormalMethods,
  BorrowIncentiveTxBlock,
  ScallopTxBlock,
} from 'src/types';
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
      builder.cache,
      obligationId
    );
    return { obligationId, obligationKey, obligationLocked };
  }
  const sender = requireSender(txBlock);
  const obligations = await getObligations(builder, sender);
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

    const veScaIds = {
      table: builder.address.get('vesca.table'),
      treasury: builder.address.get('vesca.treasury'),
      config: builder.address.get('vesca.config'),
    };

    const clockObjectRef = txBlock.sharedObjectRef({
      objectId: SUI_CLOCK_OBJECT_ID,
      mutable: false,
      initialSharedVersion: '1',
    });

    return {
      stakeObligation: (obligationId, obligationKey) => {
        builder.moveCall(
          txBlock,
          `${borrowIncentiveIds.borrowIncentivePkg}::user::stake`,
          [
            borrowIncentiveIds.config,
            borrowIncentiveIds.incentivePools,
            borrowIncentiveIds.incentiveAccounts,
            obligationKey,
            obligationId,
            borrowIncentiveIds.obligationAccessStore,
            clockObjectRef,
          ]
        );
      },
      stakeObligationWithVesca: (obligationId, obligationKey, veScaKey) => {
        builder.moveCall(
          txBlock,
          `${borrowIncentiveIds.borrowIncentivePkg}::user::stake_with_ve_sca_v2`,
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
            builder.address.get('vesca.subsTable'),
            builder.address.get('vesca.subsWhitelist'),
            clockObjectRef,
          ],
          []
        );
      },
      unstakeObligation: (obligationId, obligationKey) => {
        builder.moveCall(
          txBlock,
          `${borrowIncentiveIds.borrowIncentivePkg}::user::unstake_v2`,
          [
            borrowIncentiveIds.config,
            borrowIncentiveIds.incentivePools,
            borrowIncentiveIds.incentiveAccounts,
            obligationKey,
            obligationId,
            builder.address.get('vesca.subsTable'),
            builder.address.get('vesca.subsWhitelist'),
            clockObjectRef,
          ]
        );
      },
      claimBorrowIncentive: (obligationId, obligationKey, rewardCoinName) => {
        const rewardType = builder.utils.parseCoinType(rewardCoinName);
        return builder.moveCall(
          txBlock,
          `${borrowIncentiveIds.borrowIncentivePkg}::user::redeem_rewards`,
          [
            borrowIncentiveIds.config,
            borrowIncentiveIds.incentivePools,
            borrowIncentiveIds.incentiveAccounts,
            obligationKey,
            obligationId,
            clockObjectRef,
          ],
          [rewardType]
        );
      },
      deactivateBoost: (obligation, veScaKey) => {
        builder.moveCall(
          txBlock,
          `${borrowIncentiveIds.borrowIncentivePkg}::user::deactivate_boost_v2`,
          [
            borrowIncentiveIds.config,
            borrowIncentiveIds.incentivePools,
            borrowIncentiveIds.incentiveAccounts,
            obligation,
            veScaKey,
            clockObjectRef,
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
          obligationKey: obligationKeyArg,
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
                  `${builder.address.get('borrowIncentive.id')}::user::unstake_v2` ||
                txn.target ===
                  `${builder.address.get('borrowIncentive.id')}::user::unstake`)
          );

        if (!obligationLocked || unstakeObligationBeforeStake) {
          txBlock.stakeObligation(obligationArg, obligationKeyArg);
        }
      },
      stakeObligationWithVeScaQuick: async (
        obligation,
        obligationKey,
        veScaKey
      ) => {
        const {
          obligationId: obligationArg,
          obligationKey: obligationKeyArg,
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
                  `${builder.address.get('borrowIncentive.id')}::user::unstake_v2` ||
                txn.target ===
                  `${builder.address.get('borrowIncentive.id')}::user::unstake`)
          );

        if (!obligationLocked || unstakeObligationBeforeStake) {
          const bindedVeScaKey =
            await builder.query.getBindedVeScaKey(obligationArg);

          const _veScaKey = bindedVeScaKey ?? veScaKey;
          if (!_veScaKey) {
            txBlock.stakeObligation(obligationArg, obligationKeyArg);
          } else {
            txBlock.stakeObligationWithVesca(
              obligationArg,
              obligationKeyArg,
              _veScaKey
            );
          }
        }
      },
      unstakeObligationQuick: async (obligation, obligationKey) => {
        const {
          obligationId: obligationArg,
          obligationKey: obligationKeyArg,
          obligationLocked: obligationLocked,
        } = await requireObligationInfo(
          builder,
          txBlock,
          obligation,
          obligationKey
        );

        if (obligationLocked) {
          txBlock.unstakeObligation(obligationArg, obligationKeyArg);
        }
      },
      claimBorrowIncentiveQuick: async (
        rewardCoinName,
        obligation,
        obligationKey
      ) => {
        // check for available reward coin names
        const { obligationId: obligationArg, obligationKey: obligationKeyArg } =
          await requireObligationInfo(
            builder,
            txBlock,
            obligation,
            obligationKey
          );

        // return await txBlock.claimBorrowIncentive(
        return txBlock.claimBorrowIncentive(
          obligationArg,
          obligationKeyArg,
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
