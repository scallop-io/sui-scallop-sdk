import type {
  SuiTxBlock as SuiKitTxBlock,
  SuiAddressArg,
  SuiObjectArg,
} from '@scallop-io/sui-kit';
import type { TransactionResult } from '@mysten/sui/transactions';
import type { ScallopBuilder } from '../../models/index.js';
import type { MoveCallContext } from '../../builders/context.js';
import { SuiTxBlockWithSCoin } from './index.js';

export type SpoolIds = {
  spoolPkg: string;
};

/**
 * The explicit orchestration toolkit a spool quick method needs.
 *
 * @description
 * Narrow context injected into {@link GenerateSpoolQuickMethod}. Built once from
 * `builder` in the factory and passed (instead of `builder`) into the quick
 * generator. Method signatures are taken via indexed-access types so they stay
 * in sync with `ScallopBuilder`.
 */
export type SpoolActionContext = {
  reads: {
    getAllStakeAccounts: ScallopBuilder['query']['getAllStakeAccounts'];
  };
  coins: {
    selectMarketCoin: ScallopBuilder['selectMarketCoin'];
    selectSCoin: ScallopBuilder['selectSCoin'];
  };
};

export type SpoolNormalMethods = {
  createStakeAccount: (stakeMarketCoinName: string) => TransactionResult;
  stake: (
    stakeAccount: SuiAddressArg,
    coin: SuiObjectArg,
    stakeMarketCoinName: string
  ) => void;
  unstake: (
    stakeAccount: SuiAddressArg,
    amount: number,
    stakeMarketCoinName: string
  ) => TransactionResult;
  claim: (
    stakeAccount: SuiAddressArg,
    stakeMarketCoinName: string
  ) => TransactionResult;
};

export type SpoolQuickMethods = {
  stakeQuick(
    amountOrMarketCoin: SuiObjectArg | number,
    stakeMarketCoinName: string,
    stakeAccountId?: SuiAddressArg
  ): Promise<void>;
  unstakeQuick(
    amount: number,
    stakeMarketCoinName: string,
    stakeAccountId?: SuiAddressArg,
    returnSCoin?: boolean
  ): Promise<TransactionResult | undefined>;
  claimQuick(
    stakeMarketCoinName: string,
    stakeAccountId?: SuiAddressArg
  ): Promise<TransactionResult[]>;
};

export type SuiTxBlockWithSpoolNormalMethods = SuiKitTxBlock &
  SuiTxBlockWithSCoin &
  SpoolNormalMethods;

export type SpoolTxBlock = SuiTxBlockWithSpoolNormalMethods & SpoolQuickMethods;

export type GenerateSpoolNormalMethod = (params: {
  ctx: MoveCallContext;
  txBlock: SuiKitTxBlock;
}) => SpoolNormalMethods;

export type GenerateSpoolQuickMethod = (params: {
  ctx: SpoolActionContext;
  txBlock: SuiTxBlockWithSpoolNormalMethods;
}) => SpoolQuickMethods;
