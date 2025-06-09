import type {
  SuiTxBlock as SuiKitTxBlock,
  SuiObjectArg,
  SuiTxArg,
} from '@scallop-io/sui-kit';
import type { Argument, TransactionResult } from '@mysten/sui/transactions';
import { SuiTxBlockWithSpool } from '.';
import { ScallopBuilder } from 'src/models';

export type CoreIds = {
  protocolPkg: string;
  market: string;
  version: string;
  coinDecimalsRegistry: string;
  xOracle: string;
};

export type NestedResult = Extract<Argument, { $kind: 'NestedResult' }>;
type Obligation = NestedResult;
type ObligationKey = NestedResult;
type ObligationHotPotato = NestedResult;

export type CoreNormalMethods = {
  openObligation: () => [Obligation, ObligationKey, ObligationHotPotato];
  returnObligation: (
    obligation: SuiObjectArg,
    obligationHotPotato: SuiObjectArg
  ) => void;
  openObligationEntry: () => void;
  addCollateral: (
    obligation: SuiObjectArg,
    coin: SuiObjectArg,
    collateralCoinName: string
  ) => void;
  takeCollateral: (
    obligation: SuiObjectArg,
    obligationKey: SuiObjectArg,
    amount: number,
    collateralCoinName: string
  ) => TransactionResult;
  deposit: (coin: SuiObjectArg, poolCoinName: string) => TransactionResult;
  depositEntry: (coin: SuiObjectArg, poolCoinName: string) => TransactionResult;
  withdraw: (
    marketCoin: SuiObjectArg,
    poolCoinName: string
  ) => TransactionResult;
  withdrawEntry: (
    marketCoin: SuiObjectArg,
    poolCoinName: string
  ) => TransactionResult;
  borrow: (
    obligation: SuiObjectArg,
    obligationKey: SuiObjectArg,
    amount: number,
    poolCoinName: string
  ) => TransactionResult;
  borrowWithReferral: (
    obligation: SuiObjectArg,
    obligationKey: SuiObjectArg,
    borrowReferral: SuiObjectArg,
    amount: number | SuiTxArg,
    poolCoinName: string
  ) => TransactionResult;
  borrowEntry: (
    obligation: SuiObjectArg,
    obligationKey: SuiObjectArg,
    amount: number,
    poolCoinName: string
  ) => TransactionResult;
  repay: (
    obligation: SuiObjectArg,
    coin: SuiObjectArg,
    poolCoinName: string
  ) => void;
  borrowFlashLoan: (
    amount: number | SuiTxArg,
    poolCoinName: string
  ) => TransactionResult;
  repayFlashLoan: (
    coin: SuiObjectArg,
    loan: SuiObjectArg,
    poolCoinName: string
  ) => void;
};

export type CoreQuickMethods = {
  addCollateralQuick: (
    amount: number,
    collateralCoinName: string,
    obligationId?: SuiObjectArg
  ) => Promise<void>;
  takeCollateralQuick: (
    amount: number,
    collateralCoinName: string,
    obligationId?: SuiObjectArg,
    obligationKey?: SuiObjectArg
  ) => Promise<TransactionResult>;
  borrowQuick: (
    amount: number,
    poolCoinName: string,
    obligationId?: SuiObjectArg,
    obligationKey?: SuiObjectArg,
    isSponsoredTx?: boolean
  ) => Promise<TransactionResult>;
  borrowWithReferralQuick: (
    amount: number,
    poolCoinName: string,
    borrowReferral: SuiObjectArg,
    obligationId?: SuiObjectArg,
    obligationKey?: SuiObjectArg,
    isSponsoredTx?: boolean
  ) => Promise<TransactionResult>;
  depositQuick: (
    amount: number,
    poolCoinName: string,
    returnSCoin?: boolean
  ) => Promise<TransactionResult>;
  withdrawQuick: (
    amount: number,
    poolCoinName: string
  ) => Promise<TransactionResult>;
  repayQuick: (
    amount: number,
    poolCoinName: string,
    obligationId?: SuiObjectArg
  ) => Promise<void>;
  updateAssetPricesQuick: (assetCoinNames?: string[]) => Promise<void>;
};

export type SuiTxBlockWithCoreNormalMethods = SuiKitTxBlock &
  SuiTxBlockWithSpool &
  CoreNormalMethods;

export type CoreTxBlock = SuiTxBlockWithCoreNormalMethods & CoreQuickMethods;

export type GenerateCoreNormalMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiKitTxBlock;
}) => CoreNormalMethods;

export type GenerateCoreQuickMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiTxBlockWithCoreNormalMethods;
}) => CoreQuickMethods;
