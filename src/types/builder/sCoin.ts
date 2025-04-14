import {
  SuiObjectArg,
  SuiTxBlock as SuiKitTxBlock,
  TransactionResult,
} from '@scallop-io/sui-kit';
import { ScallopBuilder } from 'src/models';
import { BaseScallopTxBlock } from '.';

export type sCoinPkgIds = {
  pkgId: string;
};

export type sCoinNormalMethods = {
  /**
   * Lock marketCoin and return sCoin
   * @param marketCoinName
   * @param marketCoin
   * @returns
   */
  mintSCoin: (
    marketCoinName: string,
    marketCoin: SuiObjectArg
  ) => TransactionResult;
  /**
   * Burn sCoin and return marketCoin
   * @param sCoinName
   * @param sCoin
   * @returns
   */
  burnSCoin: (sCoinName: string, sCoin: SuiObjectArg) => TransactionResult; // returns marketCoin
};

export type sCoinQuickMethods = {
  mintSCoinQuick: (
    marketCoinName: string,
    amount: number
  ) => Promise<TransactionResult>;
  burnSCoinQuick: (
    sCoinName: string,
    amount: number
  ) => Promise<TransactionResult>;
};

export type SuiTxBlockWithSCoinNormalMethods = SuiKitTxBlock &
  BaseScallopTxBlock &
  sCoinNormalMethods;
export type SCoinTxBlock = SuiTxBlockWithSCoinNormalMethods & sCoinQuickMethods;

export type GenerateSCoinNormalMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiKitTxBlock;
}) => sCoinNormalMethods;

export type GenerateSCoinQuickMethod = (params: {
  builder: ScallopBuilder;
  txBlock: SuiTxBlockWithSCoinNormalMethods;
}) => sCoinQuickMethods;
