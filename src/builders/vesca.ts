import {
  SUI_CLOCK_OBJECT_ID,
  SuiAddressArg,
  SuiTxBlock,
  TransactionBlock,
  SuiTxBlock as SuiKitTxBlock,
} from '@scallop-io/sui-kit';
import { ScallopBuilder } from '../models';
import { getVeSca, getVeScas } from '../queries';
import { requireSender } from '../utils';
import {
  BorrowIncentiveTxBlock,
  GenerateVeScaNormalMethod,
  ScallopTxBlock,
  SuiTxBlockWithBorrowIncentiveNormalMethods,
  VescaIds,
} from 'src/types';

/**
 * Check and get veSCA information from transaction block.
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
    return {
      veScaKey: veSca.keyId,
      veScaId: veSca.id,
      lockedScaAmount: veSca.locked_sca_amount,
      unlockAt: veSca.unlock_at,
    };
  }

  const sender = requireSender(txBlock);
  const veScas = await getVeScas(builder.query, sender);
  if (veScas.length === 0) {
    throw new Error('VeSca not found');
  }

  return {
    veScaKey: veScas[0].keyId,
    veScaId: veScas[0].id,
    lockedScaAmount: veScas[0].locked_sca_amount,
    unlockAt: veScas[0].unlock_at,
  };
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
    lockSca: (scaCoin, unlock_at) => {
      txBlock.moveCall(
        `${veScaIds.pkgId}::ve_sca::mint_ve_sca_key`,
        [
          veScaIds.config,
          veScaIds.table,
          veScaIds.treasury,
          scaCoin,
          unlock_at,
          SUI_CLOCK_OBJECT_ID,
        ],
        []
      );
    },
    extendLockPeriod: (veScaKey, new_unlock_at) => {
      txBlock.moveCall(
        `${veScaIds.pkgId}::ve_sca::extend_lock_period`,
        [
          veScaIds.config,
          veScaKey,
          veScaIds.table,
          veScaIds.treasury,
          new_unlock_at,
          SUI_CLOCK_OBJECT_ID,
        ],
        []
      );
    },
    lockMoreSca: (veScaKey, scaCoin) => {
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
    renewExpiredVeSca: (veScaKey, scaCoin, new_unlock_at) => {
      txBlock.moveCall(
        `${veScaIds.pkgId}::ve_sca::renew_expired_ve_sca`,
        [
          veScaIds.config,
          veScaKey,
          veScaIds.table,
          veScaIds.treasury,
          scaCoin,
          new_unlock_at,
          SUI_CLOCK_OBJECT_ID,
        ],
        []
      );
    },
    withdrawSca: (veScaKey) => {
      return txBlock.moveCall(
        `${veScaIds.pkgId}::ve_sca::withdraw_sca`,
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
  }) as SuiTxBlockWithBorrowIncentiveNormalMethods;

  // TODO: Add quickMethod for veSCA
  const quickMethod = generateNormalVeScaMethod({
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
