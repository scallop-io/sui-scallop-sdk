import type { TransactionArgument } from '@mysten/sui.js/transactions';
import type { CoreTxBlock } from './core';
import type { SpoolTxBlock } from './spool';

export type * from './core';
export type * from './spool';

export type ScallopTxBlock = CoreTxBlock & SpoolTxBlock;
export type TransactionResult = TransactionArgument & TransactionArgument[];
