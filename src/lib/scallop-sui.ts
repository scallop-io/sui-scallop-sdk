import { SuiKit, SuiKitParams, SuiTxBlock } from '@scallop-dao/sui-kit'
import { TxBuilder, TxBuilderParams } from './tx-builder'

export type ScallopSuiParams = TxBuilderParams & { suiConfig?: SuiKitParams };

export class ScallopSui {
  public suiKit: SuiKit;
  public txBuilderParams: TxBuilderParams;
  constructor(params: ScallopSuiParams) {
    const { suiConfig, ...txBuilderParams} = params;
    this.suiKit = new SuiKit(suiConfig);
    this.txBuilderParams = txBuilderParams;
  }

  async inpsectTxnEvent(queryTxn: SuiTxBlock) {
    const res = await this.suiKit.inspectTxn(queryTxn);
    const queryData = res.events[0].parsedJson;
    return queryData;
  }

  async queryMarket() {
    const txBuilder = new TxBuilder(this.txBuilderParams);
    const queryTxn = txBuilder.queryMarket();
    return this.inpsectTxnEvent(queryTxn);
  }

  async queryObligation(obligationId: string) {
    const txBuilder = new TxBuilder(this.txBuilderParams);
    const queryTxn = txBuilder.queryObligation(obligationId);
    return this.inpsectTxnEvent(queryTxn);
  }

  async openObligation() {
    const txBuilder = new TxBuilder(this.txBuilderParams);
    const txn = txBuilder.openObligationEntry();
    return this.suiKit.signAndSendTxn(txn);
  }
}
