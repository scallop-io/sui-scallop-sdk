import type {
  SuiTxBlock as SuiKitTxBlock,
  SuiAddressArg,
  SuiObjectArg,
} from '@scallop-io/sui-kit';
import type { TransactionResult } from '@mysten/sui/transactions';
import type { ScallopBuilder } from '../../models';
import { SuiTxBlockWithSCoin } from '.';

export type SpoolIds = {
  spoolPkg: string;
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
  builder: ScallopBuilder;
  txBlock: SuiKitTxBlock;
}) => SpoolNormalMethods;

export type GenerateSpoolQuickMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiTxBlockWithSpoolNormalMethods;
}) => SpoolQuickMethods;
