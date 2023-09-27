import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { newCoreTxBlock } from './coreBuilder';
import { newSpoolTxBlock } from './spoolBuilder';
import type { ScallopBuilder } from '../models';
import type { ScallopTxBlock } from '../types';

/**
 * Create a new ScallopTxBlock instance.
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
 * @return ScallopTxBlock
 */
export const newScallopTxBlock = (
  builder: ScallopBuilder,
  initTxBlock?: ScallopTxBlock | SuiKitTxBlock | TransactionBlock
): ScallopTxBlock => {
  const spoolTxBlock = newSpoolTxBlock(builder, initTxBlock);
  const coreTxBlock = newCoreTxBlock(builder, spoolTxBlock);

  return new Proxy(coreTxBlock, {
    get: (target, prop) => {
      if (prop in spoolTxBlock) {
        return Reflect.get(spoolTxBlock, prop);
      }
      return Reflect.get(target, prop);
    },
  }) as ScallopTxBlock;
};
