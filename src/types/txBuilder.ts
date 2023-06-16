import { TransactionArgument } from '@mysten/sui.js';
import { SuiTxBlock, SuiTxArg, SuiKit } from '@scallop-io/sui-kit';
import { ScallopAddress, ScallopUtils } from '../models';
import { SupportCollateralCoins, SupportAssetCoins } from './data';

type TransactionResult = TransactionArgument & TransactionArgument[];

/**
 * ========== Scallop Normal Methods ==========
 */
export type ScallopNormalMethods = {
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

export type CoreIds = {
  protocolPkg: string;
  market: string;
  version: string;
  dmlR: string; // coinDecimalsRegistry
  oracle: string;
};

export type ScallopNormalMethodsHandler = {
  [key in keyof ScallopNormalMethods]: (params: {
    txBlock: SuiTxBlock;
    coreIds: CoreIds;
    scallopAddress: ScallopAddress;
    scallopUtils: ScallopUtils;
  }) => ScallopNormalMethods[key];
};

export type SuiTxBlockWithNormalScallopMethods = SuiTxBlock &
  ScallopNormalMethods;

/**
 * ========== Scallop Quick Methods ==========
 */

export type ScallopQuickMethods = {
  addCollateralQuick: (
    amount: number,
    coinName: SupportCollateralCoins,
    obligationId?: string
  ) => Promise<void>;
  takeCollateralQuick: (
    amount: number,
    coinName: SupportCollateralCoins,
    obligationId?: string,
    obligationKey?: SuiTxArg
  ) => Promise<TransactionResult>;
  borrowQuick: (
    amount: number,
    coinName: SupportAssetCoins,
    obligationId?: string,
    obligationKey?: SuiTxArg
  ) => Promise<TransactionResult>;
  depositQuick: (amount: number, coinName: SupportAssetCoins) => Promise<void>;
  withdrawQuick: (
    amount: number,
    coinName: SupportAssetCoins
  ) => Promise<TransactionResult>;
  repayQuick: (
    amount: number,
    coinName: SupportAssetCoins,
    obligationId?: string
  ) => Promise<void>;
};

export type ScallopQuickMethodsHandler = {
  [key in keyof ScallopQuickMethods]: (params: {
    txBlock: SuiTxBlockWithNormalScallopMethods;
    suiKit: SuiKit;
    scallopAddress: ScallopAddress;
    scallopUtils: ScallopUtils;
    isTestnet: boolean;
  }) => ScallopQuickMethods[key];
};

/**
 * ========== Scallop Tx Block ==========
 */
export type ScallopTxBlock = SuiTxBlockWithNormalScallopMethods &
  ScallopQuickMethods;
