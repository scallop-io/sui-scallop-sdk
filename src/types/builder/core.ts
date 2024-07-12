import type {
  SuiTxBlock as SuiKitTxBlock,
  SuiObjectArg,
} from '@scallop-io/sui-kit';
import type {
  TransactionArgument,
  TransactionResult,
} from '@mysten/sui/transactions';
import type { ScallopBuilder } from '../../models';
import type {
  SupportCollateralCoins,
  SupportPoolCoins,
  SupportAssetCoins,
} from '../constant';
import { SuiTxBlockWithSpool } from '.';

export type CoreIds = {
  protocolPkg: string;
  market: string;
  version: string;
  coinDecimalsRegistry: string;
  xOracle: string;
};

export type NestedResult = Extract<
  TransactionArgument,
  { kind: 'NestedResult' }
>;
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
    collateralCoinName: SupportCollateralCoins
  ) => void;
  takeCollateral: (
    obligation: SuiObjectArg,
    obligationKey: SuiObjectArg,
    amount: number,
    collateralCoinName: SupportCollateralCoins
  ) => TransactionResult;
  deposit: (
    coin: SuiObjectArg,
    poolCoinName: SupportPoolCoins
  ) => TransactionResult;
  depositEntry: (coin: SuiObjectArg, poolCoinName: SupportPoolCoins) => void;
  withdraw: (
    marketCoin: SuiObjectArg,
    poolCoinName: SupportPoolCoins
  ) => TransactionResult;
  withdrawEntry: (
    marketCoin: SuiObjectArg,
    poolCoinName: SupportPoolCoins
  ) => void;
  borrow: (
    obligation: SuiObjectArg,
    obligationKey: SuiObjectArg,
    amount: number,
    poolCoinName: SupportPoolCoins
  ) => TransactionResult;
  borrowWithReferral: (
    obligation: SuiObjectArg,
    obligationKey: SuiObjectArg,
    borrowReferral: SuiObjectArg,
    amount: number,
    poolCoinName: SupportPoolCoins
  ) => TransactionResult;
  borrowEntry: (
    obligation: SuiObjectArg,
    obligationKey: SuiObjectArg,
    amount: number,
    poolCoinName: SupportPoolCoins
  ) => void;
  repay: (
    obligation: SuiObjectArg,
    coin: SuiObjectArg,
    poolCoinName: SupportPoolCoins
  ) => void;
  borrowFlashLoan: (
    amount: number,
    poolCoinName: SupportPoolCoins
  ) => TransactionResult;
  repayFlashLoan: (
    coin: SuiObjectArg,
    loan: SuiObjectArg,
    poolCoinName: SupportPoolCoins
  ) => void;
};

export type CoreQuickMethods = {
  addCollateralQuick: (
    amount: number,
    collateralCoinName: SupportCollateralCoins,
    obligationId?: SuiObjectArg
  ) => Promise<void>;
  takeCollateralQuick: (
    amount: number,
    collateralCoinName: SupportCollateralCoins,
    obligationId?: SuiObjectArg,
    obligationKey?: SuiObjectArg
  ) => Promise<TransactionResult>;
  borrowQuick: (
    amount: number,
    poolCoinName: SupportPoolCoins,
    obligationId?: SuiObjectArg,
    obligationKey?: SuiObjectArg
  ) => Promise<TransactionResult>;
  borrowWithReferralQuick: (
    amount: number,
    poolCoinName: SupportPoolCoins,
    borrowReferral: SuiObjectArg,
    obligationId?: SuiObjectArg,
    obligationKey?: SuiObjectArg
  ) => Promise<TransactionResult>;
  depositQuick: (
    amount: number,
    poolCoinName: SupportPoolCoins,
    returnSCoin?: boolean
  ) => Promise<TransactionResult>;
  withdrawQuick: (
    amount: number,
    poolCoinName: SupportPoolCoins
  ) => Promise<TransactionResult>;
  repayQuick: (
    amount: number,
    poolCoinName: SupportPoolCoins,
    obligationId?: SuiObjectArg
  ) => Promise<void>;
  updateAssetPricesQuick: (
    assetCoinNames?: SupportAssetCoins[]
  ) => Promise<void>;
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
