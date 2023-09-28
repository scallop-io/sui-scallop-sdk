import type { TransactionArgument } from '@mysten/sui.js/transactions';
import type {
  SuiTxBlock as SuiKitTxBlock,
  SuiTxArg,
} from '@scallop-io/sui-kit';
import type { ScallopBuilder } from '../../models';
import type { SupportCollateralCoins, SupportAssetCoins } from '../data';

type TransactionResult = TransactionArgument & TransactionArgument[];

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
  deposit: (coin: SuiTxArg, coinName: SupportAssetCoins) => TransactionResult;
  depositEntry: (coin: SuiTxArg, coinName: SupportAssetCoins) => void;
  withdraw: (
    marketCoin: SuiTxArg,
    coinName: SupportAssetCoins
  ) => TransactionResult;
  withdrawEntry: (marketCoin: SuiTxArg, coinName: SupportAssetCoins) => void;
  borrow: (
    obligation: SuiTxArg,
    obligationKey: SuiTxArg,
    amount: number,
    coinName: SupportAssetCoins
  ) => TransactionResult;
  borrowEntry: (
    obligation: SuiTxArg,
    obligationKey: SuiTxArg,
    amount: number,
    coinName: SupportAssetCoins
  ) => void;
  repay: (
    obligation: SuiTxArg,
    coin: SuiTxArg,
    coinName: SupportAssetCoins
  ) => void;
  borrowFlashLoan: (
    amount: number,
    coinName: SupportAssetCoins
  ) => TransactionResult;
  repayFlashLoan: (
    coin: SuiTxArg,
    loan: SuiTxArg,
    coinName: SupportAssetCoins
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
    coinName: SupportAssetCoins,
    obligationId?: string,
    obligationKey?: string
  ) => Promise<TransactionResult>;
  depositQuick: (
    amount: number,
    coinName: SupportAssetCoins
  ) => Promise<TransactionResult>;
  withdrawQuick: (
    amount: number,
    coinName: SupportAssetCoins
  ) => Promise<TransactionResult>;
  repayQuick: (
    amount: number,
    coinName: SupportAssetCoins,
    obligationId?: string
  ) => Promise<void>;
  updateAssetPricesQuick: (coinNames: SupportAssetCoins[]) => Promise<void>;
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