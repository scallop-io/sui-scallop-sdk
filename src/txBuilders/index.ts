import { Transaction } from '@mysten/sui/transactions';
import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { newCoreTxBlock } from './core/index.js';
import { newSpoolTxBlock } from './spool/index.js';
import { newBorrowIncentiveTxBlock } from './borrowIncentive/index.js';
import { newVeScaTxBlock } from './vesca/index.js';
import type { ReadTransport, ScallopBuilder } from 'src/models/index.js';
import type { ScallopTxBlock, ScallopTxBlockModules } from 'src/types/index.js';
import { newReferralTxBlock } from './referral/index.js';
import { newLoyaltyProgramTxBlock } from './loyaltyProgram/index.js';
import { newSCoinTxBlock } from './sCoin/index.js';
import { newObligationNamingTxBlock } from './obligationNaming/index.js';
import { buildTxBlockModules, TX_BLOCK_MODULE_KEYS } from './modules.js';

/**
 * Create a new ScallopTxBlock instance.
 *
 * The returned object exposes:
 *  - flat methods from every domain builder (`tx.supply`, `tx.stake`, …) for
 *    compatibility with existing call sites.
 *  - per-domain module views (`tx.core.supply`, `tx.spool.stake`, …) for the
 *    explicit composite API. Module views are frozen and built once from the
 *    composed proxy via the static manifest.
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
 * @return ScallopTxBlock.
 */
export const newScallopTxBlock = (
  builder: ScallopBuilder<ReadTransport>,
  initTxBlock?: ScallopTxBlock | SuiKitTxBlock | Transaction
): ScallopTxBlock => {
  const obligationNamingTxBlock = newObligationNamingTxBlock(
    builder,
    initTxBlock
  );
  const vescaTxBlock = newVeScaTxBlock(builder, obligationNamingTxBlock);
  const loyaltyTxBlock = newLoyaltyProgramTxBlock(builder, vescaTxBlock);
  const borrowIncentiveTxBlock = newBorrowIncentiveTxBlock(
    builder,
    loyaltyTxBlock
  );
  const referralTxBlock = newReferralTxBlock(builder, borrowIncentiveTxBlock);
  const sCoinTxBlock = newSCoinTxBlock(builder, referralTxBlock);
  const spoolTxBlock = newSpoolTxBlock(builder, sCoinTxBlock);
  const coreTxBlock = newCoreTxBlock(builder, spoolTxBlock);

  const composed = new Proxy(coreTxBlock, {
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
      } else if (prop in obligationNamingTxBlock) {
        return Reflect.get(obligationNamingTxBlock, prop);
      }
      return Reflect.get(target, prop);
    },
  }) as ScallopTxBlock;

  const modules = buildTxBlockModules(composed);
  const moduleKeySet = new Set<PropertyKey>(TX_BLOCK_MODULE_KEYS);
  composed.setSenderIfNotSet(builder.walletAddress);

  return new Proxy(composed, {
    get: (target, prop) => {
      if (typeof prop === 'string' && moduleKeySet.has(prop)) {
        return modules[prop as keyof ScallopTxBlockModules];
      }
      return Reflect.get(target, prop);
    },
    has: (target, prop) => {
      if (typeof prop === 'string' && moduleKeySet.has(prop)) {
        return true;
      }
      return Reflect.has(target, prop);
    },
  }) as ScallopTxBlock;
};
