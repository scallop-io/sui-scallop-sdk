import {
  SUI_CLOCK_OBJECT_ID,
  SuiTxBlock,
  Transaction,
  SuiTxBlock as SuiKitTxBlock,
} from '@scallop-io/sui-kit';
import { SCA_COIN_TYPE } from 'src/constants';
import { ScallopBuilder } from 'src/models';
import { getVeSca, getVeScas } from 'src/queries';
import {
  requireSender,
  checkLockSca,
  checkExtendLockPeriod,
  checkExtendLockAmount,
  checkRenewExpiredVeSca,
  checkVesca,
} from 'src/utils';
import type {
  TransactionObjectArgument,
  SuiObjectArg,
} from '@scallop-io/sui-kit';
import type {
  AddressesInterface,
  GenerateVeScaNormalMethod,
  GenerateVeScaQuickMethod,
  QuickMethodReturnType,
  ScallopTxBlock,
  SuiTxBlockWithVeScaNormalMethods,
  VeScaTxBlock,
} from 'src/types';
import { SuiObjectData } from '@mysten/sui/client';

/**
 * Check and get veSCA data from transaction block.
 *
 * @description
 * If the veScaKey id is provided, directly return it.
 * Otherwise, automatically get veScaKey from the sender.
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - TxBlock created by SuiKit.
 * @param veScaKey - veSCA key.
 * @return veSCA key, ID, locked amount and unlock at timestamp.
 */

export const requireVeSca = async (
  ...params: [
    builder: ScallopBuilder,
    SuiTxBlock: SuiTxBlock,
    veScaKey?: SuiObjectData,
  ]
) => {
  const [builder, txBlock, veScaKey] = params;
  if (params.length === 3 && veScaKey && typeof veScaKey !== 'undefined') {
    const veSca = await getVeSca(builder.utils, veScaKey);

    if (!veSca) {
      return undefined;
    }

    return veSca;
  }

  const sender = requireSender(txBlock);
  const veScas = await getVeScas(builder, sender);
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
  ...params: [builder: ScallopBuilder, veScaKey: string, tableId: string]
) => {
  const [builder, veScaKey, tableId] = params;
  try {
    const resp = await builder.scallopSuiKit.queryGetDynamicFieldObject({
      parentId: tableId,
      name: {
        type: '0x2::object::ID',
        value: veScaKey,
      },
    });

    if (!resp?.data) return false;

    const contents = (resp.data.content as any).fields.value.fields.contents;
    return Array.isArray(contents) && contents.length > 0;
  } catch (e) {
    console.error(e);
    return false;
  }
};

type VeScaProps = 'id' | 'table' | 'treasury' | 'config' | 'subsTable';

/**
 * Generate veSCA normal methods.
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - TxBlock created by SuiKit .
 * @return veSCA normal methods.
 */
const generateNormalVeScaMethod: GenerateVeScaNormalMethod = ({
  builder,
  txBlock,
}) => {
  const veScaIds: Pick<AddressesInterface['vesca'], VeScaProps> = {
    id: builder.address.get('vesca.id'),
    table: builder.address.get('vesca.table'),
    treasury: builder.address.get('vesca.treasury'),
    config: builder.address.get('vesca.config'),
    subsTable: builder.address.get('vesca.subsTable'),
  };

  const clockObjectRef = txBlock.sharedObjectRef({
    objectId: SUI_CLOCK_OBJECT_ID,
    mutable: false,
    initialSharedVersion: '1',
  });

  return {
    lockSca: (scaCoin, unlockAtInSecondTimestamp) => {
      return builder.moveCall(
        txBlock,
        `${veScaIds.id}::ve_sca::mint_ve_sca_key`,
        [
          veScaIds.config,
          veScaIds.table,
          veScaIds.treasury,
          scaCoin,
          unlockAtInSecondTimestamp,
          clockObjectRef,
        ],
        []
      );
    },
    extendLockPeriod: (veScaKey, newUnlockAtInSecondTimestamp) => {
      builder.moveCall(
        txBlock,
        `${veScaIds.id}::ve_sca::extend_lock_period`,
        [
          veScaIds.config,
          veScaKey,
          veScaIds.table,
          veScaIds.treasury,
          newUnlockAtInSecondTimestamp,
          clockObjectRef,
        ],
        []
      );
    },
    extendLockAmount: (veScaKey, scaCoin) => {
      builder.moveCall(
        txBlock,
        `${veScaIds.id}::ve_sca::lock_more_sca`,
        [
          veScaIds.config,
          veScaKey,
          veScaIds.table,
          veScaIds.treasury,
          scaCoin,
          clockObjectRef,
        ],
        []
      );
    },
    renewExpiredVeSca: (veScaKey, scaCoin, newUnlockAtInSecondTimestamp) => {
      builder.moveCall(
        txBlock,
        `${veScaIds.id}::ve_sca::renew_expired_ve_sca`,
        [
          veScaIds.config,
          veScaKey,
          veScaIds.table,
          veScaIds.treasury,
          scaCoin,
          newUnlockAtInSecondTimestamp,
          clockObjectRef,
        ],
        []
      );
    },
    redeemSca: (veScaKey) => {
      return builder.moveCall(
        txBlock,
        `${veScaIds.id}::ve_sca::redeem`,
        [
          veScaIds.config,
          veScaKey,
          veScaIds.table,
          veScaIds.treasury,
          clockObjectRef,
        ],
        []
      );
    },
    mintEmptyVeSca: () => {
      return builder.moveCall(
        txBlock,
        `${veScaIds.id}::ve_sca::mint_ve_sca_placeholder_key`,
        [veScaIds.config, veScaIds.table],
        []
      );
    },
    splitVeSca: (veScaKey, splitAmount) => {
      return builder.moveCall(txBlock, `${veScaIds.id}::ve_sca::split`, [
        veScaIds.config,
        veScaKey,
        veScaIds.table,
        veScaIds.subsTable,
        txBlock.pure.u64(splitAmount),
      ]);
    },
    mergeVeSca: (targetKey, sourceKey) => {
      return builder.moveCall(
        txBlock,
        `${veScaIds.id}::ve_sca::merge`,
        [
          veScaIds.config,
          targetKey,
          sourceKey,
          veScaIds.table,
          veScaIds.subsTable,
          txBlock.sharedObjectRef({
            objectId: SUI_CLOCK_OBJECT_ID,
            mutable: false,
            initialSharedVersion: '1',
          }),
        ],
        []
      );
    },
  };
};

/**
 * Generate veSCA quick methods.
 *
 * @description
 * The quick methods are the same as the normal methods, but they will automatically
 * help users organize transaction blocks, include get veSca info, and transfer
 * coins to the sender. So, they are all asynchronous methods.
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - TxBlock created by SuiKit .
 * @return veSCA quick methods.
 */
const generateQuickVeScaMethod: GenerateVeScaQuickMethod = ({
  builder,
  txBlock,
}) => {
  return {
    lockScaQuick: async (
      amountOrCoin,
      lockPeriodInDays,
      veScaKey,
      autoCheck = true
    ) => {
      const sender = requireSender(txBlock);
      const veSca = await requireVeSca(builder, txBlock, veScaKey);

      let scaCoin: TransactionObjectArgument | SuiObjectArg | undefined =
        undefined;
      const transferObjects = [];
      if (amountOrCoin !== undefined && typeof amountOrCoin === 'number') {
        const coins = await builder.utils.selectCoins(
          amountOrCoin,
          SCA_COIN_TYPE,
          sender
        );
        const [takeCoin, leftCoin] = txBlock.takeAmountFromCoins(
          coins,
          amountOrCoin
        );
        scaCoin = takeCoin;
        transferObjects.push(leftCoin);
      } else {
        // With amountOrCoin is SuiObjectArg, we cannot validate the minimum sca amount for locking and topup
        scaCoin = amountOrCoin;
      }

      const newUnlockAt = builder.utils.getUnlockAt(
        lockPeriodInDays,
        veSca?.unlockAt
      );

      if (autoCheck)
        checkLockSca(
          amountOrCoin,
          lockPeriodInDays,
          newUnlockAt,
          veSca?.unlockAt
        );

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
    extendLockPeriodQuick: async (
      lockPeriodInDays: number,
      veScaKey?: SuiObjectArg,
      autoCheck = true
    ) => {
      const veSca = await requireVeSca(builder, txBlock, veScaKey);
      const newUnlockAt = builder.utils.getUnlockAt(
        lockPeriodInDays,
        veSca?.unlockAt
      );

      if (autoCheck)
        checkExtendLockPeriod(lockPeriodInDays, newUnlockAt, veSca?.unlockAt);

      if (veSca) {
        txBlock.extendLockPeriod(veSca.keyId, newUnlockAt);
      }
    },
    extendLockAmountQuick: async (
      scaAmount: number,
      veScaKey?: SuiObjectArg,
      autoCheck = true
    ) => {
      const sender = requireSender(txBlock);
      const veSca = await requireVeSca(builder, txBlock, veScaKey);

      if (autoCheck) checkExtendLockAmount(scaAmount, veSca?.unlockAt);

      if (veSca) {
        const scaCoins = await builder.utils.selectCoins(
          scaAmount,
          SCA_COIN_TYPE,
          sender
        );
        const [takeCoin, leftCoin] = txBlock.takeAmountFromCoins(
          scaCoins,
          scaAmount
        );

        txBlock.extendLockAmount(veSca.keyId, takeCoin);
        txBlock.transferObjects([leftCoin], sender);
      }
    },
    renewExpiredVeScaQuick: async (
      scaAmount: number,
      lockPeriodInDays: number,
      veScaKey?: SuiObjectArg,
      autoCheck = true
    ) => {
      const sender = requireSender(txBlock);
      const veSca = await requireVeSca(builder, txBlock, veScaKey);

      const newUnlockAt = builder.utils.getUnlockAt(
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
        const scaCoins = await builder.utils.selectCoins(
          scaAmount,
          SCA_COIN_TYPE,
          sender
        );
        const [takeCoin, leftCoin] = txBlock.takeAmountFromCoins(
          scaCoins,
          scaAmount
        );
        transferObjects.push(leftCoin);

        txBlock.renewExpiredVeSca(veSca.keyId, takeCoin, newUnlockAt);
        txBlock.transferObjects(transferObjects, sender);
      }
    },
    redeemScaQuick: async <S extends boolean>(
      veScaKey?: SuiObjectArg,
      transferSca: S = true as S
    ) => {
      const sender = requireSender(txBlock);
      const veSca = await requireVeSca(builder, txBlock, veScaKey);

      checkVesca(veSca?.unlockAt);

      if (veSca) {
        const sca = txBlock.redeemSca(veSca.keyId);
        if (transferSca) {
          txBlock.transferObjects([sca], sender);
          return;
        }
        return sca as QuickMethodReturnType<S>;
      }
    },
    splitVeScaQuick: async <S extends boolean>(
      splitAmount: string,
      veScaKey: string,
      transferVeScaKey: S = true as S
    ) => {
      const isKeyInSubTable = await isInSubsTable(
        builder,
        veScaKey,
        builder.address.get('vesca.subsTable')
      );

      const unstakeObligationBeforeStake =
        !!txBlock.txBlock.blockData.transactions.find(
          (txn) =>
            txn.kind === 'MoveCall' &&
            txn.target ===
              `${builder.address.get('borrowIncentive.id')}::user::unstake_v2`
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
    mergeVeScaQuick: async (targetKey: string, sourceKey: string) => {
      // check targetKey and sourceKey
      const table = builder.address.get('vesca.subsTableId');
      const [isTargetInSubTable, isSourceInSubTable] = await Promise.all([
        isInSubsTable(builder, targetKey, table),
        isInSubsTable(builder, sourceKey, table),
      ]);

      console.log({
        targetKey,
        sourceKey,
        isTargetInSubTable,
        isSourceInSubTable,
      });

      const unstakeObligationBeforeStake =
        !!txBlock.txBlock.blockData.transactions.find(
          (txn) =>
            txn.kind === 'MoveCall' &&
            txn.target ===
              `${builder.address.get('borrowIncentive.id')}::user::unstake_v2`
        );

      if (
        (isTargetInSubTable || isSourceInSubTable) &&
        !unstakeObligationBeforeStake
      ) {
        throw new Error(
          'Both target and source cannot be in the subs table. Please call unsubscribe vesca or unstake obligation first'
        );
      }

      return txBlock.mergeVeSca(targetKey, sourceKey);
    },
  };
};

/**
 * Create an enhanced transaction block instance for interaction with veSCA modules of the Scallop contract.
 *
 * @param builder - Scallop builder instance.
 * @param initTxBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
 * @return Scallop borrow incentive txBlock.
 */
export const newVeScaTxBlock = (
  builder: ScallopBuilder,
  initTxBlock?: ScallopTxBlock | SuiKitTxBlock | Transaction
) => {
  const txBlock =
    initTxBlock instanceof Transaction
      ? new SuiKitTxBlock(initTxBlock)
      : initTxBlock
        ? initTxBlock
        : new SuiKitTxBlock();

  const normalMethod = generateNormalVeScaMethod({
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
  }) as SuiTxBlockWithVeScaNormalMethods;

  const quickMethod = generateQuickVeScaMethod({
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
  }) as VeScaTxBlock;
};
