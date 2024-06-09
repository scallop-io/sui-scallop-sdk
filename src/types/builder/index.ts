import type { CoreTxBlock } from './core';
import type { SpoolTxBlock } from './spool';
import type { BorrowIncentiveTxBlock } from './borrowIncentive';
import type { VeScaTxBlock } from './vesca';
import type { ReferralTxBlock } from './referral';
import { LoyaltyProgramTxBlock } from './loyaltyProgram';

export type * from './core';
export type * from './spool';
export type * from './borrowIncentive';
export type * from './vesca';
export type * from './loyaltyProgram';

export type ScallopTxBlock = CoreTxBlock &
  SpoolTxBlock &
  ReferralTxBlock &
  LoyaltyProgramTxBlock &
  BorrowIncentiveTxBlock &
  VeScaTxBlock;
