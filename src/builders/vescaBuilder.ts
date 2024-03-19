import {
  SUI_CLOCK_OBJECT_ID,
  SuiAddressArg,
  SuiTxBlock,
  TransactionBlock,
  SuiTxBlock as SuiKitTxBlock,
} from '@scallop-io/sui-kit';
import { SCA_COIN_TYPE } from 'src/constants';
import { ScallopBuilder } from '../models';
import { getVeSca, getVeScas } from '../queries';
import { requireSender } from '../utils';
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
    lockScaQuick: async (amountOrCoin, lockPeriodInSeconds) => {
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
        lockCoin = amountOrCoin;
      }

      if (vesca?.unlockAt && !!lockCoin && !!lockPeriodInSeconds) {
        // Extend lock amount and peroid
        const lockAt = findClosestThursday(
          Math.floor(vesca.unlockAt + lockPeriodInSeconds * 1000)
        );
        if (vesca.unlockAt * 1000 <= new Date().getTime()) {
          if (vesca.lockedScaAmount > 0) {
            const sca = txBlock.redeemSca(vesca.keyId);
            transferObjects.push(sca);
          }
          txBlock.renewExpiredVeSca(vesca.keyId, lockCoin, lockAt);
        }
        txBlock.extendLockPeriod(vesca.keyId, lockAt);
        txBlock.extendLockAmount(vesca.keyId, lockCoin);
      } else if (!!lockCoin && !!lockPeriodInSeconds) {
        // New lock.
        const now = new Date().getTime();
        console.log(Math.floor(now + lockPeriodInSeconds * 1000));
        const lockAt = findClosestThursday(
          Math.floor(now + lockPeriodInSeconds * 1000)
        );
        console.log(lockAt);
        console.log(
          new Date(lockAt).toLocaleString('en-GB', {
            hour12: true,
          })
        );
        const veScaKey = txBlock.lockSca(lockCoin, lockAt);
        transferObjects.push(veScaKey);
        txBlock.transferObjects(transferObjects, sender);
      } else if (vesca?.unlockAt && !!lockCoin) {
        // Extend lock amount.
        txBlock.extendLockAmount(vesca.keyId, lockCoin);
      } else if (vesca?.unlockAt && !!lockPeriodInSeconds) {
        // Extend lock period.
        const lockAt = findClosestThursday(
          Math.floor(vesca.unlockAt + lockPeriodInSeconds * 1000)
        );
        txBlock.extendLockPeriod(vesca.keyId, lockAt);
      }
    },
    extendLockPeriodQuick: async (
      newUnlockAt: number,
      veScaKey?: SuiAddressArg
    ) => {
      const veSca = await requireVeSca(builder, txBlock, veScaKey);

      if (!veSca) {
        throw new Error('veSca not found');
      }

      txBlock.extendLockPeriod(veSca.keyId, newUnlockAt);
    },
    extendLockAmountQuick: async (
      scaCoinAmount: number,
      veScaKey?: SuiAddressArg
    ) => {
      const sender = requireSender(txBlock);
      const veSca = await requireVeSca(builder, txBlock, veScaKey);

      if (!veSca) {
        throw new Error('veSca not found');
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
      newUnlockAt: number,
      veScaKey?: SuiAddressArg
    ) => {
      const sender = requireSender(txBlock);
      const veSca = await requireVeSca(builder, txBlock, veScaKey);

      if (!veSca) {
        throw new Error('veSca not found');
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
      txBlock.renewExpiredVeSca(veSca.keyId, takeCoin, newUnlockAt);
      txBlock.transferObjects([leftCoin], sender);
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
