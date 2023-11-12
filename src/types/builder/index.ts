import type { CoreTxBlock } from './core';
import type { SpoolTxBlock } from './spool';
import type { BorrowIncentiveTxBlock } from './borrowIncentive';

export type * from './core';
export type * from './spool';
export type * from './borrowIncentive';

export type ScallopTxBlock = CoreTxBlock &
  SpoolTxBlock &
  BorrowIncentiveTxBlock;
