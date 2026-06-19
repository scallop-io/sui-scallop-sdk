import { SUI_CLOCK_OBJECT_ID } from '@scallop-io/sui-kit';
import type {
  BorrowIncentiveIds,
  GenerateBorrowIncentiveNormalMethod,
} from 'src/types/index.js';

/**
 * Generate borrow incentive normal methods.
 *
 * @param ctx - Pure Move-call context (address reads, coin-type parsing, moveCall).
 * @param txBlock - TxBlock created by SuiKit .
 * @return Borrow incentive normal methods.
 */
export const generateBorrowIncentiveNormalMethod: GenerateBorrowIncentiveNormalMethod =
  ({ ctx, txBlock }) => {
    const borrowIncentiveIds: BorrowIncentiveIds = {
      borrowIncentivePkg: ctx.address.get('borrowIncentive.id'),
      query: ctx.address.get('borrowIncentive.query'),
      config: ctx.address.get('borrowIncentive.config'),
      incentivePools: ctx.address.get('borrowIncentive.incentivePools'),
      incentiveAccounts: ctx.address.get('borrowIncentive.incentiveAccounts'),
      obligationAccessStore: ctx.address.get('core.obligationAccessStore'),
    };

    const veScaIds = {
      table: ctx.address.get('vesca.table'),
      treasury: ctx.address.get('vesca.treasury'),
      config: ctx.address.get('vesca.config'),
    };

    const clockObjectRef = txBlock.sharedObjectRef({
      objectId: SUI_CLOCK_OBJECT_ID,
      mutable: false,
      initialSharedVersion: '1',
    });

    return {
      stakeObligation: (obligationId, obligationKey) => {
        ctx.moveCall(
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
        ctx.moveCall(
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
            ctx.address.get('vesca.subsTable'),
            ctx.address.get('vesca.subsWhitelist'),
            clockObjectRef,
          ],
          []
        );
      },
      unstakeObligation: (obligationId, obligationKey) => {
        ctx.moveCall(
          txBlock,
          `${borrowIncentiveIds.borrowIncentivePkg}::user::unstake_v2`,
          [
            borrowIncentiveIds.config,
            borrowIncentiveIds.incentivePools,
            borrowIncentiveIds.incentiveAccounts,
            obligationKey,
            obligationId,
            ctx.address.get('vesca.subsTable'),
            ctx.address.get('vesca.subsWhitelist'),
            clockObjectRef,
          ]
        );
      },
      claimBorrowIncentive: (obligationId, obligationKey, rewardCoinName) => {
        const rewardType = ctx.utils.parseCoinType(rewardCoinName);
        return ctx.moveCall(
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
        ctx.moveCall(
          txBlock,
          `${borrowIncentiveIds.borrowIncentivePkg}::user::deactivate_boost_v2`,
          [
            borrowIncentiveIds.config,
            borrowIncentiveIds.incentivePools,
            borrowIncentiveIds.incentiveAccounts,
            obligation,
            veScaKey,
            ctx.address.get('vesca.subsTable'),
            ctx.address.get('vesca.subsWhitelist'),
            clockObjectRef,
          ]
        );
      },
    };
  };
