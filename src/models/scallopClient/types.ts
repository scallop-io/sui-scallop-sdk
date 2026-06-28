import { SuiClientTypes } from '@mysten/sui/client';
import ScallopBuilder from '../scallopBuilder/index.js';
import { ScallopBuilderConstructorParams } from '../scallopBuilder/types.js';
import { Transaction, TransactionResult } from '@mysten/sui/transactions';
import { DefaultTxInclude } from '../transactionExecutor.js';

export type ScallopClientConstructorParams = {
  networkType?: SuiClientTypes.Network;
  builder?: ScallopBuilder;
} & ScallopBuilderConstructorParams;

export type ScallopClientFnReturnType<
  T extends boolean,
  Include extends DefaultTxInclude = DefaultTxInclude,
> = T extends true ? SuiClientTypes.TransactionResult<Include> : Transaction;

export type ScallopClientVeScaReturnType<
  T extends boolean,
  Include extends DefaultTxInclude = DefaultTxInclude,
> = T extends true
  ? SuiClientTypes.TransactionResult<Include>
  : {
      tx: Transaction;
      scaCoin: TransactionResult;
    };
