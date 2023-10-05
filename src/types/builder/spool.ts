import type {
  SuiTxBlock as SuiKitTxBlock,
  SuiTxArg,
} from '@scallop-io/sui-kit';
import type { ScallopBuilder } from '../../models';
import type { SupportStakeMarketCoins } from '../constant';
import type { TransactionResult } from './index';

export type SpoolIds = {
  spoolPkg: string;
};

export type SpoolNormalMethods = {
  createStakeAccount: (
    stakeMarketCoinName: SupportStakeMarketCoins
  ) => TransactionResult;
  stake: (
    stakeAccount: SuiTxArg,
    coin: SuiTxArg,
    stakeMarketCoinName: SupportStakeMarketCoins
  ) => void;
  unstake: (
    stakeAccount: SuiTxArg,
    amount: number,
    stakeMarketCoinName: SupportStakeMarketCoins
  ) => TransactionResult;
  claim: (
    stakeAccount: SuiTxArg,
    stakeMarketCoinName: SupportStakeMarketCoins
  ) => TransactionResult;
};

export type SpoolQuickMethods = {
  stakeQuick(
    amountOrMarketCoin: number,
    stakeMarketCoinName: SupportStakeMarketCoins,
    stakeAccountId?: SuiTxArg
  ): Promise<void>;
  stakeQuick(
    amountOrMarketCoin: TransactionResult,
    stakeMarketCoinName: SupportStakeMarketCoins,
    stakeAccountId?: SuiTxArg
  ): Promise<void>;
  unstakeQuick(
    amount: number,
    stakeMarketCoinName: SupportStakeMarketCoins,
    stakeAccountId?: SuiTxArg
  ): Promise<TransactionResult>;
  claimQuick(
    stakeMarketCoinName: SupportStakeMarketCoins,
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
