import { normalizeSuiAddress, TransactionArgument } from '@mysten/sui.js';
import { SuiKit } from '@scallop-io/sui-kit';
import { ScallopAddress } from './scallopAddress';
import { ScallopUtils } from './scallopUtils';
import { newScallopTxBlock, ScallopTxBlock } from '../txBuilders';
import { queryObligation, queryMarket, getObligations } from '../queries';
import type {
  ScallopParams,
  SupportAssetCoins,
  SupportCollateralCoins,
  SupportCoins,
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
   * @return Market data
   */
  public async queryMarket() {
    return queryMarket(this.address, this.suiKit);
  }

  /**
   * Query obligations data.
   *
   * @param ownerAddress - The owner address.
   * @return Obligations data
   */
  async getObligations(ownerAddress?: string) {
    const owner = ownerAddress || this.walletAddress;
    return getObligations(owner, this.address, this.suiKit);
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
  public async openObligation(sign: boolean = true) {
    const txBlock = this.createTxBlock();
    txBlock.openObligationEntry();
    if (sign) {
      return this.suiKit.signAndSendTxn(txBlock);
    } else {
      return txBlock.txBlock;
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
    amount: number,
    sign: boolean = true,
    obligationId?: string,
    walletAddress?: string
  ) {
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
      return this.suiKit.signAndSendTxn(txBlock);
    } else {
      return txBlock.txBlock;
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
  public async withdrawCollateral(
    coinName: SupportCollateralCoins,
    amount: number,
    sign: boolean = true,
    obligationId: string,
    obligationKey: string,
    walletAddress?: string
  ) {
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
      return this.suiKit.signAndSendTxn(txBlock);
    } else {
      return txBlock.txBlock;
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
    amount: number,
    sign: boolean = true,
    walletAddress?: string
  ) {
    const txBlock = this.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const marketCoin = await txBlock.depositQuick(amount, coinName);
    txBlock.transferObjects([marketCoin], sender);

    if (sign) {
      return this.suiKit.signAndSendTxn(txBlock);
    } else {
      return txBlock.txBlock;
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
    amount: number,
    sign: boolean = true,
    walletAddress?: string
  ) {
    const txBlock = this.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const coin = await txBlock.withdrawQuick(amount, coinName);
    txBlock.transferObjects([coin], sender);

    if (sign) {
      return this.suiKit.signAndSendTxn(txBlock);
    } else {
      return txBlock.txBlock;
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
  public async borrow(
    coinName: SupportAssetCoins,
    amount: number,
    sign: boolean = true,
    obligationId: string,
    obligationKey: string,
    walletAddress?: string
  ) {
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
      return this.suiKit.signAndSendTxn(txBlock);
    } else {
      return txBlock.txBlock;
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
  public async repay(
    coinName: SupportAssetCoins,
    amount: number,
    sign: boolean = true,
    obligationId: string,
    walletAddress?: string
  ) {
    const txBlock = this.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    await txBlock.repayQuick(amount, coinName, obligationId);

    if (sign) {
      return this.suiKit.signAndSendTxn(txBlock);
    } else {
      return txBlock.txBlock;
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
    ) => TransactionArgument,
    sign: boolean = true
  ) {
    const txBlock = this.createTxBlock();
    const [coin, loan] = txBlock.borrowFlashLoan(amount, coinName);
    txBlock.repayFlashLoan(callback(txBlock, coin), loan, coinName);

    if (sign) {
      return this.suiKit.signAndSendTxn(txBlock);
    } else {
      return txBlock.txBlock;
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
    amount: number,
    sign: boolean = true,
    receiveAddress?: string
  ) {
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
      return this.suiKit.signAndSendTxn(txBlock);
    } else {
      return txBlock.txBlock;
    }
  }
}
