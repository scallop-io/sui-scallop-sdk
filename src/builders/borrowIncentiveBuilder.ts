import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui.js/utils';
import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { borrowIncentiveRewardCoins } from '../constants/enum';
import { getObligations, getObligationLocked } from '../queries';
import { requireSender } from '../utils';
import type { SuiAddressArg } from '@scallop-io/sui-kit';
import type { ScallopBuilder } from '../models';
import type {
  BorrowIncentiveIds,
  GenerateBorrowIncentiveNormalMethod,
  GenerateBorrowIncentiveQuickMethod,
  SuiTxBlockWithBorrowIncentiveNormalMethods,
  BorrowIncentiveTxBlock,
  ScallopTxBlock,
} from '../types';

/**
 * Check and get Obligation information from transaction block.
 *
 * @description
 * If the obligation id is provided, direactly return it.
 * If both obligation id and key is provided, direactly return them.
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
    obligationId?: SuiAddressArg,
    obligationKey?: SuiAddressArg,
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
  return {
    obligationId: obligations[0].id,
    obligationKey: obligations[0].keyId,
    obligationLocked: obligations[0].locked,
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
      incentivePools: builder.address.get('borrowIncentive.incentivePools'),
      incentiveAccounts: builder.address.get(
        'borrowIncentive.incentiveAccounts'
      ),
      obligationAccessStore: builder.address.get('core.obligationAccessStore'),
    };
    return {
      stakeObligation: (obligationId, obligaionKey) => {
        // NOTE: Pools without incentives also need to stake after change obligation,
        // the default here use sui as reward coin.
        const rewardCoinName = 'sui';
        const rewardType = builder.utils.parseCoinType(rewardCoinName);
        txBlock.moveCall(
          `${borrowIncentiveIds.borrowIncentivePkg}::user::stake`,
          [
            borrowIncentiveIds.incentivePools,
            borrowIncentiveIds.incentiveAccounts,
            obligaionKey,
            obligationId,
            borrowIncentiveIds.obligationAccessStore,
            SUI_CLOCK_OBJECT_ID,
          ],
          [rewardType]
        );
      },
      unstakeObligation: (obligationId, obligaionKey) => {
        // NOTE: Pools without incentives also need to unstake to change obligation,
        // the default here use sui as reward coin.
        const rewardCoinName = 'sui';
        const rewardType = builder.utils.parseCoinType(rewardCoinName);
        txBlock.moveCall(
          `${borrowIncentiveIds.borrowIncentivePkg}::user::unstake`,
          [
            borrowIncentiveIds.incentivePools,
            borrowIncentiveIds.incentiveAccounts,
            obligaionKey,
            obligationId,
            SUI_CLOCK_OBJECT_ID,
          ],
          [rewardType]
        );
      },
      claimBorrowIncentive: (obligationId, obligaionKey, coinName) => {
        const rewardCoinName = borrowIncentiveRewardCoins[coinName];
        const rewardType = builder.utils.parseCoinType(rewardCoinName);
        return txBlock.moveCall(
          `${borrowIncentiveIds.borrowIncentivePkg}::user::redeem_rewards`,
          [
            borrowIncentiveIds.incentivePools,
            borrowIncentiveIds.incentiveAccounts,
            obligaionKey,
            obligationId,
            SUI_CLOCK_OBJECT_ID,
          ],
          [rewardType]
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
 * @return Spool quick methods.
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
              txn.target ===
                `${builder.address.get('borrowIncentive.id')}::user::unstake`
          );

        if (!obligationLocked || unstakeObligationBeforeStake) {
          txBlock.stakeObligation(obligationArg, obligationtKeyArg);
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
          coinName
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
  initTxBlock?: ScallopTxBlock | SuiKitTxBlock | TransactionBlock
) => {
  const txBlock =
    initTxBlock instanceof TransactionBlock
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
