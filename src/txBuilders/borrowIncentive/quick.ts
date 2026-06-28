import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import type { SuiObjectArg } from '@scallop-io/sui-kit';
import type { ScallopAddress, ScallopBuilder } from 'src/models/index.js';
import type {
  GenerateBorrowIncentiveQuickMethod,
  TransactionCommand,
} from 'src/types/index.js';
import { OLD_BORROW_INCENTIVE_PROTOCOL_ID } from 'src/constants/index.js';
import { getMoveCallTarget, requireSender } from 'src/utils/builder.js';

/**
 * The explicit orchestration toolkit a borrow-incentive quick method needs.
 *
 * @description
 * Narrow context injected into {@link generateBorrowIncentiveQuickMethod}. Built
 * once from `builder` in the factory and passed (instead of `builder`) into the
 * quick generator. Method signatures are taken via indexed-access types so they
 * stay in sync with `ScallopBuilder`.
 */
export type BorrowIncentiveActionContext = {
  address: Pick<ScallopAddress, 'get'>;
  reads: {
    getObligations: ScallopBuilder['query']['getObligations'];
    getObligationLocked: ScallopBuilder['query']['getObligationLocked'];
    getBindedVeScaKey: ScallopBuilder['query']['getBindedVeScaKey'];
  };
};

/**
 * Check and get Obligation information from transaction block.
 *
 * @description
 * If the obligation id is provided, directly return it.
 * If both obligation id and key is provided, directly return them.
 * Otherwise, automatically get obligation id and key from the sender.
 *
 * @param ctx - Borrow incentive action context (provides `reads`).
 * @param txBlock - TxBlock created by SuiKit.
 * @param obligationId - Obligation id.
 * @param obligationKey - Obligation key.
 * @return Obligation id and key.
 */
const requireObligationInfo = async (
  ...params: [
    ctx: BorrowIncentiveActionContext,
    txBlock: SuiKitTxBlock,
    obligationId?: SuiObjectArg,
    obligationKey?: SuiObjectArg,
  ]
) => {
  const [ctx, txBlock, obligationId, obligationKey] = params;
  if (
    params.length === 4 &&
    obligationId &&
    obligationKey &&
    typeof obligationId === 'string'
  ) {
    const obligationLocked = await ctx.reads.getObligationLocked(obligationId);
    return { obligationId, obligationKey, obligationLocked };
  }
  const sender = requireSender(txBlock);
  const obligations = await ctx.reads.getObligations(sender);
  if (obligations.length === 0) {
    throw new Error(`No obligation found for sender ${sender}`);
  }

  const selectedObligation = obligations.find(
    (obligation) =>
      obligation.id === obligationId || obligation.keyId === obligationKey
  );

  if (!selectedObligation) {
    throw new Error(
      `No obligation found for sender ${sender} with id ${obligationId} or key ${obligationKey}`
    );
  }

  return {
    obligationId: selectedObligation.id,
    obligationKey: selectedObligation.keyId,
    obligationLocked: selectedObligation.locked,
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
 * @param ctx - Borrow incentive action context (address, reads).
 * @param txBlock - TxBlock created by SuiKit .
 * @return Borrow Incentive quick methods.
 */
export const generateBorrowIncentiveQuickMethod: GenerateBorrowIncentiveQuickMethod =
  ({ ctx, txBlock }) => {
    return {
      stakeObligationQuick: async (obligation, obligationKey) => {
        const {
          obligationId: obligationArg,
          obligationKey: obligationKeyArg,
          obligationLocked: obligationLocked,
        } = await requireObligationInfo(
          ctx,
          txBlock,
          obligation,
          obligationKey
        );

        const unstakeObligationBeforeStake = !!txBlock.txBlock
          .getData()
          .commands.find(
            (txn: TransactionCommand) =>
              txn.$kind === 'MoveCall' &&
              (getMoveCallTarget(txn) ===
                `${OLD_BORROW_INCENTIVE_PROTOCOL_ID}::user::unstake` ||
                getMoveCallTarget(txn) ===
                  `${ctx.address.get('borrowIncentive.id')}::user::unstake_v2` ||
                getMoveCallTarget(txn) ===
                  `${ctx.address.get('borrowIncentive.id')}::user::unstake`)
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
          ctx,
          txBlock,
          obligation,
          obligationKey
        );

        const unstakeObligationBeforeStake = !!txBlock.txBlock
          .getData()
          .commands.find(
            (txn: TransactionCommand) =>
              txn.$kind === 'MoveCall' &&
              (getMoveCallTarget(txn) ===
                `${OLD_BORROW_INCENTIVE_PROTOCOL_ID}::user::unstake` ||
                getMoveCallTarget(txn) ===
                  `${ctx.address.get('borrowIncentive.id')}::user::unstake_v2` ||
                getMoveCallTarget(txn) ===
                  `${ctx.address.get('borrowIncentive.id')}::user::unstake`)
          );

        if (!obligationLocked || unstakeObligationBeforeStake) {
          const bindedVeScaKey =
            await ctx.reads.getBindedVeScaKey(obligationArg);

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
          ctx,
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
          await requireObligationInfo(ctx, txBlock, obligation, obligationKey);

        // return await txBlock.claimBorrowIncentive(
        return txBlock.claimBorrowIncentive(
          obligationArg,
          obligationKeyArg,
          rewardCoinName
        );
      },
    };
  };
