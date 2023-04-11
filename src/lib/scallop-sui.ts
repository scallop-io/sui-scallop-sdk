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
    txBuilder.openObligationEntry();
    return this.submitTxn(txBuilder);
  }

  async getObligations(address: string) {
    const owner = address || this.suiKit.currentAddress();
    const keyObjectRefs = await this.suiKit.rpcProvider.provider.getOwnedObjects({
      owner,
      filter: {
        StructType: `${this.txBuilderParams.packageId}::obligation::ObligationKey`,
      }
    });
    const keyIds = keyObjectRefs.data.map((ref: any) => ref?.data?.objectId).filter((id: any) => id !== undefined) as string[];
    const keyObjects = await this.suiKit.getObjects(keyIds);
    const obligations: {id: string, keyId: string}[] = [];
    for(const keyObject of keyObjects) {
      const keyId = keyObject.objectId;
      const fields = keyObject.objectFields as any;
      const obligationId = fields['ownership']['fields']['of'];
      obligations.push({id: obligationId, keyId})
    }
    return obligations;
  }

  async addCollateral(obligationId: string, amount: number, coinType: string) {
    const txBuilder = new ScallopTxBuilder(this.txBuilderParams);
    const coins = await this.suiKit.selectCoinsWithAmount(amount, coinType);
    const [sendCoin, leftCoin] = txBuilder.suiTxBlock.takeAmountFromCoins(coins, amount);
    txBuilder.addCollateral(obligationId, sendCoin, coinType);
    txBuilder.transferObjects([leftCoin], this.suiKit.currentAddress());
    return this.submitTxn(txBuilder);
  }

  async takeCollateral(obligationId: string, obligationKeyId: string, amount: number, coinType: string) {
    const txBuilder = new ScallopTxBuilder(this.txBuilderParams);
    txBuilder.takeCollateralEntry(obligationId, obligationKeyId, amount, coinType);
    return this.submitTxn(txBuilder);
  }

  async borrow(obligationId: string, obligationKeyId: string, amount: number, coinType: string) {
    const txBuilder = new ScallopTxBuilder(this.txBuilderParams);
    txBuilder.borrowEntry(obligationId, obligationKeyId, amount, coinType);
    return this.submitTxn(txBuilder);
  }

  async repay(obligationId: string, amount: number, coinType: string) {
    const txBuilder = new ScallopTxBuilder(this.txBuilderParams);
    const coins = await this.suiKit.selectCoinsWithAmount(amount, coinType);
    const [sendCoin, leftCoin] = txBuilder.suiTxBlock.takeAmountFromCoins(coins, amount);
    txBuilder.repay(obligationId, sendCoin, coinType);
    txBuilder.transferObjects([leftCoin], this.suiKit.currentAddress());
    return this.submitTxn(txBuilder);
  }

  async deposit(amount: number, coinType: string) {
    const txBuilder = new ScallopTxBuilder(this.txBuilderParams);
    const coins = await this.suiKit.selectCoinsWithAmount(amount, coinType);
    const [sendCoin, leftCoin] = txBuilder.suiTxBlock.takeAmountFromCoins(coins, amount);
    txBuilder.deposit(sendCoin, coinType);
    txBuilder.transferObjects([leftCoin], this.suiKit.currentAddress());
    return this.submitTxn(txBuilder);
  }

  async withdraw(amount: number, coinType: string) {
    const txBuilder = new ScallopTxBuilder(this.txBuilderParams);
    const coins = await this.suiKit.selectCoinsWithAmount(amount, coinType);
    const [sendCoin, leftCoin] = txBuilder.suiTxBlock.takeAmountFromCoins(coins, amount);
    txBuilder.withdraw(sendCoin, coinType);
    return this.submitTxn(txBuilder);
  }

  async regiterCoinDecimals(coinMetaId: string) {
    const txBuilder = new ScallopTxBuilder(this.txBuilderParams);
    txBuilder.registerCoinDecimals(coinMetaId);
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
