import { Transaction, SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { ScallopBuilder } from 'src/models/index.js';
import type { ReadTransport } from 'src/models/index.js';
import { generateNormalVeScaMethod } from './moveCalls.js';
import { generateQuickVeScaMethod, type VeScaActionContext } from './quick.js';
import type {
  ScallopTxBlock,
  SuiTxBlockWithVeScaNormalMethods,
  VeScaTxBlock,
} from 'src/types/index.js';
import type { MoveCallContext } from '../context.js';

/**
 * Create an enhanced transaction block instance for interaction with veSCA modules of the Scallop contract.
 *
 * @param builder - Scallop builder instance.
 * @param initTxBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
 * @return Scallop borrow incentive txBlock.
 */
export const newVeScaTxBlock = (
  builder: ScallopBuilder<ReadTransport>,
  initTxBlock?: ScallopTxBlock | SuiKitTxBlock | Transaction
) => {
  const txBlock =
    initTxBlock instanceof Transaction
      ? new SuiKitTxBlock(initTxBlock)
      : initTxBlock
        ? initTxBlock
        : new SuiKitTxBlock();

  // Build the narrow contexts once from `builder`, binding the closures.
  const moveCallContext: MoveCallContext = {
    address: builder.address,
    moveCall: builder.moveCall.bind(builder),
    utils: builder.utils,
  };

  const actionContext: VeScaActionContext = {
    address: builder.address,
    utils: builder.utils,
    reads: {
      getVeSca: (veScaKey) => builder.query.getVeSca(veScaKey),
      getVeScas: (input) => builder.query.getVeScas(input),
      isVeScaKeyInSubsTable: (veScaKey, tableId) =>
        builder.query.repos.veSca.isVeScaKeyInSubsTable(veScaKey, tableId),
    },
  };

  const normalMethod = generateNormalVeScaMethod({
    ctx: moveCallContext,
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
    ctx: actionContext,
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
