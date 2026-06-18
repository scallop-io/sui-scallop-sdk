import { SuiClientTypes } from '@mysten/sui/client';
import type { Transaction } from '@mysten/sui/transactions';
import { ScallopBuilder } from 'src/builder/index.js';
import type ScallopConstants from 'src/models/scallopConstants/index.js';
import type ScallopQuery from 'src/models/scallopQuery/index.js';
import type ScallopUtils from 'src/models/scallopUtils/index.js';
import type {
  DefaultTxInclude,
  TransactionExecutor,
} from 'src/models/transactionExecutor.js';

export type ClientTxResult<
  S extends boolean,
  Include extends DefaultTxInclude = DefaultTxInclude,
> = S extends true ? SuiClientTypes.TransactionResult<Include> : Transaction;

/**
 * The exact surface that client-side application services consume. Derived
 * structurally from the concrete model classes so the types stay in sync.
 *
 * `ScallopClient` is structurally assignable to this interface (it already
 * exposes every member via fields/getters), which lets services accept either
 * a `ScallopClient` or a hand-built fake without depending on the concrete
 * class.
 */
export interface ClientServiceContext {
  readonly walletAddress: string;
  readonly builder: Pick<ScallopBuilder, 'createTxBlock'>;
  readonly query: Pick<
    ScallopQuery,
    'getObligations' | 'getObligationAccount' | 'getStakeAccounts' | 'getVeScas'
  >;
  readonly utils: Pick<
    ScallopUtils,
    | 'logger'
    | 'mergeSimilarCoins'
    | 'parseCoinName'
    | 'parseCoinType'
    | 'parseMarketCoinName'
    | 'parseSCoinType'
  >;
  readonly constants: Pick<ScallopConstants, 'whitelist'>;
  readonly executor: TransactionExecutor;
}
