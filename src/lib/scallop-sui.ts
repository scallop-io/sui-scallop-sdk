import { SuiKit, SuiKitParams, SuiTxBlock } from '@scallop-dao/sui-kit'
import { ScallopTxBuilder, TxBuilderParams } from './scallop-tx-builder'
// This is a bug related to pnpm and typescript. See https://github.com/microsoft/TypeScript/issues/47663
import type { } from '@mysten/sui.js'

export type ScallopSuiParams = TxBuilderParams & { suiConfig?: SuiKitParams };

export class ScallopSui {
  public suiKit: SuiKit;
  public txBuilderParams: TxBuilderParams;
  constructor(params: ScallopSuiParams) {
    const { suiConfig, ...txBuilderParams} = params;
    this.suiKit = new SuiKit(suiConfig);
    this.txBuilderParams = txBuilderParams;
  }

  createTxBuilder() {
    return new ScallopTxBuilder(this.txBuilderParams);
  }

  async inpsectTxnEvent(queryTxn: SuiTxBlock) {
    const res = await this.suiKit.inspectTxn(queryTxn);
    const queryData = res.events[0].parsedJson;
    return queryData;
  }

  async submitTxn(txBuilder: ScallopTxBuilder) {
    return this.suiKit.signAndSendTxn(txBuilder.suiTxBlock)
  }

  async queryMarket() {
    const txBuilder = new ScallopTxBuilder(this.txBuilderParams);
    const queryTxn = txBuilder.queryMarket();
    return this.inpsectTxnEvent(queryTxn);
  }

  async queryObligation(obligationId: string) {
    const txBuilder = new ScallopTxBuilder(this.txBuilderParams);
    const queryTxn = txBuilder.queryObligation(obligationId);
    return this.inpsectTxnEvent(queryTxn);
  }

  async openObligation() {
    const txBuilder = new ScallopTxBuilder(this.txBuilderParams);
    const txn = txBuilder.openObligationEntry();
    return this.submitTxn(txBuilder);
  }

  async regiterCoinDecimals(coinMetaId: string) {
    const txBuilder = new ScallopTxBuilder(this.txBuilderParams);
    const txn = txBuilder.registerCoinDecimals(coinMetaId);
    return this.submitTxn(txBuilder);
  }

  // TODO: remove this after test is done
  async mintTestCoin(treasuryId: string, coinName: 'eth' | 'btc' | 'usdc') {
    const txBuilder = new ScallopTxBuilder(this.txBuilderParams);
    const coin = txBuilder.mintTestCoin(treasuryId, coinName);
    const currentAddress = this.suiKit.currentAddress();
    txBuilder.transferObjects([coin], currentAddress);
    return this.submitTxn(txBuilder);
  }
}
