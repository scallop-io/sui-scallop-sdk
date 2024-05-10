import type { CoreTxBlock } from './core';
import type { SpoolTxBlock } from './spool';
import type { BorrowIncentiveTxBlock } from './borrowIncentive';
import type { VeScaTxBlock } from './vesca';
import { ReferralTxBlock } from './referral';

export type * from './core';
export type * from './spool';
export type * from './borrowIncentive';
export type * from './vesca';

export type ScallopTxBlock = CoreTxBlock &
  SpoolTxBlock &
  ReferralTxBlock &
  BorrowIncentiveTxBlock &
  VeScaTxBlock;
