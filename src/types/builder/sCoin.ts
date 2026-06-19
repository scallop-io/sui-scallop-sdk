import {
  SuiObjectArg,
  SuiTxBlock as SuiKitTxBlock,
  TransactionResult,
} from '@scallop-io/sui-kit';
import { ScallopBuilder } from 'src/models/index.js';
import { BaseScallopTxBlock } from './index.js';
import type { MoveCallContext } from 'src/txBuilders/context.js';

export type sCoinPkgIds = {
  pkgId: string;
};

/**
 * The explicit orchestration toolkit an sCoin quick method needs.
 *
 * @description
 * Narrow context injected into {@link generateSCoinQuickMethod}. Built once from
 * `builder` in the factory and passed (instead of `builder`) into the quick
 * generator. Method signatures are taken via indexed-access types so they stay
 * in sync with `ScallopBuilder`.
 */
export type SCoinActionContext = {
  utils: ScallopBuilder['utils'];
  coins: {
    selectMarketCoin: ScallopBuilder['selectMarketCoin'];
    selectSCoin: ScallopBuilder['selectSCoin'];
  };
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
  ctx: MoveCallContext;
  txBlock: SuiKitTxBlock;
}) => sCoinNormalMethods;

export type GenerateSCoinQuickMethod = (params: {
  ctx: SCoinActionContext;
  txBlock: SuiTxBlockWithSCoinNormalMethods;
}) => sCoinQuickMethods;
