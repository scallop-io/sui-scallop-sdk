import { SuiTxBlock } from '@scallop-dao/sui-kit';

export type TxBuilderParams = {
  packageId: string;
  marketId: string;
  coinDecimalsRegistryId: string;
  adminCapId?: string;
}
export class TxBuilder {
  public suiTxBlock: SuiTxBlock;
  public packageId: string;
  public marketId: string;
  public coinDecimalsRegistryId: string;
  public adminCapId?: string;

  constructor(params: TxBuilderParams) {
    this.suiTxBlock = new SuiTxBlock();
    this.packageId = params.packageId;
    this.marketId = params.marketId;
    this.coinDecimalsRegistryId = params.coinDecimalsRegistryId;
    this.adminCapId = this.adminCapId;
  }

  // return the transactionBlock compitable with @mysten/sui.js
  transactionBlock() {
    return this.suiTxBlock.txBlock;
  }

  queryMarket() {
    const queryTarget = `${this.packageId}::market_query::market_data`;
    this.suiTxBlock.moveCall(queryTarget, [this.marketId]);
    return this.suiTxBlock;
  }

  queryObligation(obligationId: string) {
    const queryTarget = `${this.packageId}::obligation_query::obligation_data`;
    this.suiTxBlock.moveCall(queryTarget, [obligationId]);
    return this.suiTxBlock;
  }

  openObligation() {
    const target = `${this.packageId}::open_obligation::open_obligation`;
    return this.suiTxBlock.moveCall(target, []);
  }

  openObligationEntry() {
    const target = `${this.packageId}::open_obligation::open_obligation_entry`;
    this.suiTxBlock.moveCall(target, []);
    return this.suiTxBlock;
  }

  // TODO: remove this after test is done
  initMarketForTest() {
    const target = `${this.packageId}::app_test::init_market`;
    this.suiTxBlock.moveCall(target, []);
    return this.suiTxBlock;
  }

  registerCoinDecimals() {
    const target = `${this.packageId}::coin_decimals_registry::register_decimals`;
    this.suiTxBlock.moveCall(target, []);
    return this.suiTxBlock;
  }
}
