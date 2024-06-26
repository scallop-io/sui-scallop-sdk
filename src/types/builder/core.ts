import type {
  SuiTxBlock as SuiKitTxBlock,
  SuiAddressArg,
  SuiObjectArg,
  SuiTxArg,
} from '@scallop-io/sui-kit';
import type {
  TransactionArgument,
  TransactionResult,
} from '@mysten/sui.js/transactions';
import type { ScallopBuilder } from '../../models';
import type {
  SupportCollateralCoins,
  SupportPoolCoins,
  SupportAssetCoins,
} from '../constant';
import { ScallopTxBlockWithoutCoreTxBlock } from '.';

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
    obligation: SuiAddressArg,
    obligationHotPotato: SuiObjectArg
  ) => void;
  openObligationEntry: () => void;
  addCollateral: (
    obligation: SuiAddressArg,
    coin: SuiObjectArg,
    collateralCoinName: SupportCollateralCoins
  ) => void;
  takeCollateral: (
    obligation: SuiAddressArg,
    obligationKey: SuiAddressArg,
    amount: SuiTxArg,
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
    obligation: SuiAddressArg,
    obligationKey: SuiAddressArg,
    amount: SuiTxArg,
    poolCoinName: SupportPoolCoins
  ) => TransactionResult;
  borrowWithReferral: (
    obligation: SuiAddressArg,
    obligationKey: SuiAddressArg,
    borrowReferral: SuiObjectArg,
    amount: SuiTxArg,
    poolCoinName: SupportPoolCoins
  ) => TransactionResult;
  borrowEntry: (
    obligation: SuiAddressArg,
    obligationKey: SuiAddressArg,
    amount: SuiTxArg,
    poolCoinName: SupportPoolCoins
  ) => void;
  repay: (
    obligation: SuiAddressArg,
    coin: SuiObjectArg,
    poolCoinName: SupportPoolCoins
  ) => void;
  borrowFlashLoan: (
    amount: SuiTxArg,
    poolCoinName: SupportPoolCoins
  ) => TransactionResult;
  repayFlashLoan: (
    coin: SuiObjectArg,
    loan: SuiAddressArg,
    poolCoinName: SupportPoolCoins
  ) => void;
};

export type CoreQuickMethods = {
  addCollateralQuick: (
    amount: number,
    collateralCoinName: SupportCollateralCoins,
    obligationId?: SuiAddressArg
  ) => Promise<void>;
  takeCollateralQuick: (
    amount: number,
    collateralCoinName: SupportCollateralCoins,
    obligationId?: SuiAddressArg,
    obligationKey?: SuiAddressArg
  ) => Promise<TransactionResult>;
  borrowQuick: (
    amount: number,
    poolCoinName: SupportPoolCoins,
    obligationId?: SuiAddressArg,
    obligationKey?: SuiAddressArg
  ) => Promise<TransactionResult>;
  borrowWithReferralQuick: (
    amount: number,
    poolCoinName: SupportPoolCoins,
    borrowReferral: SuiObjectArg,
    obligationId?: SuiAddressArg,
    obligationKey?: SuiAddressArg
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
    obligationId?: SuiAddressArg
  ) => Promise<void>;
  updateAssetPricesQuick: (
    assetCoinNames?: SupportAssetCoins[]
  ) => Promise<void>;
};

export type SuiTxBlockWithCoreNormalMethods = SuiKitTxBlock &
  ScallopTxBlockWithoutCoreTxBlock &
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
