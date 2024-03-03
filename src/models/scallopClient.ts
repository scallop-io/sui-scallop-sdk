import { normalizeSuiAddress } from '@mysten/sui.js/utils';
import { SuiKit } from '@scallop-io/sui-kit';
import { ADDRESSES_ID, SUPPORT_BORROW_INCENTIVE_POOLS } from '../constants';
import { ScallopAddress } from './scallopAddress';
import { ScallopUtils } from './scallopUtils';
import { ScallopBuilder } from './scallopBuilder';
import { ScallopQuery } from './scallopQuery';
import type { SuiTransactionBlockResponse } from '@mysten/sui.js/client';
import type { TransactionObjectArgument } from '@mysten/sui.js/transactions';
import type { SuiObjectArg } from '@scallop-io/sui-kit';
import type {
  ScallopClientFnReturnType,
  ScallopInstanceParams,
  ScallopClientParams,
  SupportPoolCoins,
  SupportCollateralCoins,
  SupportAssetCoins,
  SupportStakeCoins,
  SupportStakeMarketCoins,
  SupportBorrowIncentiveCoins,
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
   * @param force - Whether to force initialization.
   */
  public async init(force: boolean = false) {
    if (force || !this.address.getAddresses()) {
      await this.address.read();
    }

    await this.builder.init(force, this.address);
    await this.query.init(force, this.address);
    await this.utils.init(force, this.address);
  }

  /* ==================== Query Method ==================== */

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
   * @param stakeMarketCoinName - Support stake market coin.
   * @param ownerAddress - The owner address.
   * @return Stake accounts data.
   */
  async getStakeAccounts(
    stakeMarketCoinName: SupportStakeMarketCoins,
    ownerAddress?: string
  ) {
    const owner = ownerAddress || this.walletAddress;
    return await this.query.getStakeAccounts(stakeMarketCoinName, owner);
  }

  /**
   * Query stake pool data.
   *
   * @description
   * This method might be @deprecated in the future, please use the {@link ScallopQuery} query instance instead.
   *
   * @param stakeMarketCoinName - Support stake market coin.
   * @return Stake pool data.
   */
  async getStakePool(stakeMarketCoinName: SupportStakeMarketCoins) {
    return await this.query.getStakePool(stakeMarketCoinName);
  }

  /**
   * Query reward pool data.
   *
   * @description
   * This method might be @deprecated in the future, please use the {@link ScallopQuery} query instance instead.
   *
   * @param stakeMarketCoinName - Support stake market coin.
   * @return Reward pool data.
   */
  async getStakeRewardPool(stakeMarketCoinName: SupportStakeMarketCoins) {
    return await this.query.getStakeRewardPool(stakeMarketCoinName);
  }

  /* ==================== Core Method ==================== */

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
   * @param collateralCoinName - Types of collateral coin.
   * @param amount - The amount of coins would deposit.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param obligationId - The obligation object.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block.
   */
  public async depositCollateral(
    collateralCoinName: SupportCollateralCoins,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async depositCollateral<S extends boolean>(
    collateralCoinName: SupportCollateralCoins,
    amount: number,
    sign?: S,
    obligationId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async depositCollateral<S extends boolean>(
    collateralCoinName: SupportCollateralCoins,
    amount: number,
    sign: S = true as S,
    obligationId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const obligations = await this.query.getObligations(sender);
    const specificObligationId = obligationId || obligations?.[0]?.id;
    if (specificObligationId) {
      await txBlock.addCollateralQuick(
        amount,
        collateralCoinName,
        specificObligationId
      );
    } else {
      const [obligation, obligationKey, hotPotato] = txBlock.openObligation();
      await txBlock.addCollateralQuick(amount, collateralCoinName, obligation);
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
   * @param collateralCoinName - Types of collateral coin.
   * @param amount - The amount of coins would deposit.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param obligationId - The obligation object.
   * @param obligationKey - The obligation key object to verifying obligation authority.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block.
   */
  public async withdrawCollateral<S extends boolean>(
    collateralCoinName: SupportCollateralCoins,
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
      collateralCoinName,
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
   * @param poolCoinName - Types of pool coin.
   * @param amount - The amount of coins would deposit.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block.
   */
  public async deposit(
    poolCoinName: SupportPoolCoins,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async deposit<S extends boolean>(
    poolCoinName: SupportPoolCoins,
    amount: number,
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async deposit<S extends boolean>(
    poolCoinName: SupportPoolCoins,
    amount: number,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const marketCoin = await txBlock.depositQuick(amount, poolCoinName);
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
   * Deposit asset into the specific pool and Stake market coin into the corresponding spool.
   *
   * @param stakeCoinName - Types of stake coin.
   * @param amount - The amount of coins would deposit.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param stakeAccountId - The stake account object.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block.
   */
  public async depositAndStake(
    stakeCoinName: SupportStakeCoins,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async depositAndStake<S extends boolean>(
    stakeCoinName: SupportStakeCoins,
    amount: number,
    sign?: S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async depositAndStake<S extends boolean>(
    stakeCoinName: SupportStakeCoins,
    amount: number,
    sign: S = true as S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const stakeMarketCoinName =
      this.utils.parseMarketCoinName<SupportStakeMarketCoins>(stakeCoinName);
    const stakeAccounts =
      await this.query.getStakeAccounts(stakeMarketCoinName);
    const targetStakeAccount = stakeAccountId || stakeAccounts[0].id;

    const marketCoin = await txBlock.depositQuick(amount, stakeCoinName);
    if (targetStakeAccount) {
      await txBlock.stakeQuick(
        marketCoin,
        stakeMarketCoinName,
        targetStakeAccount
      );
    } else {
      const account = txBlock.createStakeAccount(stakeMarketCoinName);
      await txBlock.stakeQuick(marketCoin, stakeMarketCoinName, account);
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
   * Withdraw asset from the specific pool, must return market coin.
   *
   * @param poolCoinName - Specific support pool coin name.
   * @param amount - The amount of coins would withdraw.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block.
   */
  public async withdraw(
    poolCoinName: SupportPoolCoins,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async withdraw<S extends boolean>(
    poolCoinName: SupportPoolCoins,
    amount: number,
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async withdraw<S extends boolean>(
    poolCoinName: SupportPoolCoins,
    amount: number,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const coin = await txBlock.withdrawQuick(amount, poolCoinName);
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
   * @param poolCoinName - Specific support pool coin name.
   * @param amount - The amount of coins would borrow.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param obligationId - The obligation object.
   * @param obligationKey - The obligation key object to verifying obligation authority.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block.
   */
  public async borrow<S extends boolean>(
    poolCoinName: SupportPoolCoins,
    amount: number,
    sign: S = true as S,
    obligationId: string,
    obligationKey: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const availableStake = (
      SUPPORT_BORROW_INCENTIVE_POOLS as readonly SupportPoolCoins[]
    ).includes(poolCoinName);
    if (sign && availableStake) {
      await txBlock.unstakeObligationQuick(obligationId, obligationKey);
    }
    const coin = await txBlock.borrowQuick(
      amount,
      poolCoinName,
      obligationId,
      obligationKey
    );
    txBlock.transferObjects([coin], sender);
    if (sign && availableStake) {
      await txBlock.stakeObligationQuick(obligationId, obligationKey);
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
   * Repay asset into the specific pool.
   *
   * @param poolCoinName - Specific support pool coin name.
   * @param amount - The amount of coins would repay.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param obligationId - The obligation object.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block.
   */
  public async repay<S extends boolean>(
    poolCoinName: SupportPoolCoins,
    amount: number,
    sign: S = true as S,
    obligationId: string,
    obligationKey: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const availableStake = (
      SUPPORT_BORROW_INCENTIVE_POOLS as readonly SupportPoolCoins[]
    ).includes(poolCoinName);
    if (sign && availableStake) {
      await txBlock.unstakeObligationQuick(obligationId, obligationKey);
    }
    await txBlock.repayQuick(amount, poolCoinName, obligationId);
    if (sign && availableStake) {
      await txBlock.stakeObligationQuick(obligationId, obligationKey);
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
   * FlashLoan asset from the specific pool.
   *
   * @param poolCoinName - Specific support pool coin name..
   * @param amount - The amount of coins would repay.
   * @param callback - The callback function to build transaction block and return coin argument.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @return Transaction block response or transaction block.
   */
  public async flashLoan(
    poolCoinName: SupportPoolCoins,
    amount: number,
    callback: (
      txBlock: ScallopTxBlock,
      coin: TransactionObjectArgument | string
    ) => SuiObjectArg
  ): Promise<SuiTransactionBlockResponse>;
  public async flashLoan<S extends boolean>(
    poolCoinName: SupportPoolCoins,
    amount: number,
    callback: (
      txBlock: ScallopTxBlock,
      coin: TransactionObjectArgument | string
    ) => SuiObjectArg,
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async flashLoan<S extends boolean>(
    poolCoinName: SupportPoolCoins,
    amount: number,
    callback: (
      txBlock: ScallopTxBlock,
      coin: TransactionObjectArgument | string
    ) => SuiObjectArg,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);
    const [coin, loan] = txBlock.borrowFlashLoan(amount, poolCoinName);
    txBlock.repayFlashLoan(await callback(txBlock, coin), loan, poolCoinName);

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /* ==================== Spool Method ==================== */

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

    const stakeAccount = txBlock.createStakeAccount(marketCoinName);
    txBlock.transferObjects([stakeAccount], sender);

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
    stakeMarketCoinName: SupportStakeMarketCoins,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async stake<S extends boolean>(
    stakeMarketCoinName: SupportStakeMarketCoins,
    amount: number,
    sign?: S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async stake<S extends boolean>(
    stakeMarketCoinName: SupportStakeMarketCoins,
    amount: number,
    sign: S = true as S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const stakeAccounts =
      await this.query.getStakeAccounts(stakeMarketCoinName);
    const targetStakeAccount = stakeAccountId || stakeAccounts[0].id;
    if (targetStakeAccount) {
      await txBlock.stakeQuick(amount, stakeMarketCoinName, targetStakeAccount);
    } else {
      const account = txBlock.createStakeAccount(stakeMarketCoinName);
      await txBlock.stakeQuick(amount, stakeMarketCoinName, account);
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
   * @param stakeMarketCoinName - Types of mak coin.
   * @param amount - The amount of coins would deposit.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param accountId - The stake account object.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block.
   */
  public async unstake(
    stakeMarketCoinName: SupportStakeMarketCoins,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async unstake<S extends boolean>(
    stakeMarketCoinName: SupportStakeMarketCoins,
    amount: number,
    sign?: S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async unstake<S extends boolean>(
    stakeMarketCoinName: SupportStakeMarketCoins,
    amount: number,
    sign: S = true as S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const marketCoins = await txBlock.unstakeQuick(
      amount,
      stakeMarketCoinName,
      stakeAccountId
    );
    txBlock.transferObjects(marketCoins, sender);

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /**
   * Unstake market coin from the specific spool and withdraw asset from the corresponding pool.
   *
   * @param marketCoinName - Types of mak coin.
   * @param amount - The amount of coins would deposit.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param accountId - The stake account object.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block.
   */
  public async unstakeAndWithdraw(
    stakeMarketCoinName: SupportStakeMarketCoins,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async unstakeAndWithdraw<S extends boolean>(
    stakeMarketCoinName: SupportStakeMarketCoins,
    amount: number,
    sign?: S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async unstakeAndWithdraw<S extends boolean>(
    stakeMarketCoinName: SupportStakeMarketCoins,
    amount: number,
    sign: S = true as S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const stakeMarketCoins = await txBlock.unstakeQuick(
      amount,
      stakeMarketCoinName,
      stakeAccountId
    );

    const coins = [];
    for (const stakeMarketCoin of stakeMarketCoins) {
      const stakeCoinName =
        this.utils.parseCoinName<SupportStakeCoins>(stakeMarketCoinName);
      const coin = await txBlock.withdraw(stakeMarketCoin, stakeCoinName);
      coins.push(coin);
    }
    txBlock.transferObjects(coins, sender);

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
   * @param stakeMarketCoinName - Types of mak coin.
   * @param amount - The amount of coins would deposit.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param accountId - The stake account object.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block.
   */
  public async claim(
    stakeMarketCoinName: SupportStakeMarketCoins
  ): Promise<SuiTransactionBlockResponse>;
  public async claim<S extends boolean>(
    stakeMarketCoinName: SupportStakeMarketCoins,
    sign?: S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async claim<S extends boolean>(
    stakeMarketCoinName: SupportStakeMarketCoins,
    sign: S = true as S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const rewardCoins = await txBlock.claimQuick(
      stakeMarketCoinName,
      stakeAccountId
    );
    txBlock.transferObjects(rewardCoins, sender);

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /* ==================== Borrow Incentive Method ==================== */

  /**
   * stake obligaion.
   *
   * @param obligaionId - The obligation account object.
   * @param obligaionKeyId - The obligation key account object.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  public async stakeObligation<S extends boolean>(
    obligaionId: string,
    obligaionKeyId: string,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    await txBlock.stakeObligationQuick(obligaionId, obligaionKeyId);

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /**
   * unstake obligaion.
   *
   * @param obligaionId - The obligation account object.
   * @param obligaionKeyId - The obligation key account object.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  public async unstakeObligation<S extends boolean>(
    obligaionId: string,
    obligaionKeyId: string,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    await txBlock.unstakeObligationQuick(obligaionId, obligaionKeyId);

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /**
   * unstake market coin from the specific spool.
   *
   * @param marketCoinName - Types of mak coin.
   * @param amount - The amount of coins would deposit.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param accountId - The stake account object.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  public async claimBorrowIncentive<S extends boolean>(
    coinName: SupportBorrowIncentiveCoins,
    obligaionId: string,
    obligaionKeyId: string,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const rewardCoin = await txBlock.claimBorrowIncentiveQuick(
      coinName,
      obligaionId,
      obligaionKeyId
    );
    txBlock.transferObjects([rewardCoin], sender);

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /* ==================== Other Method ==================== */

  /**
   * Mint and get test coin.
   *
   * @remarks
   * Only be used on the test network.
   *
   * @param assetCoinName - Specific asset coin name.
   * @param amount - The amount of coins minted and received.
   * @param receiveAddress - The wallet address that receives the coins.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @return Transaction block response or transaction block.
   */
  public async mintTestCoin(
    assetCoinName: Exclude<SupportAssetCoins, 'sui'>,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async mintTestCoin<S extends boolean>(
    assetCoinName: Exclude<SupportAssetCoins, 'sui'>,
    amount: number,
    sign?: S,
    receiveAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async mintTestCoin<S extends boolean>(
    assetCoinName: Exclude<SupportAssetCoins, 'sui'>,
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
    const treasuryId = this.address.get(`core.coins.${assetCoinName}.treasury`);
    const target = `${packageId}::${assetCoinName}::mint`;
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
