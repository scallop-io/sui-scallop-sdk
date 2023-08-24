import { normalizeSuiAddress } from '@mysten/sui.js';
import { SuiKit } from '@scallop-io/sui-kit';
import { ScallopAddress } from './scallopAddress';
import { ScallopUtils } from './scallopUtils';
import { newScallopTxBlock } from '../txBuilders';
import { queryObligation, queryMarket, getObligations } from '../queries';
import type {
  TransactionArgument,
  SuiTransactionBlockResponse,
} from '@mysten/sui.js';
import type { SuiTxArg } from '@scallop-io/sui-kit';
import type {
  ScallopClientFnReturnType,
  ScallopParams,
  SupportAssetCoins,
  SupportCollateralCoins,
  SupportCoins,
  ScallopTxBlock,
} from '../types';

/**
 * ### Scallop Client
 *
 * it provides contract interaction operations for general users.
 *
 * #### Usage
 *
 * ```typescript
 * const client  = new Scallop(<parameters>);
 * client.<interact functions>();
 * ```
 */
export class ScallopClient {
  public suiKit: SuiKit;
  public address: ScallopAddress;
  public walletAddress: string;

  private readonly _utils: ScallopUtils;
  private readonly _isTestnet: boolean;

  public constructor(
    params: ScallopParams,
    address: ScallopAddress,
    walletAddress?: string,
    isTestnet?: boolean
  ) {
    this.suiKit = new SuiKit(params);
    this.address = address;
    this.walletAddress = normalizeSuiAddress(
      walletAddress || this.suiKit.currentAddress()
    );
    this._utils = new ScallopUtils(params);
    this._isTestnet =
      isTestnet ||
      (params.networkType ? params.networkType === 'testnet' : false);
  }

  createTxBlock() {
    return newScallopTxBlock(
      this.suiKit,
      this.address,
      this._utils,
      this._isTestnet
    );
  }

  /**
   * Query market data.
   *
   * @param rateType - How interest rates are calculated.
   * @return Market data
   */
  public async queryMarket(rateType: 'apy' | 'apr' = 'apr') {
    return queryMarket(this.address, this.suiKit, this._utils, rateType);
  }

  /**
   * Query obligations data.
   *
   * @param ownerAddress - The owner address.
   * @return Obligations data
   */
  async getObligations(ownerAddress?: string) {
    const owner = ownerAddress || this.walletAddress;
    return getObligations(owner, this.suiKit);
  }

  /**
   * Query obligation data.
   *
   * @param obligationId - The obligation id from protocol package.
   * @return Obligation data
   */
  public async queryObligation(obligationId: string) {
    return queryObligation(obligationId, this.address, this.suiKit);
  }

  /**
   * Open obligation.
   *
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @return Transaction block response or transaction block
   */
  public async openObligation(): Promise<SuiTransactionBlockResponse>;
  public async openObligation<S extends boolean>(
    sign?: S
  ): Promise<ScallopClientFnReturnType<S>>;
  public async openObligation<S extends boolean>(
    sign: S = true as S
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.createTxBlock();
    txBlock.openObligationEntry();
    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /**
   * Deposit collateral into the specific pool.
   *
   * @param coinName - Types of collateral coin.
   * @param amount - The amount of coins would deposit.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param obligationId - The obligation object.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  public async depositCollateral(
    coinName: SupportCollateralCoins,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async depositCollateral<S extends boolean>(
    coinName: SupportCollateralCoins,
    amount: number,
    sign?: S,
    obligationId?: SuiTxArg,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async depositCollateral<S extends boolean>(
    coinName: SupportCollateralCoins,
    amount: number,
    sign: S = true as S,
    obligationId?: SuiTxArg,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    if (obligationId) {
      await txBlock.addCollateralQuick(amount, coinName, obligationId);
    } else {
      const [obligation, obligationKey, hotPotato] = txBlock.openObligation();
      await txBlock.addCollateralQuick(amount, coinName, obligation);
      txBlock.returnObligation(obligation, hotPotato);
      txBlock.transferObjects([obligationKey], sender);
    }

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /**
   * Withdraw collateral from the specific pool.
   *
   * @param coinName - Types of collateral coin.
   * @param amount - The amount of coins would deposit.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param obligationId - The obligation object.
   * @param obligationKey - The obligation key object to verifying obligation authority.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  public async withdrawCollateral<S extends boolean>(
    coinName: SupportCollateralCoins,
    amount: number,
    sign: S = true as S,
    obligationId: string,
    obligationKey: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const collateralCoin = await txBlock.takeCollateralQuick(
      amount,
      coinName,
      obligationId,
      obligationKey
    );
    txBlock.transferObjects([collateralCoin], sender);

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /**
   * Deposit asset into the specific pool.
   *
   * @param coinName - Types of asset coin.
   * @param amount - The amount of coins would deposit.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  public async deposit(
    coinName: SupportAssetCoins,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async deposit<S extends boolean>(
    coinName: SupportAssetCoins,
    amount: number,
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async deposit<S extends boolean>(
    coinName: SupportAssetCoins,
    amount: number,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const marketCoin = await txBlock.depositQuick(amount, coinName);
    txBlock.transferObjects([marketCoin], sender);

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /**
   * Withdraw asset from the specific pool, must return market coin.
   *
   * @param coinName - Types of asset coin.
   * @param amount - The amount of coins would withdraw.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  public async withdraw(
    coinName: SupportAssetCoins,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async withdraw<S extends boolean>(
    coinName: SupportAssetCoins,
    amount: number,
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async withdraw<S extends boolean>(
    coinName: SupportAssetCoins,
    amount: number,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const coin = await txBlock.withdrawQuick(amount, coinName);
    txBlock.transferObjects([coin], sender);

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /**
   * borrow asset from the specific pool.
   *
   * @param coinName - Types of asset coin.
   * @param amount - The amount of coins would borrow.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param obligationId - The obligation object.
   * @param obligationKey - The obligation key object to verifying obligation authority.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  public async borrow<S extends boolean>(
    coinName: SupportAssetCoins,
    amount: number,
    sign: S = true as S,
    obligationId: string,
    obligationKey: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const coin = await txBlock.borrowQuick(
      amount,
      coinName,
      obligationId,
      obligationKey
    );
    txBlock.transferObjects([coin], sender);

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /**
   * Repay asset into the specific pool.
   *
   * @param coinName - Types of asset coin.
   * @param amount - The amount of coins would repay.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param obligationId - The obligation object.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  public async repay<S extends boolean>(
    coinName: SupportAssetCoins,
    amount: number,
    sign: S = true as S,
    obligationId: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    await txBlock.repayQuick(amount, coinName, obligationId);

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /**
   * FlashLoan asset from the specific pool.
   *
   * @param coinName - Types of asset coin.
   * @param amount - The amount of coins would repay.
   * @param callback - The callback function to build transaction block and return coin argument.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @return Transaction block response or transaction block
   */
  public async flashLoan(
    coinName: SupportAssetCoins,
    amount: number,
    callback: (
      txBlock: ScallopTxBlock,
      coin: TransactionArgument
    ) => TransactionArgument
  ): Promise<SuiTransactionBlockResponse>;
  public async flashLoan<S extends boolean>(
    coinName: SupportAssetCoins,
    amount: number,
    callback: (
      txBlock: ScallopTxBlock,
      coin: TransactionArgument
    ) => TransactionArgument,
    sign?: S
  ): Promise<ScallopClientFnReturnType<S>>;
  public async flashLoan<S extends boolean>(
    coinName: SupportAssetCoins,
    amount: number,
    callback: (
      txBlock: ScallopTxBlock,
      coin: TransactionArgument
    ) => TransactionArgument,
    sign: S = true as S
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.createTxBlock();
    const [coin, loan] = txBlock.borrowFlashLoan(amount, coinName);
    txBlock.repayFlashLoan(callback(txBlock, coin), loan, coinName);

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /**
   * Mint and get test coin.
   *
   * @remarks
   *  Only be used on the test network.
   *
   * @param coinName - Types of coins supported on the test network.
   * @param amount - The amount of coins minted and received.
   * @param receiveAddress - The wallet address that receives the coins.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @return Transaction block response or transaction block
   */
  public async mintTestCoin(
    coinName: Exclude<SupportCoins, 'sui'>,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async mintTestCoin<S extends boolean>(
    coinName: Exclude<SupportCoins, 'sui'>,
    amount: number,
    sign?: S,
    receiveAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async mintTestCoin<S extends boolean>(
    coinName: Exclude<SupportCoins, 'sui'>,
    amount: number,
    sign: S = true as S,
    receiveAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    if (!this._isTestnet) {
      throw new Error('Only be used on the test network.');
    }

    const txBlock = this.createTxBlock();
    const recipient = receiveAddress || this.walletAddress;
    const packageId = this.address.get('core.packages.testCoin.id');
    const treasuryId = this.address.get(`core.coins.${coinName}.treasury`);
    const target = `${packageId}::${coinName}::mint`;
    const coin = txBlock.moveCall(target, [treasuryId, amount]);
    txBlock.transferObjects([coin], recipient);

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }
}
