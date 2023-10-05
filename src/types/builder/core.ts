import type {
  SuiTxBlock as SuiKitTxBlock,
  SuiTxArg,
} from '@scallop-io/sui-kit';
import type { ScallopBuilder } from '../../models';
import type {
  SupportCollateralCoins,
  SupportPoolCoins,
  SupportAssetCoins,
} from '../constant';
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
    collateralCoinName: SupportCollateralCoins
  ) => void;
  takeCollateral: (
    obligation: SuiTxArg,
    obligationKey: SuiTxArg,
    amount: number,
    collateralCoinName: SupportCollateralCoins
  ) => TransactionResult;
  deposit: (
    coin: SuiTxArg,
    poolCoinName: SupportPoolCoins
  ) => TransactionResult;
  depositEntry: (coin: SuiTxArg, poolCoinName: SupportPoolCoins) => void;
  withdraw: (
    marketCoin: SuiTxArg,
    poolCoinName: SupportPoolCoins
  ) => TransactionResult;
  withdrawEntry: (marketCoin: SuiTxArg, poolCoinName: SupportPoolCoins) => void;
  borrow: (
    obligation: SuiTxArg,
    obligationKey: SuiTxArg,
    amount: number,
    poolCoinName: SupportPoolCoins
  ) => TransactionResult;
  borrowEntry: (
    obligation: SuiTxArg,
    obligationKey: SuiTxArg,
    amount: number,
    poolCoinName: SupportPoolCoins
  ) => void;
  repay: (
    obligation: SuiTxArg,
    coin: SuiTxArg,
    poolCoinName: SupportPoolCoins
  ) => void;
  borrowFlashLoan: (
    amount: number,
    poolCoinName: SupportPoolCoins
  ) => TransactionResult;
  repayFlashLoan: (
    coin: SuiTxArg,
    loan: SuiTxArg,
    poolCoinName: SupportPoolCoins
  ) => void;
};

export type CoreQuickMethods = {
  addCollateralQuick: (
    amount: number,
    collateralCoinName: SupportCollateralCoins,
    obligationId?: SuiTxArg
  ) => Promise<void>;
  takeCollateralQuick: (
    amount: number,
    collateralCoinName: SupportCollateralCoins,
    obligationId?: string,
    obligationKey?: string
  ) => Promise<TransactionResult>;
  borrowQuick: (
    amount: number,
    poolCoinName: SupportPoolCoins,
    obligationId?: string,
    obligationKey?: string
  ) => Promise<TransactionResult>;
  depositQuick: (
    amount: number,
    poolCoinName: SupportPoolCoins
  ) => Promise<TransactionResult>;
  withdrawQuick: (
    amount: number,
    poolCoinName: SupportPoolCoins
  ) => Promise<TransactionResult>;
  repayQuick: (
    amount: number,
    poolCoinName: SupportPoolCoins,
    obligationId?: string
  ) => Promise<void>;
  updateAssetPricesQuick: (
    assetCoinNames?: SupportAssetCoins[]
  ) => Promise<void>;
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
