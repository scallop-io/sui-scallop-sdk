import {
  normalizeSuiObjectId,
  TransactionArgument,
  SUI_TYPE_ARG,
  SUI_CLOCK_OBJECT_ID,
} from '@mysten/sui.js';
import { SuiTxBlock } from '@scallop-io/sui-kit';
import { Buffer } from 'node:buffer';
import { SUI_COIN_TYPE_ARG_REGEX } from '../constants';
import type { SupportCoins, SupportOracleType } from '../types';

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
   * @param versionId - The protocol version id.
   * @param packageId - The protocol package id.
   * @returns Sui-Kit type transaction block.
   */
  public openObligation(versionId: string, packageId: string) {
    const queryTarget = `${packageId}::open_obligation::open_obligation`;
    return this.suiTxBlock.moveCall(queryTarget, [versionId]);
  }

  /**
   * Construct a transaction block for open obligation and share obligation
   * and transfer obligation key object to owner.
   *
   * @param versionId - The protocol version id.
   * @param packageId - The protocol package id.
   * @returns Sui-Kit type transaction block.
   */
  public openObligationEntry(versionId: string, packageId: string) {
    const queryTarget = `${packageId}::open_obligation::open_obligation_entry`;
    this.suiTxBlock.moveCall(queryTarget, [versionId]);
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
   * @param versionId - The protocol version id.
   * @param packageId - The protocol package id.
   * @param marketId - The market Id from protocol package.
   * @param obligationId - The obligation object id.
   * @param coinId - The balance corresponds to the specified amount of coin id.
   * @param coinType - The type of collateral coin.
   * @returns Sui-Kit type transaction block.
   */
  public addCollateral(
    versionId: string,
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
      [versionId, obligationId, marketId, coinId],
      typeArgs
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for take collateral coin from specific pool and take collateral coin.
   *
   * @param versionId - The protocol version id.
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
    versionId: string,
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
        versionId,
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
   * @param versionId - The protocol version id.
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
    versionId: string,
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
        versionId,
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
   * @param versionId - The protocol version id.
   * @param packageId - The protocol package id.
   * @param marketId - The market Id from protocol package.
   * @param coinId - The balance corresponds to the specified amount of coin id.
   * @param coinType - The type of asset coin.
   * @returns Sui-Kit type transaction block.
   */
  public deposit(
    versionId: string,
    packageId: string,
    marketId: TransactionArgument | string,
    coinId: TransactionArgument | string,
    coinType: string
  ) {
    const target = `${packageId}::mint::mint`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(
      target,
      [versionId, marketId, coinId, SUI_CLOCK_OBJECT_ID],
      typeArgs
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for deposit asset coin into specific pool and transfer market coin to signer.
   *
   * @param versionId - The protocol version id.
   * @param packageId - The protocol package id.
   * @param marketId - The market Id from protocol package.
   * @param coinId - The balance corresponds to the specified amount of coin id.
   * @param coinType - The type of asset coin.
   * @returns Sui-Kit type transaction block.
   */
  public depositEntry(
    versionId: string,
    packageId: string,
    marketId: TransactionArgument | string,
    coinId: TransactionArgument | string,
    coinType: string
  ) {
    const target = `${packageId}::mint::mint_entry`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(
      target,
      [versionId, marketId, coinId, SUI_CLOCK_OBJECT_ID],
      typeArgs
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for withdraw asset coin from specific pool and take asset coin,
   * must return market coin.
   *
   * @param versionId - The protocol version id.
   * @param packageId - The protocol package id.
   * @param marketId - The market Id from protocol package.
   * @param marketCoinId - The balance corresponds to the specified amount of market coin id.
   * @param coinType - The type of asset coin.
   * @returns Sui-Kit type transaction block.
   */
  public withdraw(
    versionId: string,
    packageId: string,
    marketId: TransactionArgument | string,
    marketCoinId: TransactionArgument | string,
    coinType: string
  ) {
    const target = `${packageId}::redeem::redeem`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(
      target,
      [versionId, marketId, marketCoinId, SUI_CLOCK_OBJECT_ID],
      typeArgs
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for withdraw asset coin from specific pool and transfer asset coin to signer,
   * must return market coin.
   *
   * @param versionId - The protocol version id.
   * @param packageId - The protocol package id.
   * @param marketId - The market Id from protocol package.
   * @param marketCoinId - The balance corresponds to the specified amount of market coin id.
   * @param coinType - The type of asset coin.
   * @returns Sui-Kit type transaction block.
   */
  withdrawEntry(
    versionId: string,
    packageId: string,
    marketId: TransactionArgument | string,
    marketCoinId: TransactionArgument | string,
    coinType: string
  ) {
    const target = `${packageId}::redeem::redeem_entry`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(
      target,
      [versionId, marketId, marketCoinId, SUI_CLOCK_OBJECT_ID],
      typeArgs
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for borrow asset coin from specific pool and take asset coin.
   *
   * @param versionId - The protocol version id.
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
    versionId: string,
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
        versionId,
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
   * @param versionId - The protocol version id.
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
    versionId: string,
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
        versionId,
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
   * @param versionId - The protocol version id.
   * @param packageId - The protocol package id.
   * @param marketId - The market Id from protocol package.
   * @param obligationId - The obligation object id.
   * @param coinId - The balance corresponds to the specified amount of coin id.
   * @param coinType - The type of asset coin.
   * @returns Sui-Kit type transaction block.
   */
  public repay(
    versionId: string,
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
      [versionId, obligationId, marketId, coinId, SUI_CLOCK_OBJECT_ID],
      typeArgs
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for borrow asset coin with flash loan from specific pool.
   *
   * @param versionId - The protocol version id.
   * @param packageId - The protocol package id.
   * @param marketId - The market Id from protocol package.
   * @param amount - The specified amount of coin.
   * @param coinType - The type of asset coin.
   * @returns Sui-Kit type transaction block.
   */
  public borrowFlashLoan(
    versionId: string,
    packageId: string,
    marketId: TransactionArgument | string,
    amount: number,
    coinType: string
  ) {
    const target = `${packageId}::flash_loan::borrow_flash_loan`;
    const typeArgs = [coinType];
    return this.suiTxBlock.moveCall(
      target,
      [versionId, marketId, amount],
      typeArgs
    );
  }

  /**
   * Construct a transaction block for repay asset coin with flash loan into specific pool.
   *
   * @param versionId - The protocol version id.
   * @param packageId - The protocol package id.
   * @param marketId - The market Id from protocol package.
   * @param coinId - The balance corresponds to the specified amount of coin id.
   * @param loan -  The loan object that is passed around between parties.
   * @param coinType - The type of asset coin.
   * @returns Sui-Kit type transaction block.
   */
  public repayFlashLoan(
    versionId: string,
    packageId: string,
    marketId: TransactionArgument | string,
    coinId: TransactionArgument | string,
    loan: TransactionArgument,
    coinType: string
  ) {
    const target = `${packageId}::flash_loan::repay_flash_loan`;
    const typeArgs = [coinType];
    this.suiTxBlock.moveCall(
      target,
      [versionId, marketId, coinId, loan],
      typeArgs
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for update the price.
   *
   * @param rules - The oracle rules.
   * @param xOraclePackageId - The xOracle package id.
   * @param xOracleId - The xOracle Id from xOracle package.
   * @param pythPackageId - The pyth package id.
   * @param pythRegistryId - The registry id from pyth package.
   * @param pythStateId - The price state id from pyth package.
   * @param pythWormholeStateId - The whormhole state id from pyth package.
   * @param pythFeedObjectId - The feed object id from pyth package.
   * @param pythVaaFromFeeId - The vaa from pyth api with feed id.
   * @param switchboardPackageId - The switchboard package id.
   * @param switchboardRegistryId - The registry id from switchboard package.
   * @param switchboardAggregatorId - The aggregator id from switchboard package.
   * @param supraPackageId - The supra package id.
   * @param supraRegistryId - The registry id from supra package.
   * @param supraHolderId - The holder id from supra package.
   * @param coinType - The type of coin.
   * @returns Sui-Kit type transaction block.
   */
  public updatePrice(
    rules: SupportOracleType[],
    xOraclePackageId: string,
    xOracleId: TransactionArgument | string,
    pythPackageId: string,
    pythRegistryId: TransactionArgument | string,
    pythStateId: TransactionArgument | string,
    pythWormholeStateId: TransactionArgument | string,
    pythFeedObjectId: TransactionArgument | string,
    pythVaaFromFeeId: TransactionArgument | string,
    switchboardPackageId: string,
    switchboardRegistryId: TransactionArgument | string,
    switchboardAggregatorId: TransactionArgument | string,
    supraPackageId: string,
    supraRegistryId: TransactionArgument | string,
    supraHolderId: TransactionArgument | string,
    coinType: string
  ) {
    const request = this.priceUpdateRequest(
      xOraclePackageId,
      xOracleId,
      coinType
    );
    if (rules.includes('pyth')) {
      this.updatePythPrice(
        pythPackageId,
        request,
        pythStateId,
        pythWormholeStateId,
        pythFeedObjectId,
        pythVaaFromFeeId,
        pythRegistryId,
        coinType
      );
    }
    if (rules.includes('switchboard')) {
      this.updateSwitchboardPrice(
        switchboardPackageId,
        request,
        switchboardAggregatorId,
        switchboardRegistryId,
        coinType
      );
    }
    if (rules.includes('supra')) {
      this.updateSupraPrice(
        supraPackageId,
        request,
        supraHolderId,
        supraRegistryId,
        coinType
      );
    }
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
    coinName: SupportCoins,
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
    coinName: SupportCoins,
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
    this.suiTxBlock.moveCall(
      target,
      [xOracleId, request, SUI_CLOCK_OBJECT_ID],
      typeArgs
    );
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for update supra price.
   *
   * @param packageId - The supra package id.
   * @param request - The result of the request.
   * @param holderId - The holder id from supra package.
   * @param registryId - The registry id from supra package.
   * @param coinType - The type of coin.
   * @returns Sui-Kit type transaction block.
   */
  private updateSupraPrice(
    packageId: string,
    request: TransactionArgument,
    holderId: TransactionArgument | string,
    registryId: TransactionArgument | string,
    coinType: string
  ) {
    this.suiTxBlock.moveCall(
      `${packageId}::rule::set_price`,
      [request, holderId, registryId, SUI_CLOCK_OBJECT_ID],
      [coinType]
    );
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

  /**
   * Construct a transaction block for update pyth price.
   *
   * @param packageId - The pyth package id.
   * @param request - The result of the request.
   * @param stateId - The price state id from pyth package.
   * @param wormholeStateId - The whormhole state id from pyth package.
   * @param feedObjectId - The feed object id from pyth package.
   * @param vaaFromFeeId - The vaa from pyth api with feed id.
   * @param registryId - The registry id from pyth package.
   * @param coinType - The type of coin.
   * @returns Sui-Kit type transaction block.
   */
  private updatePythPrice(
    packageId: string,
    request: TransactionArgument,
    stateId: TransactionArgument | string,
    wormholeStateId: TransactionArgument | string,
    feedObjectId: TransactionArgument | string,
    vaaFromFeeId: TransactionArgument | string,
    registryId: TransactionArgument | string,
    coinType: string
  ) {
    const [updateFee] = this.suiTxBlock.splitSUIFromGas([1]);
    this.suiTxBlock.moveCall(
      `${packageId}::rule::set_price`,
      [
        request,
        wormholeStateId,
        stateId,
        feedObjectId,
        registryId,
        this.suiTxBlock.pure([...Buffer.from(vaaFromFeeId, 'base64')]),
        updateFee,
        SUI_CLOCK_OBJECT_ID,
      ],
      [coinType]
    );
  }
}
