import type {
  SuiTxBlock as SuiKitTxBlock,
  SuiAddressArg,
  SuiObjectArg,
} from '@scallop-io/sui-kit';
import type { TransactionResult } from '@mysten/sui/transactions';
import type { ScallopBuilder } from 'src/models';
import type { SupportStakeMarketCoins } from 'src/types/constant';
import { SuiTxBlockWithSCoin } from '.';

export type SpoolIds = {
  spoolPkg: string;
};

export type SpoolNormalMethods = {
  createStakeAccount: (
    stakeMarketCoinName: SupportStakeMarketCoins
  ) => TransactionResult;
  stake: (
    stakeAccount: SuiAddressArg,
    coin: SuiObjectArg,
    stakeMarketCoinName: SupportStakeMarketCoins
  ) => void;
  unstake: (
    stakeAccount: SuiAddressArg,
    amount: number,
    stakeMarketCoinName: SupportStakeMarketCoins
  ) => TransactionResult;
  claim: (
    stakeAccount: SuiAddressArg,
    stakeMarketCoinName: SupportStakeMarketCoins
  ) => TransactionResult;
};

export type SpoolQuickMethods = {
  stakeQuick(
    amountOrMarketCoin: SuiObjectArg | number,
    stakeMarketCoinName: SupportStakeMarketCoins,
    stakeAccountId?: SuiAddressArg
  ): Promise<void>;
  unstakeQuick(
    amount: number,
    stakeMarketCoinName: SupportStakeMarketCoins,
    stakeAccountId?: SuiAddressArg,
    returnSCoin?: boolean
  ): Promise<TransactionResult | undefined>;
  claimQuick(
    stakeMarketCoinName: SupportStakeMarketCoins,
    stakeAccountId?: SuiAddressArg
  ): Promise<TransactionResult[]>;
};

export type SuiTxBlockWithSpoolNormalMethods = SuiKitTxBlock &
  SuiTxBlockWithSCoin &
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
