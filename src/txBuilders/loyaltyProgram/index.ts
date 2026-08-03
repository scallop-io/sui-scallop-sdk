import { Transaction } from '@mysten/sui/transactions';
import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { ScallopBuilder } from 'src/models/index.js';
import type { ReadTransport } from 'src/models/index.js';
import {
  LoyaltyProgramTxBlock,
  ScallopTxBlock,
  SuiTxBlockWithLoyaltyProgramNormalMethods,
} from 'src/types/index.js';
import { generateLoyaltyProgramNormalMethod } from './moveCalls.js';
import {
  generateLoyaltyProgramQuickMethod,
  type LoyaltyProgramActionContext,
} from './quick.js';
import type { MoveCallContext } from '../context.js';

/**
 * Create an enhanced transaction block instance for interaction with loyalty program modules of the Scallop contract.
 *
 * @param builder - Scallop builder instance.
 * @param initTxBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
 * @return Scallop loyalty program txBlock.
 */
export const newLoyaltyProgramTxBlock = (
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

  const actionContext: LoyaltyProgramActionContext = {
    utils: builder.utils,
    reads: {
      getVeScas: (...args) => builder.query.getVeScas(...args),
    },
    constants: {
      coinTypes: builder.constants.coinTypes,
    },
  };

  const normalMethod = generateLoyaltyProgramNormalMethod({
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
  }) as SuiTxBlockWithLoyaltyProgramNormalMethods;

  const quickMethod = generateLoyaltyProgramQuickMethod({
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
  }) as LoyaltyProgramTxBlock;
};
