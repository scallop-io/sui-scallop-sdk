import type { CoreTxBlock } from './core.js';
import type { SpoolTxBlock } from './spool.js';
import type { BorrowIncentiveTxBlock } from './borrowIncentive.js';
import type { VeScaTxBlock } from './vesca.js';
import type { ReferralTxBlock } from './referral.js';
import { LoyaltyProgramTxBlock } from './loyaltyProgram.js';
import { SCoinTxBlock } from './sCoin.js';
import type { ObligationNamingTxBlock } from './obligationNaming.js';
import type { ScallopTxBlockModules } from './modules.js';

export type * from './core.js';
export type * from './spool.js';
export type * from './borrowIncentive.js';
export type * from './vesca.js';
export type * from './loyaltyProgram.js';
export type * from './sCoin.js';
export type * from './modules.js';
export type * from './referral.js';
export type * from './obligationNaming.js';

export type BaseScallopTxBlock = ReferralTxBlock &
  LoyaltyProgramTxBlock &
  BorrowIncentiveTxBlock &
  VeScaTxBlock &
  ObligationNamingTxBlock;

export type SuiTxBlockWithSCoin = BaseScallopTxBlock & SCoinTxBlock;
export type SuiTxBlockWithSpool = SuiTxBlockWithSCoin & SpoolTxBlock;
export type ScallopTxBlock = SuiTxBlockWithSpool &
  CoreTxBlock &
  ScallopTxBlockModules;
