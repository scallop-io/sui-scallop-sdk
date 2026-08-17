import { Transaction } from '@mysten/sui/transactions';
import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { generateSpoolNormalMethod } from './moveCalls.js';
import { generateSpoolQuickMethod } from './quick.js';
import type { ReadTransport } from 'src/models/scallopQuery/types.js';
import type { ScallopBuilder } from 'src/models/index.js';
import type {
  SuiTxBlockWithSpoolNormalMethods,
  SpoolTxBlock,
  ScallopTxBlock,
  SuiTxBlockWithSCoin,
  SpoolActionContext,
} from 'src/types/index.js';
import type { MoveCallContext } from '../context.js';

/**
 * Create an enhanced transaction block instance for interaction with spool modules of the Scallop contract.
 *
 * @param builder - Scallop builder instance.
 * @param initTxBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
 * @return Scallop spool txBlock.
 */
export const newSpoolTxBlock = (
  builder: ScallopBuilder<ReadTransport>,
  initTxBlock?:
    | ScallopTxBlock
    | SuiKitTxBlock
    | Transaction
    | SuiTxBlockWithSCoin
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

  const actionContext: SpoolActionContext = {
    reads: {
      getAllStakeAccounts: (ownerAddress) =>
        builder.query.getAllStakeAccounts(ownerAddress),
    },
    coins: {
      selectMarketCoin: (...args) => builder.selectMarketCoin(...args),
      selectSCoin: (...args) => builder.selectSCoin(...args),
    },
  };

  const normalMethod = generateSpoolNormalMethod({
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
  }) as SuiTxBlockWithSpoolNormalMethods;

  const quickMethod = generateSpoolQuickMethod({
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
  }) as SpoolTxBlock;
};
