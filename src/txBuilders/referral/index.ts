import { ScallopBuilder } from 'src/models/index.js';
import { ScallopTxBlock } from 'src/types/index.js';
import { SuiTxBlock as SuiKitTxBlock, Transaction } from '@scallop-io/sui-kit';
import {
  ReferralTxBlock,
  SuiTxBlockWithReferralNormalMethods,
} from 'src/types/builder/referral.js';
import { generateReferralNormalMethod } from './moveCalls.js';
import {
  generateReferralQuickMethod,
  type ReferralActionContext,
} from './quick.js';
import type { MoveCallContext } from '../context.js';

/**
 * Create an enhanced transaction block instance for interaction with borrow incentive modules of the Scallop contract.
 *
 * @param builder - Scallop builder instance.
 * @param initTxBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
 * @return Scallop referral txBlock.
 */
export const newReferralTxBlock = (
  builder: ScallopBuilder,
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

  const actionContext: ReferralActionContext = {
    utils: builder.utils,
    constants: { whitelist: builder.constants.whitelist },
  };

  const normalMethod = generateReferralNormalMethod({
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
  }) as SuiTxBlockWithReferralNormalMethods;

  const quickMethod = generateReferralQuickMethod({
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
  }) as ReferralTxBlock;
};
