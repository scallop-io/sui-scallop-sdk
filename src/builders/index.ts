import { Transaction } from '@mysten/sui/transactions';
import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { newCoreTxBlock } from './coreBuilder';
import { newSpoolTxBlock } from './spoolBuilder';
import { newBorrowIncentiveTxBlock } from './borrowIncentiveBuilder';
import { newVeScaTxBlock } from './vescaBuilder';
import type { ScallopBuilder } from 'src/models';
import type { ScallopTxBlock } from 'src/types';
import { newReferralTxBlock } from './referralBuilder';
import { newLoyaltyProgramTxBlock } from './loyaltyProgramBuilder';
import { newSCoinTxBlock } from './sCoinBuilder';

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
