import {
  SUI_CLOCK_OBJECT_ID,
  SuiAddressArg,
  SuiTxBlock,
  TransactionBlock,
  SuiTxBlock as SuiKitTxBlock,
} from '@scallop-io/sui-kit';
import {
  MAX_LOCK_DURATION,
  MAX_LOCK_ROUNDS,
  MIN_INITIAL_LOCK_AMOUNT,
  MIN_TOP_UP_AMOUNT,
  SCA_COIN_TYPE,
  SECONDS_IN_A_DAY,
} from 'src/constants';
import { ScallopBuilder } from '../models';
import { getVeSca, getVeScas } from '../queries';
import { findClosest12AM, requireSender } from '../utils';
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
    veScaKey?: SuiAddressArg,
  ]
) => {
  const [builder, txBlock, veScaKey] = params;
  if (params.length === 3 && veScaKey && typeof veScaKey === 'string') {
    const veSca = await getVeSca(builder.query, veScaKey);

    if (!veSca) {
      return undefined;
    }

    return veSca;
  }

  const sender = requireSender(txBlock);
  const veScas = await getVeScas(builder.query, sender);
  if (veScas.length === 0) {
    return undefined;
  }

  return veScas[0];
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
    lockSca: (scaCoin, unlockAt) => {
      return txBlock.moveCall(
        `${veScaIds.pkgId}::ve_sca::mint_ve_sca_key`,
        [
          veScaIds.config,
          veScaIds.table,
          veScaIds.treasury,
          scaCoin,
          unlockAt,
          SUI_CLOCK_OBJECT_ID,
        ],
        []
      );
    },
    extendLockPeriod: (veScaKey, newUnlockAt) => {
      txBlock.moveCall(
        `${veScaIds.pkgId}::ve_sca::extend_lock_period`,
        [
          veScaIds.config,
          veScaKey,
          veScaIds.table,
          veScaIds.treasury,
          newUnlockAt,
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
    renewExpiredVeSca: (veScaKey, scaCoin, newUnlockAt) => {
      txBlock.moveCall(
        `${veScaIds.pkgId}::ve_sca::renew_expired_ve_sca`,
        [
          veScaIds.config,
          veScaKey,
          veScaIds.table,
          veScaIds.treasury,
          scaCoin,
          newUnlockAt,
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
 * @return Spool quick methods.
 */
const generateQuickVeScaMethod: GenerateVeScaQuickMethod = ({
  builder,
  txBlock,
}) => {
  return {
    // TODO: update new check logic.
    lockScaQuick: async (amountOrCoin, lockPeriodInDays) => {
      const lockPeriodInSeconds = lockPeriodInDays
        ? lockPeriodInDays * SECONDS_IN_A_DAY
        : undefined;
      const sender = requireSender(txBlock);
      const vesca = await requireVeSca(builder, txBlock);

      let lockCoin: TransactionObjectArgument | SuiObjectArg | undefined =
        undefined;
      const transferObjects = [];
      if (amountOrCoin !== undefined && typeof amountOrCoin === 'number') {
        const coins = await builder.utils.selectCoinIds(
          amountOrCoin,
          SCA_COIN_TYPE,
          sender
        );
        const [takeCoin, leftCoin] = txBlock.takeAmountFromCoins(
          coins,
          amountOrCoin
        );
        lockCoin = takeCoin;
        transferObjects.push(leftCoin);
      } else {
        // With amountOrCoin is SuiObjectArg, we cannot validate the minimum sca amount for locking and topup
        lockCoin = amountOrCoin;
      }

      if (!vesca) {
        // no veSca but has sca and lock period
        if (!!lockCoin && !!lockPeriodInSeconds) {
          if (
            typeof amountOrCoin === 'number' &&
            amountOrCoin < MIN_INITIAL_LOCK_AMOUNT
          ) {
            throw new Error('Minimum lock amount for initial lock is 10 SCA');
          }
          if (lockPeriodInSeconds >= MAX_LOCK_DURATION - SECONDS_IN_A_DAY) {
            throw new Error(
              `Maximum lock period is ~4 years (${MAX_LOCK_ROUNDS - 1} days)`
            );
          }
          // console.log(Math.floor(now + lockPeriodInSeconds * 1000));
          const unlockAt = findClosest12AM(
            new Date().getTime() + lockPeriodInSeconds * 1000
          );
          // console.log(
          //   new Date(unlockAt * 1000).toLocaleString('en-GB', {
          //     hour12: true,
          //   })
          // );

          // new lock
          const veScaKey = txBlock.lockSca(lockCoin, unlockAt);
          transferObjects.push(veScaKey);
        } else {
          throw new Error(
            'SCA amount and lock period is required for initial lock'
          );
        }
      } else {
        // check for expiration
        const isVeScaExpired = vesca.unlockAt * 1000 <= new Date().getTime();
        if (isVeScaExpired) {
          if (!!lockCoin && !!lockPeriodInSeconds) {
            // if veScaExpired, user must withdraw current unlocked SCA first if any and renew
            const newUnlockAt = findClosest12AM(
              new Date().getTime() + lockPeriodInSeconds * 1000
            );
            if (lockPeriodInSeconds >= MAX_LOCK_DURATION - SECONDS_IN_A_DAY) {
              throw new Error(
                `Maximum lock period is ~4 years (${MAX_LOCK_ROUNDS - 1} days)`
              );
            }
            // user must withdraw current unlocked SCA first if any
            if (vesca.lockedScaAmount !== 0) {
              const unlockedSca = txBlock.redeemSca(vesca.keyId);
              transferObjects.push(unlockedSca);
            }
            // renew expired veSca is considered as initial lock
            if (
              typeof amountOrCoin === 'number' &&
              amountOrCoin < MIN_INITIAL_LOCK_AMOUNT
            ) {
              throw new Error(
                'Minimum lock amount for renewing expired vesca 10 SCA'
              );
            }
            // enforce renew on expired
            txBlock.renewExpiredVeSca(vesca.keyId, lockCoin, newUnlockAt);
          } else {
            throw new Error(
              'SCA amount and lock period is required for renewing expired vesca'
            );
          }
        } else if (lockCoin) {
          if (
            typeof amountOrCoin === 'number' &&
            amountOrCoin < MIN_TOP_UP_AMOUNT
          ) {
            throw new Error('Minimum top up amount is 1 SCA');
          }
          // extend lock amount
          txBlock.extendLockAmount(vesca.keyId, lockCoin);
        } else if (lockPeriodInSeconds) {
          /**
           * Extend lock period
           * newUnlockAt = previousUnlockTimestamp + lockPeriodInSeconds
           *
           * e.g.
           *  Bob locked 100 SCA for 30 days
           *  Bob wants to extend the lock period for 20 more days
           *  newUnlockAt = prevUnlockAt + 20 days
           */
          const prevUnlockAt = vesca.unlockAt;
          const newUnlockAt = findClosest12AM(
            (prevUnlockAt + lockPeriodInSeconds) * 1000
          );
          const totalLockDuration = newUnlockAt - prevUnlockAt;
          if (totalLockDuration >= MAX_LOCK_DURATION - SECONDS_IN_A_DAY) {
            throw new Error(
              `Maximum lock period is ~4 years (${MAX_LOCK_ROUNDS - 1} days)`
            );
          }
          txBlock.extendLockPeriod(vesca.keyId, newUnlockAt);
        }
      }

      if (transferObjects.length > 0) {
        txBlock.transferObjects(transferObjects, sender);
      }
    },
    extendLockPeriodQuick: async (
      lockPeriodInDays: number,
      veScaKey?: SuiAddressArg
    ) => {
      const veSca = await requireVeSca(builder, txBlock, veScaKey);
      if (!veSca) {
        throw new Error('veSca not found');
      }
      if (lockPeriodInDays < 0) {
        throw new Error('Lock period must be greater than 0');
      }

      const isVeScaExpired =
        (veSca.unlockAt ?? 0) * 1000 <= new Date().getTime();
      if (isVeScaExpired) {
        throw new Error('veSca is expired, use renewExpiredVeScaQuick instead');
      }

      const prevUnlockAt = veSca.unlockAt;
      const newUnlockAt = findClosest12AM(
        (prevUnlockAt + lockPeriodInDays * SECONDS_IN_A_DAY) * 1000
      );
      const totalLockDuration = newUnlockAt - prevUnlockAt;
      if (totalLockDuration >= MAX_LOCK_DURATION - SECONDS_IN_A_DAY) {
        throw new Error(
          `Maximum lock period is ~4 years (${MAX_LOCK_ROUNDS - 1} days)`
        );
      }
      txBlock.extendLockPeriod(veSca.keyId, newUnlockAt);
    },
    extendLockAmountQuick: async (
      scaCoinAmount: number,
      veScaKey?: SuiAddressArg
    ) => {
      if (scaCoinAmount < MIN_TOP_UP_AMOUNT) {
        throw new Error('Minimum top up amount is 1 SCA');
      }
      const sender = requireSender(txBlock);
      const veSca = await requireVeSca(builder, txBlock, veScaKey);

      if (!veSca) {
        throw new Error('veSca not found');
      }
      const isVeScaExpired =
        (veSca.unlockAt ?? 0) * 1000 <= new Date().getTime();
      if (isVeScaExpired) {
        throw new Error('veSca is expired, use renewExpiredVeScaQuick instead');
      }

      const scaCoins = await builder.utils.selectCoinIds(
        scaCoinAmount,
        SCA_COIN_TYPE,
        sender
      );
      const [takeCoin, leftCoin] = txBlock.takeAmountFromCoins(
        scaCoins,
        scaCoinAmount
      );

      txBlock.extendLockAmount(veSca.keyId, takeCoin);
      txBlock.transferObjects([leftCoin], sender);
    },
    renewExpiredVeScaQuick: async (
      scaCoinAmount: number,
      lockPeriodInDays: number,
      veScaKey?: SuiAddressArg
    ) => {
      if (scaCoinAmount < MIN_INITIAL_LOCK_AMOUNT) {
        throw new Error(
          'Minimum lock amount for renewing expired vesca 10 SCA'
        );
      }
      const sender = requireSender(txBlock);
      const veSca = await requireVeSca(builder, txBlock, veScaKey);
      const transferObjects = [];
      if (!veSca) {
        throw new Error('veSca not found');
      }

      if (veSca.lockedScaAmount !== 0) {
        const unlockedSca = txBlock.redeemSca(veSca.keyId);
        transferObjects.push(unlockedSca);
      }
      const scaCoins = await builder.utils.selectCoinIds(
        scaCoinAmount,
        SCA_COIN_TYPE,
        sender
      );
      const [takeCoin, leftCoin] = txBlock.takeAmountFromCoins(
        scaCoins,
        scaCoinAmount
      );
      transferObjects.push(leftCoin);

      const newUnlockAt = findClosest12AM(
        lockPeriodInDays * SECONDS_IN_A_DAY * 1000
      );
      txBlock.renewExpiredVeSca(veSca.keyId, takeCoin, newUnlockAt);
      txBlock.transferObjects(transferObjects, sender);
    },
    redeemScaQuick: async (veScaKey?: SuiAddressArg) => {
      const sender = requireSender(txBlock);
      const veSca = await requireVeSca(builder, txBlock, veScaKey);

      if (!veSca) {
        throw new Error('veSca not found');
      }

      const sca = txBlock.redeemSca(veSca.keyId);
      txBlock.transferObjects([sca], sender);
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

  // TODO: Add quickMethod for veSCA
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
