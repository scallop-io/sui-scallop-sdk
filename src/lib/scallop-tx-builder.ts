import { SuiTxBlock, SUI_CLOCK_OBJECT_ID, SuiTxArg } from '@scallop-io/sui-kit';

export type TxBuilderParams = {
  packageId: string;
  marketId: string;
  coinDecimalsRegistryId: string;
  switchboardBundleId: string;
  switchboardRegistryId: string;
  switchboardAggregators: { [aggregatorId: string]: string };
  adminCapId?: string;
};
export class ScallopTxBuilder {
  public suiTxBlock: SuiTxBlock;
  public packageId: string;
  public marketId: string;
  public coinDecimalsRegistryId: string;
  public switchboardBundleId: string;
  public switchboardRegistryId: string;
  public switchboardAggregators: { [aggregatorId: string]: string };
  public switchboardRegistryCapId?: string;
  public adminCapId?: string;

  constructor(params: TxBuilderParams) {
    this.suiTxBlock = new SuiTxBlock();
    this.packageId = params.packageId;
    this.marketId = params.marketId;
    this.coinDecimalsRegistryId = params.coinDecimalsRegistryId;
    this.adminCapId = params.adminCapId;
    this.switchboardBundleId = params.switchboardBundleId;
    this.switchboardRegistryId = params.switchboardRegistryId;
    this.switchboardAggregators = params.switchboardAggregators;
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

  registerSwitchboardAggregator(aggregatorId: string) {
    if (!this.switchboardRegistryCapId) {
      throw new Error(
        'switchboardRegistryCapId is required to register aggregator'
      );
    }
    const target = `${this.packageId}::switchboard_registry::register_aggregator`;
    this.suiTxBlock.moveCall(target, [
      this.switchboardRegistryCapId,
      this.switchboardRegistryId,
      aggregatorId,
    ]);
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

  returnObligationHotPotato(
    obligation: SuiTxArg,
    obligationHotPotato: SuiTxArg
  ) {
    const target = `${this.packageId}::open_obligation::return_obligation`;
    this.suiTxBlock.moveCall(target, [obligation, obligationHotPotato]);
    return this.suiTxBlock;
  }

  addCollateral(obligationId: SuiTxArg, coinId: SuiTxArg, coinType: string) {
    const target = `${this.packageId}::deposit_collateral::deposit_collateral`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(
      target,
      [obligationId, this.marketId, coinId],
      typeArgs
    );
    return this.suiTxBlock;
  }
  takeCollateral(
    obligationId: SuiTxArg,
    obligationKeyId: SuiTxArg,
    withdrawAmount: number,
    collateralType: string
  ) {
    const target = `${this.packageId}::withdraw_collateral::withdraw_collateral`;
    return this.suiTxBlock.moveCall(
      target,
      [
        obligationId,
        obligationKeyId,
        this.marketId,
        this.coinDecimalsRegistryId,
        withdrawAmount,
        this.switchboardBundleId,
        SUI_CLOCK_OBJECT_ID,
      ],
      [collateralType]
    );
  }

  takeCollateralEntry(
    obligationId: SuiTxArg,
    obligationKeyId: SuiTxArg,
    withdrawAmount: number,
    collateralType: string
  ) {
    const target = `${this.packageId}::withdraw_collateral::withdraw_collateral_entry`;
    return this.suiTxBlock.moveCall(
      target,
      [
        obligationId,
        obligationKeyId,
        this.marketId,
        this.coinDecimalsRegistryId,
        withdrawAmount,
        this.switchboardBundleId,
        SUI_CLOCK_OBJECT_ID,
      ],
      [collateralType]
    );
  }

  borrow(
    obligationId: SuiTxArg,
    obligationKeyId: SuiTxArg,
    borrowAmount: number,
    debtType: string
  ) {
    this._bundleSwitchboardAggregators(this.switchboardAggregators);
    const target = `${this.packageId}::borrow::borrow`;
    return this.suiTxBlock.moveCall(
      target,
      [
        obligationId,
        obligationKeyId,
        this.marketId,
        this.coinDecimalsRegistryId,
        borrowAmount,
        this.switchboardBundleId,
        SUI_CLOCK_OBJECT_ID,
      ],
      [debtType]
    );
  }

  borrowEntry(
    obligationId: SuiTxArg,
    obligationKeyId: SuiTxArg,
    borrowAmount: number,
    debtType: string
  ) {
    this._bundleSwitchboardAggregators(this.switchboardAggregators);
    const target = `${this.packageId}::borrow::borrow_entry`;
    this.suiTxBlock.moveCall(
      target,
      [
        obligationId,
        obligationKeyId,
        this.marketId,
        this.coinDecimalsRegistryId,
        borrowAmount,
        this.switchboardBundleId,
        SUI_CLOCK_OBJECT_ID,
      ],
      [debtType]
    );
    return this.suiTxBlock;
  }

  repay(obligationId: SuiTxArg, repayCoin: SuiTxArg, debtType: string) {
    const target = `${this.packageId}::repay::repay`;
    const typeArgs = [debtType];
    this.suiTxBlock.moveCall(
      target,
      [obligationId, this.marketId, repayCoin, SUI_CLOCK_OBJECT_ID],
      typeArgs
    );
    return this.suiTxBlock;
  }

  deposit(coinId: SuiTxArg, coinType: string) {
    const target = `${this.packageId}::mint::mint`;
    const typeArgs = [coinType];
    return this.suiTxBlock.moveCall(
      target,
      [this.marketId, coinId, SUI_CLOCK_OBJECT_ID],
      typeArgs
    );
  }

  depositEntry(coinId: SuiTxArg, coinType: string) {
    const target = `${this.packageId}::mint::mint_entry`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(
      target,
      [this.marketId, coinId, SUI_CLOCK_OBJECT_ID],
      typeArgs
    );
    return this.suiTxBlock;
  }

  withdraw(marketCoinId: SuiTxArg, coinType: string) {
    this._bundleSwitchboardAggregators(this.switchboardAggregators);
    const target = `${this.packageId}::redeem::redeem`;
    const typeArgs = [coinType];
    return this.suiTxBlock.moveCall(
      target,
      [this.marketId, marketCoinId, SUI_CLOCK_OBJECT_ID],
      typeArgs
    );
  }

  withdrawEntry(marketCoinId: SuiTxArg, coinType: string) {
    this._bundleSwitchboardAggregators(this.switchboardAggregators);
    const target = `${this.packageId}::redeem::redeem_entry`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(
      target,
      [this.marketId, marketCoinId, SUI_CLOCK_OBJECT_ID],
      typeArgs
    );
    return this.suiTxBlock;
  }

  // TODO: remove this after test is done
  mintTestCoin(treasuryId: SuiTxArg, coinName: 'btc' | 'eth' | 'usdc') {
    const target = `${this.packageId}::${coinName}::mint`;
    return this.suiTxBlock.moveCall(target, [treasuryId]);
  }

  mintTestCoinEntry(
    treasuryId: SuiTxArg,
    coinName: 'btc' | 'eth' | 'usdc',
    recipient: string
  ) {
    const target = `${this.packageId}::${coinName}::mint`;
    const coin = this.suiTxBlock.moveCall(target, [treasuryId]);
    this.suiTxBlock.transferObjects([coin], recipient);
    return this.suiTxBlock;
  }

  _bundleSwitchboardAggregators(aggregators: {
    [aggregatorId: string]: string;
  }) {
    const target = `${this.packageId}::switchboard_adaptor::bundle_switchboard_aggregators`;
    for (const aggregatorId in aggregators) {
      this.suiTxBlock.moveCall(
        target,
        [this.switchboardBundleId, this.switchboardRegistryId, aggregatorId],
        [aggregators[aggregatorId]]
      );
    }
    return this.suiTxBlock;
  }
}
