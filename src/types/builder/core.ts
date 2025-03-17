import type {
  SuiTxBlock as SuiKitTxBlock,
  SuiObjectArg,
  SuiTxArg,
} from '@scallop-io/sui-kit';
import type { Argument, TransactionResult } from '@mysten/sui/transactions';
import type { ScallopBuilder } from '../../models';
import { SuiTxBlockWithSpool } from '.';

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
  // openObligation: () => Promise<
  openObligation: () => [Obligation, ObligationKey, ObligationHotPotato];
  returnObligation: (
    obligation: SuiObjectArg,
    obligationHotPotato: SuiObjectArg
    // ) => Promise<void>;
  ) => void;
  // openObligationEntry: () => Promise<void>;
  openObligationEntry: () => void;
  addCollateral: (
    obligation: SuiObjectArg,
    coin: SuiObjectArg,
    collateralCoinName: string
    // ) => Promise<void>;
  ) => void;
  takeCollateral: (
    obligation: SuiObjectArg,
    obligationKey: SuiObjectArg,
    amount: number,
    collateralCoinName: string
    // ) => Promise<TransactionResult>;
  ) => TransactionResult;
  deposit: (
    coin: SuiObjectArg,
    poolCoinName: string
    // ) => Promise<TransactionResult>;
  ) => TransactionResult;
  depositEntry: (
    coin: SuiObjectArg,
    poolCoinName: string
    // ) => Promise<TransactionResult>;
  ) => TransactionResult;
  withdraw: (
    marketCoin: SuiObjectArg,
    poolCoinName: string
    // ) => Promise<TransactionResult>;
  ) => TransactionResult;
  withdrawEntry: (
    marketCoin: SuiObjectArg,
    poolCoinName: string
    // ) => Promise<TransactionResult>;
  ) => TransactionResult;
  borrow: (
    obligation: SuiObjectArg,
    obligationKey: SuiObjectArg,
    amount: number,
    poolCoinName: string
    // ) => Promise<TransactionResult>;
  ) => TransactionResult;
  borrowWithReferral: (
    obligation: SuiObjectArg,
    obligationKey: SuiObjectArg,
    borrowReferral: SuiObjectArg,
    amount: number | SuiTxArg,
    poolCoinName: string
    // ) => Promise<TransactionResult>;
  ) => TransactionResult;
  borrowEntry: (
    obligation: SuiObjectArg,
    obligationKey: SuiObjectArg,
    amount: number,
    poolCoinName: string
    // ) => Promise<TransactionResult>;
  ) => TransactionResult;
  repay: (
    obligation: SuiObjectArg,
    coin: SuiObjectArg,
    poolCoinName: string
    // ) => Promise<void>;
  ) => void;
  borrowFlashLoan: (
    amount: number | SuiTxArg,
    poolCoinName: string
    // ) => Promise<TransactionResult>;
  ) => TransactionResult;
  repayFlashLoan: (
    coin: SuiObjectArg,
    loan: SuiObjectArg,
    poolCoinName: string
    // ) => Promise<void>;
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
    obligationKey?: SuiObjectArg
  ) => Promise<TransactionResult>;
  borrowWithReferralQuick: (
    amount: number,
    poolCoinName: string,
    borrowReferral: SuiObjectArg,
    obligationId?: SuiObjectArg,
    obligationKey?: SuiObjectArg
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
