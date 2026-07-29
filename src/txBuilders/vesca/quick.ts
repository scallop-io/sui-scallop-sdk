import { SuiTxBlock } from '@scallop-io/sui-kit';
import { coinWithBalance } from '@mysten/sui/transactions';
import { SCA_COIN_TYPE } from 'src/constants/index.js';
import {
  requireSender,
  checkLockSca,
  checkExtendLockPeriod,
  checkExtendLockAmount,
  checkRenewExpiredVeSca,
  checkVesca,
  getMoveCallTarget,
} from '../../utils/builder.js';
import type {
  TransactionObjectArgument,
  SuiObjectArg,
} from '@scallop-io/sui-kit';
import type { ScallopAddress, ScallopBuilder } from 'src/models/index.js';
import type {
  GenerateVeScaQuickMethod,
  QuickMethodReturnType,
  TransactionCommand,
} from 'src/types/index.js';
import type { SuiObjectData } from 'src/types/index.js';

/**
 * The explicit orchestration toolkit a veSCA quick method needs.
 *
 * @description
 * Narrow context injected into {@link generateQuickVeScaMethod}. Built once from
 * `builder` in the factory and passed (instead of `builder`) into the quick
 * generator. Method signatures are taken via indexed-access types so they stay
 * in sync with `ScallopBuilder`.
 */
export type VeScaActionContext = {
  address: Pick<ScallopAddress, 'get'>;
  utils: ScallopBuilder['utils'];
  reads: {
    getVeSca: ScallopBuilder['query']['getVeSca'];
    getVeScas: ScallopBuilder['query']['getVeScas'];
    isVeScaKeyInSubsTable: ScallopBuilder['query']['repos']['veSca']['isVeScaKeyInSubsTable'];
  };
};

/**
 * Check and get veSCA data from transaction block.
 *
 * @description
 * If the veScaKey id is provided, directly return it.
 * Otherwise, automatically get veScaKey from the sender.
 *
 * @param ctx - veSCA action context (provides `reads.getVeSca` / `reads.getVeScas`).
 * @param txBlock - TxBlock created by SuiKit.
 * @param veScaKey - veSCA key.
 * @return veSCA key, ID, locked amount and unlock at timestamp.
 */

export const requireVeSca = async (
  ...params: [
    ctx: VeScaActionContext,
    SuiTxBlock: SuiTxBlock,
    veScaKey?: SuiObjectData | string,
  ]
) => {
  const [ctx, txBlock, veScaKey] = params;
  if (params.length === 3 && veScaKey && typeof veScaKey !== 'undefined') {
    const veSca = await ctx.reads.getVeSca(veScaKey);

    if (!veSca) {
      return undefined;
    }

    return veSca;
  }

  const sender = requireSender(txBlock);
  const veScas = await ctx.reads.getVeScas({ walletAddress: sender });
  if (veScas.length === 0) {
    return undefined;
  }

  // return veSCA with the same veScaKey or the highest veSCA balance
  return veScaKey
    ? veScas.find(
        ({ keyId }) =>
          (typeof veScaKey === 'string' ? veScaKey : veScaKey.objectId) ===
          keyId
      )
    : veScas[0];
};

export const isInSubsTable = async (
  ...params: [ctx: VeScaActionContext, veScaKey: string, tableId: string]
) => {
  const [ctx, veScaKey, tableId] = params;
  try {
    return await ctx.reads.isVeScaKeyInSubsTable(veScaKey, tableId);
  } catch (e) {
    ctx.utils.logger.error('isInSubsTable lookup failed', {
      veScaKey,
      tableId,
      message: (e as Error)?.message,
    });
    return false;
  }
};

/**
 * Generate veSCA quick methods.
 *
 * @description
 * The quick methods are the same as the normal methods, but they will automatically
 * help users organize transaction blocks, include get veSca info, and transfer
 * coins to the sender. So, they are all asynchronous methods.
 *
 * @param ctx - veSCA action context (address, utils, reads).
 * @param txBlock - TxBlock created by SuiKit .
 * @return veSCA quick methods.
 */
export const generateQuickVeScaMethod: GenerateVeScaQuickMethod = ({
  ctx,
  txBlock,
}) => {
  return {
    lockScaQuick: async ({
      amountOrCoin,
      lockPeriodInDays,
      autoCheck = true,
      veScaKey,
    }) => {
      const sender = requireSender(txBlock);
      const veSca = await requireVeSca(ctx, txBlock, veScaKey);

      const newUnlockAt = ctx.utils.getUnlockAt(
        lockPeriodInDays,
        veSca?.unlockAt
      );

      // Validate before side effects (coin selection) so input-shape errors
      // surface as the documented validation error, not a downstream
      // "No valid coins" from selectCoins.
      if (autoCheck)
        checkLockSca(
          amountOrCoin,
          lockPeriodInDays,
          newUnlockAt,
          veSca?.unlockAt
        );

      let scaCoin: TransactionObjectArgument | SuiObjectArg | undefined =
        undefined;
      const transferObjects = [];
      if (amountOrCoin !== undefined && typeof amountOrCoin === 'number') {
        const takeCoin = coinWithBalance({
          type: SCA_COIN_TYPE,
          balance: amountOrCoin,
        });
        scaCoin = takeCoin;
      } else {
        // With amountOrCoin is SuiObjectArg, we cannot validate the minimum sca amount for locking and topup
        scaCoin = amountOrCoin;
      }

      const isInitialLock = !veSca;
      const isLockExpired =
        !isInitialLock && veSca.unlockAt <= new Date().getTime();
      if (isInitialLock || isLockExpired) {
        if (scaCoin) {
          if (isInitialLock) {
            const veScaKey = txBlock.lockSca(scaCoin, newUnlockAt);
            transferObjects.push(veScaKey);
          } else {
            // user must withdraw current unlocked SCA first if any
            if (veSca.lockedScaCoin !== 0) {
              const unlockedSca = txBlock.redeemSca(veSca.keyId);
              transferObjects.push(unlockedSca);
            }
            // enforce renew on expired
            txBlock.renewExpiredVeSca(veSca.keyId, scaCoin, newUnlockAt);
          }
        }
      } else {
        if (!!scaCoin && !!lockPeriodInDays) {
          txBlock.extendLockPeriod(veSca.keyId, newUnlockAt);
          txBlock.extendLockAmount(veSca.keyId, scaCoin);
        } else if (lockPeriodInDays) {
          txBlock.extendLockPeriod(veSca.keyId, newUnlockAt);
        } else if (scaCoin) {
          txBlock.extendLockAmount(veSca.keyId, scaCoin);
        }
      }

      if (transferObjects.length > 0) {
        txBlock.transferObjects(transferObjects, sender);
      }
    },
    extendLockPeriodQuick: async ({
      lockPeriodInDays,
      veScaKey,
      autoCheck = true,
    }) => {
      const veSca = await requireVeSca(ctx, txBlock, veScaKey);
      const newUnlockAt = ctx.utils.getUnlockAt(
        lockPeriodInDays,
        veSca?.unlockAt
      );

      if (autoCheck)
        checkExtendLockPeriod(lockPeriodInDays, newUnlockAt, veSca?.unlockAt);

      if (veSca) {
        txBlock.extendLockPeriod(veSca.keyId, newUnlockAt);
      }
    },
    extendLockAmountQuick: async ({
      scaAmount,
      veScaKey,
      autoCheck = true,
    }) => {
      // const sender = requireSender(txBlock);
      const veSca = await requireVeSca(ctx, txBlock, veScaKey);

      if (autoCheck) checkExtendLockAmount(scaAmount, veSca?.unlockAt);

      if (veSca) {
        const takeCoin = coinWithBalance({
          type: SCA_COIN_TYPE,
          balance: scaAmount,
        });

        txBlock.extendLockAmount(veSca.keyId, takeCoin);
      }
    },
    renewExpiredVeScaQuick: async ({
      scaAmount,
      lockPeriodInDays,
      veScaKey,
      autoCheck = true,
    }) => {
      const sender = requireSender(txBlock);
      const veSca = await requireVeSca(ctx, txBlock, veScaKey);

      const newUnlockAt = ctx.utils.getUnlockAt(
        lockPeriodInDays,
        veSca?.unlockAt
      );
      if (autoCheck)
        checkRenewExpiredVeSca(scaAmount, lockPeriodInDays, veSca?.unlockAt);

      if (veSca) {
        const transferObjects = [];
        if (veSca.lockedScaCoin !== 0) {
          const unlockedSca = txBlock.redeemSca(veSca.keyId);
          transferObjects.push(unlockedSca);
        }
        const takeCoin = coinWithBalance({
          type: SCA_COIN_TYPE,
          balance: scaAmount,
        });

        txBlock.renewExpiredVeSca(veSca.keyId, takeCoin, newUnlockAt);
        txBlock.transferObjects(transferObjects, sender);
      }
    },
    redeemScaQuick: async <T extends boolean>({
      veScaKey,
      transferSca,
    }: {
      veScaKey?: SuiObjectData | string;
      transferSca?: T;
    }) => {
      const sender = requireSender(txBlock);
      const veSca = await requireVeSca(ctx, txBlock, veScaKey);

      checkVesca(veSca?.unlockAt);

      if (veSca) {
        const sca = txBlock.redeemSca(veSca.keyId);
        if (transferSca) {
          txBlock.transferObjects([sca], sender);
          return;
        }
        return sca as QuickMethodReturnType<T>;
      }
    },
    splitVeScaQuick: async <S extends boolean>({
      splitAmount,
      veScaKey,
      transferVeScaKey = true as S,
    }: {
      splitAmount: string;
      veScaKey: string;
      transferVeScaKey?: S;
    }) => {
      const isKeyInSubTable = await isInSubsTable(
        ctx,
        veScaKey,
        ctx.address.get('vesca.subsTable')
      );

      const unstakeObligationBeforeStake = !!txBlock.txBlock
        .getData()
        .commands.find(
          (txn: TransactionCommand) =>
            txn.$kind === 'MoveCall' &&
            getMoveCallTarget(txn) ===
              `${ctx.address.get('borrowIncentive.id')}::user::unstake_v2`
        );

      if (isKeyInSubTable && !unstakeObligationBeforeStake) {
        throw new Error(
          'Key cannot be in the subs table, please call unsubscribe vesca or unstake obligation first'
        );
      }

      const newVeScaKey = txBlock.splitVeSca(veScaKey, splitAmount);
      if (transferVeScaKey) {
        txBlock.transferObjects([newVeScaKey], requireSender(txBlock));
        return;
      } else {
        return newVeScaKey as QuickMethodReturnType<S>;
      }
    },
    mergeVeScaQuick: async ({ targetVeScaKey, sourceVeScaKey }) => {
      // check targetKey and sourceKey
      const table = ctx.address.get('vesca.subsTableId');
      const [isTargetInSubTable, isSourceInSubTable] = await Promise.all([
        isInSubsTable(ctx, targetVeScaKey, table),
        isInSubsTable(ctx, sourceVeScaKey, table),
      ]);

      const unstakeObligationBeforeStake = !!txBlock.txBlock
        .getData()
        .commands.find(
          (txn: TransactionCommand) =>
            txn.$kind === 'MoveCall' &&
            getMoveCallTarget(txn) ===
              `${ctx.address.get('borrowIncentive.id')}::user::unstake_v2`
        );

      if (
        (isTargetInSubTable || isSourceInSubTable) &&
        !unstakeObligationBeforeStake
      ) {
        throw new Error(
          'Both target and source cannot be in the subs table. Please call unsubscribe vesca or unstake obligation first'
        );
      }

      const [sourceVesca, targetVesca] = await Promise.all([
        ctx.reads.getVeSca(sourceVeScaKey),
        ctx.reads.getVeSca(targetVeScaKey),
      ]);

      if (!sourceVesca || !targetVesca) {
        throw new Error('Source or target veSCA not found');
      }

      // Extend lock period to the max of both veSca
      if (sourceVesca.unlockAt < targetVesca.unlockAt) {
        txBlock.extendLockPeriod(
          sourceVesca.keyId,
          targetVesca.unlockAt / 1000
        );
      } else if (sourceVesca.unlockAt > targetVesca.unlockAt) {
        txBlock.extendLockPeriod(
          targetVesca.keyId,
          sourceVesca.unlockAt / 1000
        );
      }

      return txBlock.mergeVeSca(targetVeScaKey, sourceVeScaKey);
    },
  };
};
