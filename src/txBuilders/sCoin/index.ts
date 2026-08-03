import { Transaction, SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { ScallopBuilder } from 'src/models/index.js';
import type { ReadTransport } from 'src/models/index.js';
import {
  BaseScallopTxBlock,
  SCoinTxBlock,
  ScallopTxBlock,
  SuiTxBlockWithSCoinNormalMethods,
} from 'src/types/index.js';
import { generateSCoinNormalMethod } from './moveCalls.js';
import { generateSCoinQuickMethod } from './quick.js';
import type { MoveCallContext } from '../context.js';
import type { SCoinActionContext } from 'src/types/index.js';

export const newSCoinTxBlock = (
  builder: ScallopBuilder<ReadTransport>,
  initTxBlock?:
    | ScallopTxBlock
    | SuiKitTxBlock
    | Transaction
    | BaseScallopTxBlock
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

  const actionContext: SCoinActionContext = {
    utils: builder.utils,
    coins: {
      selectMarketCoin: (...args) => builder.selectMarketCoin(...args),
      selectSCoin: (...args) => builder.selectSCoin(...args),
    },
  };

  const normalMethod = generateSCoinNormalMethod({
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
  }) as SuiTxBlockWithSCoinNormalMethods;

  const quickMethod = generateSCoinQuickMethod({
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
  }) as SCoinTxBlock;
};
