import { normalizeSuiAddress } from '@mysten/sui.js/utils';
import { SuiKit } from '@scallop-io/sui-kit';
import { ScallopAddress } from './scallopAddress';
import { ScallopUtils } from './scallopUtils';
import { ScallopBuilder } from './scallopBuilder';
import { ScallopQuery } from './scallopQuery';
import { ADDRESSES_ID } from '../constants';
import type { SuiTransactionBlockResponse } from '@mysten/sui.js/client';
import type { TransactionArgument } from '@mysten/sui.js/transactions';
import type { SuiTxArg } from '@scallop-io/sui-kit';
import type {
  ScallopClientFnReturnType,
  ScallopInstanceParams,
  ScallopClientParams,
  SupportPools,
  SupportCollaterals,
  SupportCoins,
  SupportStakeMarketCoins,
  ScallopTxBlock,
} from '../types';

/**
 * @description
 * It provides contract interaction operations for general users.
 *
 * @example
 * ```typescript
 * const scallopClient  = new ScallopClient(<parameters>);
 * await scallopClient.init();
 * scallopClient.<client functions>();
 * await scallopClient.<client async functions>();
 * ```
 */
export class ScallopClient {
  public readonly params: ScallopClientParams;

  public suiKit: SuiKit;
  public address: ScallopAddress;
  public builder: ScallopBuilder;
  public query: ScallopQuery;
  public utils: ScallopUtils;
  public walletAddress: string;

  public constructor(
    params: ScallopClientParams,
    instance?: ScallopInstanceParams
  ) {
    this.params = params;
    this.suiKit = instance?.suiKit ?? new SuiKit(params);
    this.address =
      instance?.address ??
      new ScallopAddress({
        id: params?.addressesId || ADDRESSES_ID,
        network: params?.networkType,
      });
    this.query =
      instance?.query ??
      new ScallopQuery(params, {
        suiKit: this.suiKit,
        address: this.address,
      });
    this.utils =
      instance?.utils ??
      new ScallopUtils(params, {
        suiKit: this.suiKit,
        address: this.address,
        query: this.query,
      });
    this.builder =
      instance?.builder ??
      new ScallopBuilder(params, {
        suiKit: this.suiKit,
        address: this.address,
        query: this.query,
        utils: this.utils,
      });
    this.walletAddress = normalizeSuiAddress(
      params?.walletAddress || this.suiKit.currentAddress()
    );
  }

  /**
   * Request the scallop API to initialize data.
   *
   * @param forece - Whether to force initialization.
   */
  public async init(forece: boolean = false) {
    if (forece || !this.address.getAddresses()) {
      await this.address.read();
    }
    await this.query.init(forece);
    await this.utils.init(forece);
    await this.builder.init(forece);
  }

  /* === Query Method === */

  /**
   * Query market data.
   *
   * @description
   * This method might be @deprecated in the future, please use the {@link ScallopQuery} query instance instead.
   *
   * @return Market data.
   */
  public async queryMarket() {
    return await this.query.queryMarket();
  }

  /**
   * Get obligations data.
   *
   * @description
   * This method might be @deprecated in the future, please use the {@link ScallopQuery} query instance instead.
   *
   * @param ownerAddress - The owner address.
   * @return Obligations data.
   */
  public async getObligations(ownerAddress?: string) {
    const owner = ownerAddress || this.walletAddress;
    return await this.query.getObligations(owner);
  }

  /**
   * Query obligation data.
   *
   * @description
   * This method might be @deprecated in the future, please use the {@link ScallopQuery} query instance instead.
   *
   * @param obligationId - The obligation id.
   * @return Obligation data.
   */
  public async queryObligation(obligationId: string) {
    return await this.query.queryObligation(obligationId);
  }

  /**
   * Query all stake accounts data.
   *
   * @description
   * This method might be @deprecated in the future, please use the {@link ScallopQuery} query instance instead.
   *
   * @param ownerAddress - The owner address.
   * @return All stake accounts data.
   */
  async getAllStakeAccounts(ownerAddress?: string) {
    const owner = ownerAddress || this.walletAddress;
    return await this.query.getAllStakeAccounts(owner);
  }

  /**
   * Query stake account data.
   *
   * @description
   * This method might be @deprecated in the future, please use the {@link ScallopQuery} query instance instead.
   *
   * @param marketCoinName - Support stake market coin.
   * @param ownerAddress - The owner address.
   * @return Stake accounts data.
   */
  async getStakeAccounts(
    marketCoinName: SupportStakeMarketCoins,
    ownerAddress?: string
  ) {
    const owner = ownerAddress || this.walletAddress;
    return await this.query.getStakeAccounts(marketCoinName, owner);
  }

  /**
   * Query stake pool data.
   *
   * @description
   * This method might be @deprecated in the future, please use the {@link ScallopQuery} query instance instead.
   *
   * @param marketCoinName - Support stake market coin.
   * @return Stake pool data.
   */
  async getStakePool(marketCoinName: SupportStakeMarketCoins) {
    return await this.query.getStakePool(marketCoinName);
  }

  /**
   * Query reward pool data.
   *
   * @description
   * This method might be @deprecated in the future, please use the {@link ScallopQuery} query instance instead.
   *
   * @param marketCoinName - Support stake market coin.
   * @return Reward pool data.
   */
  async getRewardPool(marketCoinName: SupportStakeMarketCoins) {
    return await this.query.getRewardPool(marketCoinName);
  }

  /* === Spool Method === */

  /**
   * Create stake account.
   *
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block.
   */
  public async createStakeAccount(
    marketCoinName: SupportStakeMarketCoins
  ): Promise<SuiTransactionBlockResponse>;
  public async createStakeAccount<S extends boolean>(
    marketCoinName: SupportStakeMarketCoins,
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async createStakeAccount<S extends boolean>(
    marketCoinName: SupportStakeMarketCoins,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const account = txBlock.createStakeAccount(marketCoinName);
    txBlock.transferObjects([account], sender);

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /**
   * Stake market coin into the specific spool.
   *
   * @param marketCoinName - Types of market coin.
   * @param amount - The amount of coins would deposit.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param stakeAccountId - The stake account object.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block.
   */
  public async stake(
    marketCoinName: SupportStakeMarketCoins,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async stake<S extends boolean>(
    marketCoinName: SupportStakeMarketCoins,
    amount: number,
    sign?: S,
    stakeAccountId?: SuiTxArg,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async stake<S extends boolean>(
    marketCoinName: SupportStakeMarketCoins,
    amount: number,
    sign: S = true as S,
    stakeAccountId?: SuiTxArg,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const stakeAccountInfo = await this.query.getStakeAccounts(marketCoinName);
    const targetStakeAccount = stakeAccountId || stakeAccountInfo[0].id;
    if (targetStakeAccount) {
      await txBlock.stakeQuick(amount, marketCoinName, targetStakeAccount);
    } else {
      const account = txBlock.createStakeAccount(marketCoinName);
      await txBlock.stakeQuick(amount, marketCoinName, account);
      txBlock.transferObjects([account], sender);
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
   * Unstake market coin from the specific spool.
   *
   * @param marketCoinName - Types of mak coin.
   * @param amount - The amount of coins would deposit.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param accountId - The stake account object.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block.
   */
  public async unstake(
    marketCoinName: SupportStakeMarketCoins,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async unstake<S extends boolean>(
    marketCoinName: SupportStakeMarketCoins,
    amount: number,
    sign?: S,
    stakeAccountId?: SuiTxArg,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async unstake<S extends boolean>(
    marketCoinName: SupportStakeMarketCoins,
    amount: number,
    sign: S = true as S,
    stakeAccountId?: SuiTxArg,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const marketCoin = await txBlock.unstakeQuick(
      amount,
      marketCoinName,
      stakeAccountId
    );
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
   * Claim reward coin from the specific spool.
   *
   * @param marketCoinName - Types of mak coin.
   * @param amount - The amount of coins would deposit.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param accountId - The stake account object.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block.
   */
  public async claim(
    marketCoinName: SupportStakeMarketCoins
  ): Promise<SuiTransactionBlockResponse>;
  public async claim<S extends boolean>(
    marketCoinName: SupportStakeMarketCoins,
    sign?: S,
    stakeAccountId?: SuiTxArg,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async claim<S extends boolean>(
    marketCoinName: SupportStakeMarketCoins,
    sign: S = true as S,
    stakeAccountId?: SuiTxArg,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const rewardCoin = await txBlock.claimQuick(marketCoinName, stakeAccountId);
    txBlock.transferObjects([rewardCoin], sender);

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /* === Core Method === */

  /**
   * Open obligation.
   *
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @return Transaction block response or transaction block.
   */
  public async openObligation(): Promise<SuiTransactionBlockResponse>;
  public async openObligation<S extends boolean>(
    sign?: S
  ): Promise<ScallopClientFnReturnType<S>>;
  public async openObligation<S extends boolean>(
    sign: S = true as S
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
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
   * @return Transaction block response or transaction block.
   */
  public async depositCollateral(
    coinName: SupportCollaterals,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async depositCollateral<S extends boolean>(
    coinName: SupportCollaterals,
    amount: number,
    sign?: S,
    obligationId?: SuiTxArg,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async depositCollateral<S extends boolean>(
    coinName: SupportCollaterals,
    amount: number,
    sign: S = true as S,
    obligationId?: SuiTxArg,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const obligations = await this.query.getObligations(sender);
    const tarketObligationId = obligationId || obligations[0].id;
    if (tarketObligationId) {
      await txBlock.addCollateralQuick(amount, coinName, tarketObligationId);
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
   * @return Transaction block response or transaction block.
   */
  public async withdrawCollateral<S extends boolean>(
    coinName: SupportCollaterals,
    amount: number,
    sign: S = true as S,
    obligationId: string,
    obligationKey: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
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
   * @return Transaction block response or transaction block.
   */
  public async deposit(
    coinName: SupportPools,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async deposit<S extends boolean>(
    coinName: SupportPools,
    amount: number,
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async deposit<S extends boolean>(
    coinName: SupportPools,
    amount: number,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
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
   * @return Transaction block response or transaction block.
   */
  public async withdraw(
    coinName: SupportPools,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async withdraw<S extends boolean>(
    coinName: SupportPools,
    amount: number,
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async withdraw<S extends boolean>(
    coinName: SupportPools,
    amount: number,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
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
   * Borrow asset from the specific pool.
   *
   * @param coinName - Types of asset coin.
   * @param amount - The amount of coins would borrow.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param obligationId - The obligation object.
   * @param obligationKey - The obligation key object to verifying obligation authority.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block.
   */
  public async borrow<S extends boolean>(
    coinName: SupportPools,
    amount: number,
    sign: S = true as S,
    obligationId: string,
    obligationKey: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
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
   * @return Transaction block response or transaction block.
   */
  public async repay<S extends boolean>(
    coinName: SupportPools,
    amount: number,
    sign: S = true as S,
    obligationId: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
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
   * @return Transaction block response or transaction block.
   */
  public async flashLoan(
    coinName: SupportPools,
    amount: number,
    callback: (
      txBlock: ScallopTxBlock,
      coin: TransactionArgument
    ) => TransactionArgument
  ): Promise<SuiTransactionBlockResponse>;
  public async flashLoan<S extends boolean>(
    coinName: SupportPools,
    amount: number,
    callback: (
      txBlock: ScallopTxBlock,
      coin: TransactionArgument
    ) => TransactionArgument,
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async flashLoan<S extends boolean>(
    coinName: SupportPools,
    amount: number,
    callback: (
      txBlock: ScallopTxBlock,
      coin: TransactionArgument
    ) => TransactionArgument,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);
    const [coin, loan] = txBlock.borrowFlashLoan(amount, coinName);
    txBlock.repayFlashLoan(await callback(txBlock, coin), loan, coinName);

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /* === Other Method === */

  /**
   * Mint and get test coin.
   *
   * @remarks
   * Only be used on the test network.
   *
   * @param coinName - Types of coins supported on the test network.
   * @param amount - The amount of coins minted and received.
   * @param receiveAddress - The wallet address that receives the coins.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @return Transaction block response or transaction block.
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
    const isTestnet = this.params.networkType
      ? this.params.networkType === 'testnet'
      : false;

    if (!isTestnet) {
      throw new Error('Only be used on the test network.');
    }

    const txBlock = this.builder.createTxBlock();
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
