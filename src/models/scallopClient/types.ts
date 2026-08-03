import { SuiClientTypes } from '@mysten/sui/client';
import ScallopBuilder from '../scallopBuilder/index.js';
import { ScallopBuilderConstructorParams } from '../scallopBuilder/types.js';
import type { ReadTransport } from '../scallopQuery/types.js';
import { Transaction, TransactionResult } from '@mysten/sui/transactions';
import { DefaultTxInclude } from '../transactionExecutor.js';
import type { DistributiveMerge } from 'src/types/utils.js';

// `DistributiveMerge` keeps the `readTransport` transport union at the top level
// so its guard survives up to `new Scallop(...)`. See `src/types/utils.ts`.
export type ScallopClientConstructorParams = DistributiveMerge<
  ScallopBuilderConstructorParams,
  {
    networkType?: SuiClientTypes.Network;
    builder?: ScallopBuilder<ReadTransport>;
  }
>;

/**
 * Client params carrying the `readTransport` inference site (see
 * `ScallopQueryParamsFor`). An injected `builder` narrows `T` as well.
 */
export type ScallopClientParamsFor<T extends ReadTransport> = DistributiveMerge<
  ScallopClientConstructorParams,
  { readTransport?: T; builder?: ScallopBuilder<T> }
>;

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
