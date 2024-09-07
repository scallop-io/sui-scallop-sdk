import {
  SUI_CLOCK_OBJECT_ID,
  SuiTxBlock,
  TransactionBlock,
  SuiTxBlock as SuiKitTxBlock,
} from '@scallop-io/sui-kit';
import { SCA_COIN_TYPE } from 'src/constants';
import { ScallopBuilder } from '../models';
import { getVeSca, getVeScas } from '../queries';
import {
  requireSender,
  checkLockSca,
  checkExtendLockPeriod,
  checkExtendLockAmount,
  checkRenewExpiredVeSca,
  checkVesca,
} from '../utils';
import type {
  TransactionObjectArgument,
  SuiObjectArg,
} from '@scallop-io/sui-kit';
import type {
  GenerateVeScaNormalMethod,
  GenerateVeScaQuickMethod,
  ScallopTxBlock,
  SuiTxBlockWithVeScaNormalMethods,
  VeScaTxBlock,
  VescaIds,
} from 'src/types';

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
    veScaKey?: SuiObjectArg,
  ]
) => {
  const [builder, txBlock, veScaKey] = params;
  if (params.length === 3 && veScaKey && typeof veScaKey === 'string') {
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

  return veScas[0]; // return veSCA with highest veSCA balance
};

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
  const veScaIds: VescaIds = {
    pkgId: builder.address.get('vesca.id'),
    table: builder.address.get('vesca.table'),
    treasury: builder.address.get('vesca.treasury'),
    config: builder.address.get('vesca.config'),
  };

  return {
    lockSca: (scaCoin, unlockAtInSecondTimestamp) => {
      return txBlock.moveCall(
        `${veScaIds.pkgId}::ve_sca::mint_ve_sca_key`,
        [
          veScaIds.config,
          veScaIds.table,
          veScaIds.treasury,
          scaCoin,
          unlockAtInSecondTimestamp,
          SUI_CLOCK_OBJECT_ID,
        ],
        []
      );
    },
    extendLockPeriod: (veScaKey, newUnlockAtInSecondTimestamp) => {
      txBlock.moveCall(
        `${veScaIds.pkgId}::ve_sca::extend_lock_period`,
        [
          veScaIds.config,
          veScaKey,
          veScaIds.table,
          veScaIds.treasury,
          newUnlockAtInSecondTimestamp,
          SUI_CLOCK_OBJECT_ID,
        ],
        []
      );
    },
    extendLockAmount: (veScaKey, scaCoin) => {
      txBlock.moveCall(
        `${veScaIds.pkgId}::ve_sca::lock_more_sca`,
        [
          veScaIds.config,
          veScaKey,
          veScaIds.table,
          veScaIds.treasury,
          scaCoin,
          SUI_CLOCK_OBJECT_ID,
        ],
        []
      );
    },
    renewExpiredVeSca: (veScaKey, scaCoin, newUnlockAtInSecondTimestamp) => {
      txBlock.moveCall(
        `${veScaIds.pkgId}::ve_sca::renew_expired_ve_sca`,
        [
          veScaIds.config,
          veScaKey,
          veScaIds.table,
          veScaIds.treasury,
          scaCoin,
          newUnlockAtInSecondTimestamp,
          SUI_CLOCK_OBJECT_ID,
        ],
        []
      );
    },
    redeemSca: (veScaKey) => {
      return txBlock.moveCall(
        `${veScaIds.pkgId}::ve_sca::redeem`,
        [
          veScaIds.config,
          veScaKey,
          veScaIds.table,
          veScaIds.treasury,
          SUI_CLOCK_OBJECT_ID,
        ],
        []
      );
    },
    mintEmptyVeSca: () => {
      return txBlock.moveCall(
        `${veScaIds.pkgId}::ve_sca::mint_ve_sca_placeholder_key`,
        [veScaIds.config, veScaIds.table],
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
    lockScaQuick: async (amountOrCoin, lockPeriodInDays, autoCheck = true) => {
      const sender = requireSender(txBlock);
      const veSca = await requireVeSca(builder, txBlock);

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

      const isInitialLock = !veSca?.unlockAt;
      const isLockExpired =
        !isInitialLock && veSca.unlockAt * 1000 <= new Date().getTime();
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
    redeemScaQuick: async (veScaKey?: SuiObjectArg) => {
      const sender = requireSender(txBlock);
      const veSca = await requireVeSca(builder, txBlock, veScaKey);

      checkVesca(veSca?.unlockAt);

      if (veSca) {
        const sca = txBlock.redeemSca(veSca.keyId);
        txBlock.transferObjects([sca], sender);
      }
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
  initTxBlock?: ScallopTxBlock | SuiKitTxBlock | TransactionBlock
) => {
  const txBlock =
    initTxBlock instanceof TransactionBlock
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
