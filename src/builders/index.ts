import { Transaction } from '@mysten/sui/transactions';
import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { newCoreTxBlock } from './coreBuilder.js';
import { newSpoolTxBlock } from './spoolBuilder.js';
import { newBorrowIncentiveTxBlock } from './borrowIncentiveBuilder.js';
import { newVeScaTxBlock } from './vescaBuilder.js';
import type { ScallopBuilder } from 'src/models/index.js';
import type { ScallopTxBlock } from 'src/types/index.js';
import { newReferralTxBlock } from './referralBuilder.js';
import { newLoyaltyProgramTxBlock } from './loyaltyProgramBuilder.js';
import { newSCoinTxBlock } from './sCoinBuilder.js';

/**
 * Create a new ScallopTxBlock instance.
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
 * @return ScallopTxBlock.
 */
export const newScallopTxBlock = (
  builder: ScallopBuilder,
  initTxBlock?: ScallopTxBlock | SuiKitTxBlock | Transaction
): ScallopTxBlock => {
  const vescaTxBlock = newVeScaTxBlock(builder, initTxBlock);
  const loyaltyTxBlock = newLoyaltyProgramTxBlock(builder, vescaTxBlock);
  const borrowIncentiveTxBlock = newBorrowIncentiveTxBlock(
    builder,
    loyaltyTxBlock
  );
  const referralTxBlock = newReferralTxBlock(builder, borrowIncentiveTxBlock);
  const sCoinTxBlock = newSCoinTxBlock(builder, referralTxBlock);
  const spoolTxBlock = newSpoolTxBlock(builder, sCoinTxBlock);
  const coreTxBlock = newCoreTxBlock(builder, spoolTxBlock);

  return new Proxy(coreTxBlock, {
    get: (target, prop) => {
      if (prop in vescaTxBlock) {
        return Reflect.get(vescaTxBlock, prop);
      } else if (prop in borrowIncentiveTxBlock) {
        return Reflect.get(borrowIncentiveTxBlock, prop);
      } else if (prop in referralTxBlock) {
        return Reflect.get(referralTxBlock, prop);
      } else if (prop in spoolTxBlock) {
        return Reflect.get(spoolTxBlock, prop);
      } else if (prop in loyaltyTxBlock) {
        return Reflect.get(loyaltyTxBlock, prop);
      } else if (prop in sCoinTxBlock) {
        return Reflect.get(sCoinTxBlock, prop);
      }
      return Reflect.get(target, prop);
    },
  }) as ScallopTxBlock;
};
