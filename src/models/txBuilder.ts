import {
  normalizeSuiObjectId,
  TransactionArgument,
  SUI_TYPE_ARG,
  SUI_CLOCK_OBJECT_ID,
} from '@mysten/sui.js';
import { SuiTxBlock } from '@scallop-io/sui-kit';
import { SUI_COIN_TYPE_ARG_REGEX } from '../constants';
import type { SupportCoinType } from '../types';

/**
 * it provides methods for build transaction.
 */
export class ScallopTxBuilder {
  public suiTxBlock: SuiTxBlock;

  constructor() {
    this.suiTxBlock = new SuiTxBlock();
  }

  /**
   * Get transaction block.
   *
   * @returns sui type transaction block.
   */
  public get txBlock() {
    return this.suiTxBlock.txBlock;
  }

  /**
   * Construct a transaction block for querying market data.
   *
   * @param packageId - The query package id.
   * @param marketId - The market id from protocol package.
   * @returns Sui-Kit type transaction block.
   */
  public queryMarket(
    packageId: string,
    marketId: TransactionArgument | string
  ) {
    const queryTarget = `${packageId}::market_query::market_data`;
    this.suiTxBlock.moveCall(queryTarget, [marketId]);
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for querying obligation data.
   *
   * @param packageId - The query package id.
   * @param obligationId - The obligation id from protocol package.
   * @returns Sui-Kit type transaction block.
   */
  public queryObligation(
    packageId: string,
    obligationId: TransactionArgument | string
  ) {
    const queryTarget = `${packageId}::obligation_query::obligation_data`;
    this.suiTxBlock.moveCall(queryTarget, [obligationId]);
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for open obligation and take
   * key, id and hot potato obligation objects.
   *
   * @param packageId - The protocol package id.
   * @returns Sui-Kit type transaction block.
   */
  public openObligation(packageId: string) {
    const queryTarget = `${packageId}::open_obligation::open_obligation`;
    return this.suiTxBlock.moveCall(queryTarget, []);
  }

  /**
   * Construct a transaction block for open obligation and share obligation
   * and transfer obligation key object to owner.
   *
   * @param packageId - The protocol package id.
   * @returns Sui-Kit type transaction block.
   */
  public openObligationEntry(packageId: string) {
    const queryTarget = `${packageId}::open_obligation::open_obligation_entry`;
    this.suiTxBlock.moveCall(queryTarget, []);
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for return the shared obligation with the obligation hot potato.
   *
   * @param packageId - The protocol package id.
   * @param obligationId - The obligation id from protocol package.
   * @param obligationHotPotato - The temporary obligation object that is passed around between parties.
   * @returns Sui-Kit type transaction block.
   */
  public returnObligation(
    packageId: string,
    obligationId: TransactionArgument | string,
    obligationHotPotato: TransactionArgument
  ) {
    const target = `${packageId}::open_obligation::return_obligation`;
    this.suiTxBlock.moveCall(target, [obligationId, obligationHotPotato]);
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for add collateral coin into specific pool.
   *
   * @param packageId - The protocol package id.
   * @param marketId - The market Id from protocol package.
   * @param obligationId - The obligation object id.
   * @param coinId - The balance corresponds to the specified amount of coin id.
   * @param coinType - The type of collateral coin.
   * @returns Sui-Kit type transaction block.
   */
  public addCollateral(
    packageId: string,
    marketId: TransactionArgument | string,
    obligationId: TransactionArgument | string,
    coinId: TransactionArgument | string,
    coinType: string
  ) {
    const target = `${packageId}::deposit_collateral::deposit_collateral`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(
      target,
      [obligationId, marketId, coinId],
      typeArgs
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for take collateral coin from specific pool and take collateral coin.
   *
   * @param packageId - The protocol package id.
   * @param marketId - The market Id from protocol package.
   * @param coinDecimalsRegistryId - The coinDecimalsRegistry Id from coinDecimalsRegistry package.
   * @param xOracleId - The xOracle Id from xOracle package.
   * @param obligationId - The obligation object id.
   * @param obligationKey - The obligation key object id to verifying obligation authority.
   * @param amount - The specified amount of coin.
   * @param coinType - The type of collateral coin.
   * @returns Sui-Kit type transaction block.
   */
  public takeCollateral(
    packageId: string,
    marketId: TransactionArgument | string,
    coinDecimalsRegistryId: TransactionArgument | string,
    xOracleId: TransactionArgument | string,
    obligationId: TransactionArgument | string,
    obligationKeyId: TransactionArgument | string,
    amount: number,
    coinType: string
  ) {
    const target = `${packageId}::withdraw_collateral::withdraw_collateral`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(
      target,
      [
        obligationId,
        obligationKeyId,
        marketId,
        coinDecimalsRegistryId,
        amount,
        xOracleId,
        SUI_CLOCK_OBJECT_ID,
      ],
      typeArgs
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for take collateral coin from specific pool and transfer collateral coin to signer.
   *
   * @param packageId - The protocol package id.
   * @param marketId - The market Id from protocol package.
   * @param coinDecimalsRegistryId - The coinDecimalsRegistry Id from coinDecimalsRegistry package.
   * @param xOracleId - The xOracle Id from xOracle package.
   * @param obligationId - The obligation object id.
   * @param obligationKey - The obligation key object id to verifying obligation authority.
   * @param amount - The specified amount of coin.
   * @param coinType - The type of collateral coin.
   * @returns Sui-Kit type transaction block.
   */
  public takeCollateralEntry(
    packageId: string,
    marketId: TransactionArgument | string,
    coinDecimalsRegistryId: TransactionArgument | string,
    xOracleId: TransactionArgument | string,
    obligationId: TransactionArgument | string,
    obligationKeyId: TransactionArgument | string,
    amount: number,
    coinType: string
  ) {
    const target = `${packageId}::withdraw_collateral::withdraw_collateral_entry`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(
      target,
      [
        obligationId,
        obligationKeyId,
        marketId,
        coinDecimalsRegistryId,
        amount,
        xOracleId,
        SUI_CLOCK_OBJECT_ID,
      ],
      typeArgs
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for deposit asset coin into specific pool and take market coin.
   *
   * @param packageId - The protocol package id.
   * @param marketId - The market Id from protocol package.
   * @param coinId - The balance corresponds to the specified amount of coin id.
   * @param coinType - The type of asset coin.
   * @returns Sui-Kit type transaction block.
   */
  public deposit(
    packageId: string,
    marketId: TransactionArgument | string,
    coinId: TransactionArgument | string,
    coinType: string
  ) {
    const target = `${packageId}::mint::mint`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(
      target,
      [marketId, coinId, SUI_CLOCK_OBJECT_ID],
      typeArgs
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for deposit asset coin into specific pool and transfer market coin to signer.
   *
   * @param packageId - The protocol package id.
   * @param marketId - The market Id from protocol package.
   * @param coinId - The balance corresponds to the specified amount of coin id.
   * @param coinType - The type of asset coin.
   * @returns Sui-Kit type transaction block.
   */
  public depositEntry(
    packageId: string,
    marketId: TransactionArgument | string,
    coinId: TransactionArgument | string,
    coinType: string
  ) {
    const target = `${packageId}::mint::mint_entry`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(
      target,
      [marketId, coinId, SUI_CLOCK_OBJECT_ID],
      typeArgs
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for withdraw asset coin from specific pool and take asset coin,
   * must return market coin.
   *
   * @param packageId - The protocol package id.
   * @param marketId - The market Id from protocol package.
   * @param marketCoinId - The balance corresponds to the specified amount of market coin id.
   * @param coinType - The type of asset coin.
   * @returns Sui-Kit type transaction block.
   */
  public withdraw(
    packageId: string,
    marketId: TransactionArgument | string,
    marketCoinId: TransactionArgument | string,
    coinType: string
  ) {
    const target = `${packageId}::redeem::redeem`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(
      target,
      [marketId, marketCoinId, SUI_CLOCK_OBJECT_ID],
      typeArgs
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for withdraw asset coin from specific pool and transfer asset coin to signer,
   * must return market coin.
   *
   * @param packageId - The protocol package id.
   * @param marketId - The market Id from protocol package.
   * @param marketCoinId - The balance corresponds to the specified amount of market coin id.
   * @param coinType - The type of asset coin.
   * @returns Sui-Kit type transaction block.
   */
  withdrawEntry(
    packageId: string,
    marketId: TransactionArgument | string,
    marketCoinId: TransactionArgument | string,
    coinType: string
  ) {
    const target = `${packageId}::redeem::redeem_entry`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(
      target,
      [marketId, marketCoinId, SUI_CLOCK_OBJECT_ID],
      typeArgs
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for borrow asset coin from specific pool and take asset coin.
   *
   * @param packageId - The protocol package id.
   * @param marketId - The market Id from protocol package.
   * @param coinDecimalsRegistryId - The coinDecimalsRegistry Id from coinDecimalsRegistry package.
   * @param xOracleId - The xOracle Id from xOracle package.
   * @param obligationId - The obligation object id.
   * @param obligationKey - The obligation key object id to verifying obligation authority.
   * @param amount - The specified amount of coin.
   * @param coinType - The type of asset coin.
   * @returns Sui-Kit type transaction block.
   */
  public borrow(
    packageId: string,
    marketId: TransactionArgument | string,
    coinDecimalsRegistryId: TransactionArgument | string,
    xOracleId: TransactionArgument | string,
    obligationId: TransactionArgument | string,
    obligationKeyId: TransactionArgument | string,
    amount: number,
    coinType: string
  ) {
    const target = `${packageId}::borrow::borrow`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(
      target,
      [
        obligationId,
        obligationKeyId,
        marketId,
        coinDecimalsRegistryId,
        amount,
        xOracleId,
        SUI_CLOCK_OBJECT_ID,
      ],
      typeArgs
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for borrow asset coin from specific pool and transfer asset coin to signer.
   *
   * @param packageId - The protocol package id.
   * @param marketId - The market Id from protocol package.
   * @param coinDecimalsRegistryId - The coinDecimalsRegistry Id from coinDecimalsRegistry package.
   * @param xOracleId - The xOracle Id from xOracle package.
   * @param obligationId - The obligation object id.
   * @param obligationKey - The obligation key object id to verifying obligation authority.
   * @param amount - The specified amount of coin.
   * @param coinType - The type of asset coin.
   * @returns Sui-Kit type transaction block.
   */
  public borrowEntry(
    packageId: string,
    marketId: TransactionArgument | string,
    coinDecimalsRegistryId: TransactionArgument | string,
    xOracleId: TransactionArgument | string,
    obligationId: TransactionArgument | string,
    obligationKeyId: TransactionArgument | string,
    amount: number,
    coinType: string
  ) {
    const target = `${packageId}::borrow::borrow_entry`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(
      target,
      [
        obligationId,
        obligationKeyId,
        marketId,
        coinDecimalsRegistryId,
        amount,
        xOracleId,
        SUI_CLOCK_OBJECT_ID,
      ],
      typeArgs
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for repay asset coin into specific pool.
   *
   * @param packageId - The protocol package id.
   * @param marketId - The market Id from protocol package.
   * @param obligationId - The obligation object id.
   * @param coinId - The balance corresponds to the specified amount of coin id.
   * @param coinType - The type of asset coin.
   * @returns Sui-Kit type transaction block.
   */
  public repay(
    packageId: string,
    marketId: TransactionArgument | string,
    obligationId: TransactionArgument | string,
    coinId: TransactionArgument | string,
    coinType: string
  ) {
    const target = `${packageId}::repay::repay`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(
      target,
      [obligationId, marketId, coinId, SUI_CLOCK_OBJECT_ID],
      typeArgs
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for update the price.
   *
   * @param xOraclePackageId - The xOracle package id.
   * @param xOracleId - The xOracle Id from xOracle package.
   * @param switchboardPackageId - The switchboard package id.
   * @param switchboardRegistryId - The registry id from switchboard package.
   * @param switchboardAggregatorId - The aggregator id from switchboard package.
   * @param coinType - The type of coin.
   * @returns Sui-Kit type transaction block.
   */
  public updatePrice(
    xOraclePackageId: string,
    xOracleId: TransactionArgument | string,
    switchboardPackageId: string,
    switchboardRegistryId: TransactionArgument | string,
    switchboardAggregatorId: TransactionArgument | string,
    coinType: string
  ) {
    const request = this.priceUpdateRequest(
      xOraclePackageId,
      xOracleId,
      coinType
    );
    this.updateSwitchboardPrice(
      switchboardPackageId,
      request,
      switchboardAggregatorId,
      switchboardRegistryId,
      coinType
    );
    this.confirmPriceUpdateRequest(
      xOraclePackageId,
      xOracleId,
      request,
      coinType
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for mint the test coin.
   *
   * @remarks
   *  Only be used on the test network.
   *
   * @param packageId - The testCoin package id.
   * @param treasuryId - The treasury id from testCoin package.
   * @param coinName - Types of coins supported on the test network.
   * @param amount - The amount of coins minted and received.
   * @returns Sui-Kit type transaction block.
   */
  public mintTestCoin(
    packageId: string,
    treasuryId: TransactionArgument | string,
    coinName: SupportCoinType,
    amount: number
  ) {
    const target = `${packageId}::${coinName}::mint`;
    return this.suiTxBlock.moveCall(target, [treasuryId, amount]);
  }

  /**
   * Construct a transaction block for mint and transfer the test coin to recipient.
   *
   * @remarks
   *  Only be used on the test network.
   *
   * @param packageId - The protocol package id.
   * @param treasuryId - The treasury id from testCoin package.
   * @param coinName - Types of coins supported on the test network.
   * @param amount - The amount of coins minted and received.
   * @param recipient - The recipient's wallet address.
   * @returns Sui-Kit type transaction block.
   */
  public mintTestCoinEntry(
    packageId: string,
    treasuryId: TransactionArgument | string,
    coinName: SupportCoinType,
    amount: number,
    recipient: string
  ) {
    const target = `${packageId}::${coinName}::mint`;
    const coin = this.suiTxBlock.moveCall(target, [treasuryId, amount]);
    this.suiTxBlock.transferObjects([coin], recipient);
    return this.suiTxBlock;
  }

  /**
   * @description Split the coins into those that will be taked and the remaining coins.
   * @param coins The coins that are to be split.
   * @param amount The amount that is needed for the coin.
   * @param coinType The coin type, default is 0x2::SUI::SUI.
   * @return An array composed of the used and remaining transaction coin arguments.
   */
  public takeCoins(
    coins: (TransactionArgument | string)[],
    amount: number,
    coinType: string = SUI_TYPE_ARG
  ) {
    const txBlock = this.suiTxBlock.txBlock;
    const isSui = !!coinType?.match(SUI_COIN_TYPE_ARG_REGEX);

    let takeCoin: TransactionArgument;
    let leftCoin: TransactionArgument;

    // If the type of coin is sui, the coin amount must be split when it equals one.
    if (isSui && coins.length < 2) {
      takeCoin = txBlock.splitCoins(txBlock.gas, [txBlock.pure(amount)]);
      leftCoin = txBlock.gas;
    } else {
      const coinArgs = coins.map((coin) => {
        if (typeof coin === 'string' && coin.startsWith('0x')) {
          return txBlock.object(normalizeSuiObjectId(coin));
        }
        return coin;
      });

      const mergedCoin = coinArgs[0];
      if (coinArgs.length > 1) {
        txBlock.mergeCoins(mergedCoin, coinArgs.slice(1));
      }
      const [splitedCoin] = txBlock.splitCoins(mergedCoin, [
        txBlock.pure(amount),
      ]);
      takeCoin = splitedCoin;
      leftCoin = mergedCoin;
    }

    return [takeCoin, leftCoin];
  }

  /**
   * Construct a transaction block for request price update.
   *
   * @param packageId - The xOracle package id.
   * @param xOracleId - The xOracle Id from xOracle package.
   * @param coinType - The type of coin.
   * @returns Sui-Kit type transaction block.
   */
  private priceUpdateRequest(
    packageId: string,
    xOracleId: TransactionArgument | string,
    coinType: string
  ) {
    const target = `${packageId}::x_oracle::price_update_request`;
    const typeArgs = [coinType];
    return this.suiTxBlock.moveCall(target, [xOracleId], typeArgs);
  }

  /**
   * Construct a transaction block for confirm price update request.
   *
   * @param packageId - The xOracle package id.
   * @param xOracleId - The xOracle Id from xOracle package.
   * @param request - The result of the request.
   * @param coinType - The type of coin.
   * @returns Sui-Kit type transaction block.
   */
  private confirmPriceUpdateRequest(
    packageId: string,
    xOracleId: TransactionArgument | string,
    request: TransactionArgument,
    coinType: string
  ) {
    const target = `${packageId}::x_oracle::confirm_price_update_request`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(target, [xOracleId, request], typeArgs);
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for update switchboard price.
   *
   * @param packageId - The switchboard package id.
   * @param request - The result of the request.
   * @param aggregatorId - The aggregator id from switchboard package.
   * @param registryId - The registry id from switchboard package.
   * @param coinType - The type of coin.
   * @returns Sui-Kit type transaction block.
   */
  private updateSwitchboardPrice(
    packageId: string,
    request: TransactionArgument,
    aggregatorId: TransactionArgument | string,
    registryId: TransactionArgument | string,
    coinType: string
  ) {
    this.suiTxBlock.moveCall(
      `${packageId}::rule::set_price`,
      [request, aggregatorId, registryId],
      [coinType]
    );
  }
}
