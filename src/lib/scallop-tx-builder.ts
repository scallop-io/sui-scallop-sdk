import { SuiTxBlock, SUI_CLOCK_OBJECT_ID, SuiTxArg } from '@scallop-dao/sui-kit';

export type TxBuilderParams = {
  packageId: string;
  marketId: string;
  coinDecimalsRegistryId: string;
  adminCapId?: string;
}
export class ScallopTxBuilder {
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
    this.adminCapId = params.adminCapId;
  }

  // return the transactionBlock compitable with @mysten/sui.js
  transactionBlock() {
    return this.suiTxBlock.txBlock;
  }

  transferObjects(objects: SuiTxArg[], recipient: string) {
    this.suiTxBlock.transferObjects(objects, recipient);
    return this.suiTxBlock;
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

  registerCoinDecimals(coinMetaId: string) {
    const target = `${this.packageId}::coin_decimals_registry::register_decimals`;
    this.suiTxBlock.moveCall(target, [this.coinDecimalsRegistryId, coinMetaId]);
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

  addCollateral(obligationId: SuiTxArg, coinId: SuiTxArg, coinType: string) {
    const target = `${this.packageId}::deposit_collateral::deposit_collateral`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(target, [obligationId, this.marketId, coinId], typeArgs);
    return this.suiTxBlock;
  }
  takeCollateral(obligationId: SuiTxArg, obligationKeyId: SuiTxArg, withdarwAmount: number, collateralType: string) {
    const target = `${this.packageId}::withdraw_collateral::withdraw_collateral`;
    return this.suiTxBlock.moveCall(
      target,
      [obligationId, obligationKeyId, this.marketId, this.coinDecimalsRegistryId, withdarwAmount, SUI_CLOCK_OBJECT_ID],
      [collateralType]
    );
  }

  takeCollateralEntry(obligationId: SuiTxArg, obligationKeyId: SuiTxArg, withdarwAmount: number, collateralType: string) {
    const target = `${this.packageId}::withdraw_collateral::withdraw_collateral_entry`;
    return this.suiTxBlock.moveCall(
      target,
      [obligationId, obligationKeyId, this.marketId, this.coinDecimalsRegistryId, withdarwAmount, SUI_CLOCK_OBJECT_ID],
      [collateralType]
    );
  }

  borrow(obligationId: SuiTxArg, obligationKeyId: SuiTxArg, borrowAmount: number, debtType: string) {
    const target = `${this.packageId}::borrow::borrow`;
    return this.suiTxBlock.moveCall(
      target,
      [obligationId, obligationKeyId, this.marketId, this.coinDecimalsRegistryId, borrowAmount, SUI_CLOCK_OBJECT_ID],
      [debtType]
    );
  }

  borrowEntry(obligationId: SuiTxArg, obligationKeyId: SuiTxArg, borrowAmount: number, debtType: string) {
    const target = `${this.packageId}::borrow::borrow_entry`;
    this.suiTxBlock.moveCall(
      target,
      [obligationId, obligationKeyId, this.marketId, this.coinDecimalsRegistryId, borrowAmount, SUI_CLOCK_OBJECT_ID],
      [debtType]
    );
    return this.suiTxBlock;
  }

  repay(obligationId: SuiTxArg, repayCoin: SuiTxArg, debtType: string) {
    const target = `${this.packageId}::repay::repay`;
    const typeArgs = [debtType];
    this.suiTxBlock.moveCall(target, [obligationId, this.marketId, repayCoin, SUI_CLOCK_OBJECT_ID], typeArgs);
    return this.suiTxBlock;
  }

  deposit(coinId: SuiTxArg, coinType: string) {
    const target = `${this.packageId}::mint::mint`;
    const typeArgs = [coinType];
    return this.suiTxBlock.moveCall(target, [this.marketId, coinId, SUI_CLOCK_OBJECT_ID], typeArgs);
  }

  depositEntry(coinId: SuiTxArg, coinType: string) {
    const target = `${this.packageId}::mint::mint_entry`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(target, [this.marketId, coinId, SUI_CLOCK_OBJECT_ID], typeArgs);
    return this.suiTxBlock;
  }

  withdraw(marketCoinId: SuiTxArg, coinType: string) {
    const target = `${this.packageId}::redeem::redeem`;
    const typeArgs = [coinType];
    return this.suiTxBlock.moveCall(target, [this.marketId, marketCoinId, SUI_CLOCK_OBJECT_ID], typeArgs);
  }

  withdrawEntry(marketCoinId: SuiTxArg) {
    const target = `${this.packageId}::redeem::redeem_entry`;
    this.suiTxBlock.moveCall(target, [this.marketId, marketCoinId, SUI_CLOCK_OBJECT_ID]);
    return this.suiTxBlock;
  }

  // TODO: remove this after test is done
  mintTestCoin(treasuryId: SuiTxArg, coinName: 'btc' | 'eth' | 'usdc') {
    const target = `${this.packageId}::${coinName}::mint`;
    return this.suiTxBlock.moveCall(target, [treasuryId]);
  }

  // TODO: remove this after test is done
  initMarketForTest(usdcTreasuryId: SuiTxArg) {
    // Require adminCap for this action
    if (!this.adminCapId) throw new Error('adminCapId is required for initMarketForTest');
    const target = `${this.packageId}::app_test::init_market`;
    this.suiTxBlock.moveCall(target, [this.marketId, this.adminCapId, usdcTreasuryId, SUI_CLOCK_OBJECT_ID]);
    return this.suiTxBlock;
  }
}
