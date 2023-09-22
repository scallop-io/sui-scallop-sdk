import type { TransactionArgument } from '@mysten/sui.js';
import type {
  SuiTxBlock as SuiKitTxBlock,
  SuiTxArg,
} from '@scallop-io/sui-kit';
import type { ScallopBuilder } from '../../models';
import type { SupportStakeMarketCoins } from '../data';

type TransactionResult = TransactionArgument & TransactionArgument[];

export type SpoolIds = {
  spoolPkg: string;
};

export type SpoolNormalMethods = {
  createStakeAccount: (
    marketCoinName: SupportStakeMarketCoins
  ) => TransactionResult;
  stake: (
    stakeAccount: SuiTxArg,
    coin: SuiTxArg,
    marketCoinName: SupportStakeMarketCoins
  ) => void;
  unstake: (
    stakeAccount: SuiTxArg,
    amount: number,
    marketCoinName: SupportStakeMarketCoins
  ) => TransactionResult;
  claim: (
    stakeAccount: SuiTxArg,
    marketCoinName: SupportStakeMarketCoins
  ) => TransactionResult;
};

export type SpoolQuickMethods = {
  stakeQuick(
    amountOrMarketCoin: number,
    marketCoinName: SupportStakeMarketCoins,
    stakeAccountId?: SuiTxArg
  ): Promise<void>;
  stakeQuick(
    amountOrMarketCoin: TransactionResult,
    marketCoinName: SupportStakeMarketCoins,
    stakeAccountId?: SuiTxArg
  ): Promise<void>;
  unstakeQuick(
    amount: number,
    marketCoinName: SupportStakeMarketCoins,
    stakeAccountId?: SuiTxArg
  ): Promise<TransactionResult>;
  claimQuick(
    marketCoinName: SupportStakeMarketCoins,
    stakeAccountId?: SuiTxArg
  ): Promise<TransactionResult>;
};

export type SuiTxBlockWithSpoolNormalMethods = SuiKitTxBlock &
  SpoolNormalMethods;

export type SpoolTxBlock = SuiTxBlockWithSpoolNormalMethods & SpoolQuickMethods;

export type GenerateSpoolNormalMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiKitTxBlock;
}) => SpoolNormalMethods;

export type GenerateSpoolQuickMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiTxBlockWithSpoolNormalMethods;
}) => SpoolQuickMethods;
