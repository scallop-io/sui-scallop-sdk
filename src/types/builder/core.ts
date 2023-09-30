import type {
  SuiTxBlock as SuiKitTxBlock,
  SuiTxArg,
} from '@scallop-io/sui-kit';
import type { ScallopBuilder } from '../../models';
import type { SupportCollateralCoins, SupportPoolCoins } from '../constant';
import type { TransactionResult } from './index';

export type CoreIds = {
  protocolPkg: string;
  market: string;
  version: string;
  coinDecimalsRegistry: string;
  xOracle: string;
};

export type CoreNormalMethods = {
  openObligation: () => TransactionResult;
  returnObligation: (
    obligation: SuiTxArg,
    obligationHotPotato: SuiTxArg
  ) => void;
  openObligationEntry: () => void;
  addCollateral: (
    obligation: SuiTxArg,
    coin: SuiTxArg,
    coinName: SupportCollateralCoins
  ) => void;
  takeCollateral: (
    obligation: SuiTxArg,
    obligationKey: SuiTxArg,
    amount: number,
    coinName: SupportCollateralCoins
  ) => TransactionResult;
  deposit: (coin: SuiTxArg, coinName: SupportPoolCoins) => TransactionResult;
  depositEntry: (coin: SuiTxArg, coinName: SupportPoolCoins) => void;
  withdraw: (
    marketCoin: SuiTxArg,
    coinName: SupportPoolCoins
  ) => TransactionResult;
  withdrawEntry: (marketCoin: SuiTxArg, coinName: SupportPoolCoins) => void;
  borrow: (
    obligation: SuiTxArg,
    obligationKey: SuiTxArg,
    amount: number,
    coinName: SupportPoolCoins
  ) => TransactionResult;
  borrowEntry: (
    obligation: SuiTxArg,
    obligationKey: SuiTxArg,
    amount: number,
    coinName: SupportPoolCoins
  ) => void;
  repay: (
    obligation: SuiTxArg,
    coin: SuiTxArg,
    coinName: SupportPoolCoins
  ) => void;
  borrowFlashLoan: (
    amount: number,
    coinName: SupportPoolCoins
  ) => TransactionResult;
  repayFlashLoan: (
    coin: SuiTxArg,
    loan: SuiTxArg,
    coinName: SupportPoolCoins
  ) => void;
};

export type CoreQuickMethods = {
  addCollateralQuick: (
    amount: number,
    coinName: SupportCollateralCoins,
    obligationId?: SuiTxArg
  ) => Promise<void>;
  takeCollateralQuick: (
    amount: number,
    coinName: SupportCollateralCoins,
    obligationId?: string,
    obligationKey?: string
  ) => Promise<TransactionResult>;
  borrowQuick: (
    amount: number,
    coinName: SupportPoolCoins,
    obligationId?: string,
    obligationKey?: string
  ) => Promise<TransactionResult>;
  depositQuick: (
    amount: number,
    coinName: SupportPoolCoins
  ) => Promise<TransactionResult>;
  withdrawQuick: (
    amount: number,
    coinName: SupportPoolCoins
  ) => Promise<TransactionResult>;
  repayQuick: (
    amount: number,
    coinName: SupportPoolCoins,
    obligationId?: string
  ) => Promise<void>;
  updateAssetPricesQuick: (coinNames: SupportPoolCoins[]) => Promise<void>;
};

export type SuiTxBlockWithCoreNormalMethods = SuiKitTxBlock & CoreNormalMethods;

export type CoreTxBlock = SuiTxBlockWithCoreNormalMethods & CoreQuickMethods;

export type GenerateCoreNormalMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiKitTxBlock;
}) => CoreNormalMethods;

export type GenerateCoreQuickMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiTxBlockWithCoreNormalMethods;
}) => CoreQuickMethods;
