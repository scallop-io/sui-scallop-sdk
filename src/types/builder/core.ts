import type { TransactionArgument } from '@mysten/sui.js/transactions';
import type {
  SuiTxBlock as SuiKitTxBlock,
  SuiTxArg,
} from '@scallop-io/sui-kit';
import type { ScallopBuilder } from '../../models';
import type { SupportCollaterals, SupportPools } from '../constant';

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
    coinName: SupportCollaterals
  ) => void;
  takeCollateral: (
    obligation: SuiTxArg,
    obligationKey: SuiTxArg,
    amount: number,
    coinName: SupportCollaterals
  ) => TransactionResult;
  deposit: (coin: SuiTxArg, coinName: SupportPools) => TransactionResult;
  depositEntry: (coin: SuiTxArg, coinName: SupportPools) => void;
  withdraw: (marketCoin: SuiTxArg, coinName: SupportPools) => TransactionResult;
  withdrawEntry: (marketCoin: SuiTxArg, coinName: SupportPools) => void;
  borrow: (
    obligation: SuiTxArg,
    obligationKey: SuiTxArg,
    amount: number,
    coinName: SupportPools
  ) => TransactionResult;
  borrowEntry: (
    obligation: SuiTxArg,
    obligationKey: SuiTxArg,
    amount: number,
    coinName: SupportPools
  ) => void;
  repay: (obligation: SuiTxArg, coin: SuiTxArg, coinName: SupportPools) => void;
  borrowFlashLoan: (
    amount: number,
    coinName: SupportPools
  ) => TransactionResult;
  repayFlashLoan: (
    coin: SuiTxArg,
    loan: SuiTxArg,
    coinName: SupportPools
  ) => void;
};

export type CoreQuickMethods = {
  addCollateralQuick: (
    amount: number,
    coinName: SupportCollaterals,
    obligationId?: SuiTxArg
  ) => Promise<void>;
  takeCollateralQuick: (
    amount: number,
    coinName: SupportCollaterals,
    obligationId?: string,
    obligationKey?: string
  ) => Promise<TransactionResult>;
  borrowQuick: (
    amount: number,
    coinName: SupportPools,
    obligationId?: string,
    obligationKey?: string
  ) => Promise<TransactionResult>;
  depositQuick: (
    amount: number,
    coinName: SupportPools
  ) => Promise<TransactionResult>;
  withdrawQuick: (
    amount: number,
    coinName: SupportPools
  ) => Promise<TransactionResult>;
  repayQuick: (
    amount: number,
    coinName: SupportPools,
    obligationId?: string
  ) => Promise<void>;
  updateAssetPricesQuick: (coinNames: SupportPools[]) => Promise<void>;
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
