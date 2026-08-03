import { Transaction } from '@mysten/sui/transactions';
import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import type { ReadTransport, ScallopBuilder } from 'src/models/index.js';
import type {
  SuiTxBlockWithBorrowIncentiveNormalMethods,
  BorrowIncentiveTxBlock,
  ScallopTxBlock,
} from 'src/types/index.js';
import { generateBorrowIncentiveNormalMethod } from './moveCalls.js';
import {
  generateBorrowIncentiveQuickMethod,
  type BorrowIncentiveActionContext,
} from './quick.js';
import type { MoveCallContext } from '../context.js';

/**
 * Create an enhanced transaction block instance for interaction with borrow incentive modules of the Scallop contract.
 *
 * @param builder - Scallop builder instance.
 * @param initTxBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
 * @return Scallop borrow incentive txBlock.
 */
export const newBorrowIncentiveTxBlock = (
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

  const actionContext: BorrowIncentiveActionContext = {
    address: builder.address,
    reads: {
      getObligations: (ownerAddress) =>
        builder.query.getObligations(ownerAddress),
      getObligationLocked: (obligationId) =>
        builder.query.getObligationLocked(obligationId),
      getBindedVeScaKey: (obligationId) =>
        builder.query.getBindedVeScaKey(obligationId),
    },
  };

  const normalMethod = generateBorrowIncentiveNormalMethod({
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
  }) as SuiTxBlockWithBorrowIncentiveNormalMethods;

  const quickMethod = generateBorrowIncentiveQuickMethod({
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
  }) as BorrowIncentiveTxBlock;
};
