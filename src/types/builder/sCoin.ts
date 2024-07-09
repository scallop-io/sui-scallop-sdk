import {
  SuiObjectArg,
  SuiTxBlock as SuiKitTxBlock,
  TransactionResult,
} from '@scallop-io/sui-kit';
import { SupportSCoin } from '../constant';
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
    marketCoinName: SupportSCoin,
    marketCoin: SuiObjectArg
  ) => TransactionResult;
  /**
   * Burn sCoin and return marketCoin
   * @param sCoinName
   * @param sCoin
   * @returns
   */
  burnSCoin: (
    sCoinName: SupportSCoin,
    sCoin: SuiObjectArg
  ) => TransactionResult; // returns marketCoin
};

export type sCoinQuickMethods = {
  mintSCoinQuick: (
    marketCoinName: SupportSCoin,
    amount: number
  ) => Promise<TransactionResult>;
  burnSCoinQuick: (
    sCoinName: SupportSCoin,
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
