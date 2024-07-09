import { normalizeSuiAddress } from '@mysten/sui.js/utils';
import { SuiKit } from '@scallop-io/sui-kit';
import {
  ADDRESSES_ID,
  SUPPORT_BORROW_INCENTIVE_POOLS,
  SUPPORT_BORROW_INCENTIVE_REWARDS,
  SUPPORT_SCOIN,
  SUPPORT_SPOOLS,
} from '../constants';
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
  SupportSCoin,
} from '../types';
import { ScallopCache } from './scallopCache';
import { DEFAULT_CACHE_OPTIONS } from 'src/constants/cache';

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
  public cache: ScallopCache;
  public walletAddress: string;

  public constructor(
    params: ScallopClientParams,
    instance?: ScallopInstanceParams
  ) {
    this.params = params;
    this.suiKit = instance?.suiKit ?? new SuiKit(params);
    this.cache =
      instance?.cache ?? new ScallopCache(DEFAULT_CACHE_OPTIONS, this.suiKit);
    this.address =
      instance?.address ??
      new ScallopAddress(
        {
          id: params?.addressesId || ADDRESSES_ID,
          network: params?.networkType,
        },
        this.cache
      );
    this.query =
      instance?.query ??
      new ScallopQuery(params, {
        suiKit: this.suiKit,
        address: this.address,
        cache: this.cache,
      });
    this.utils =
      instance?.utils ??
      new ScallopUtils(params, {
        suiKit: this.suiKit,
        address: this.address,
        query: this.query,
        cache: this.cache,
      });
    this.builder =
      instance?.builder ??
      new ScallopBuilder(params, {
        suiKit: this.suiKit,
        address: this.address,
        query: this.query,
        utils: this.utils,
        cache: this.cache,
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

    const sCoin = await txBlock.depositQuick(amount, poolCoinName);
    txBlock.transferObjects([sCoin], sender);

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

    const marketCoin = await txBlock.depositQuick(amount, stakeCoinName, false);
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

    const marketCoin = await txBlock.unstakeQuick(
      amount,
      stakeMarketCoinName,
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

    const stakeMarketCoin = await txBlock.unstakeQuick(
      amount,
      stakeMarketCoinName,
      stakeAccountId
    );
    const stakeCoinName =
      this.utils.parseCoinName<SupportStakeCoins>(stakeMarketCoinName);
    if (stakeMarketCoin) {
      const coin = txBlock.withdraw(stakeMarketCoin, stakeCoinName);
      txBlock.transferObjects([coin], sender);
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
   * @param obligationId - The obligation account object.
   * @param obligationKeyId - The obligation key account object.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  public async stakeObligation<S extends boolean>(
    obligationId: string,
    obligationKeyId: string,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    await txBlock.stakeObligationQuick(obligationId, obligationKeyId);

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
   * @param obligationId - The obligation account object.
   * @param obligationKeyId - The obligation key account object.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  public async unstakeObligation<S extends boolean>(
    obligationId: string,
    obligationKeyId: string,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    await txBlock.unstakeObligationQuick(obligationId, obligationKeyId);

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
    obligationId: string,
    obligationKeyId: string,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress || this.walletAddress;
    txBlock.setSender(sender);

    const rewardCoins = [];
    for (const rewardCoinName of SUPPORT_BORROW_INCENTIVE_REWARDS) {
      const rewardCoin = await txBlock.claimBorrowIncentiveQuick(
        coinName,
        rewardCoinName,
        obligationId,
        obligationKeyId
      );
      rewardCoins.push(rewardCoin);
    }
    txBlock.transferObjects(rewardCoins, sender);

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /* ==================== Migrate market coin to sCoin method ==================== */
  /**
   * Function to migrate all market coin in user wallet into sCoin
   * @returns Transaction response
   */
  public async migrateAllMarketCoin<S extends boolean>(
    sign: S = true as S
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    txBlock.setSender(this.walletAddress);

    const toTransfer: SuiObjectArg[] = [];
    await Promise.all(
      SUPPORT_SCOIN.map(async (sCoinName) => {
        /**
         * First check marketCoin inside mini wallet
         * Then check stakedMarketCoin inside spool
         */
        const sCoins: SuiObjectArg[] = [];
        let toDestroyMarketCoin: SuiObjectArg | undefined;

        // check market coin in mini wallet
        try {
          const marketCoins = await this.utils.selectCoins(
            Number.MAX_SAFE_INTEGER,
            this.utils.parseMarketCoinType(sCoinName as SupportSCoin),
            this.walletAddress
          ); // throw error no coins found

          const mergedMarketCoin = marketCoins[0];
          if (marketCoins.length > 1) {
            txBlock.mergeCoins(mergedMarketCoin, marketCoins.slice(1));
          }

          toDestroyMarketCoin = mergedMarketCoin;
        } catch (e: any) {
          // Ignore
          const errMsg = e.toString() as String;
          if (!errMsg.includes('No valid coins found for the transaction'))
            throw e;
        }

        // if market coin found, mint sCoin
        if (toDestroyMarketCoin) {
          // mint new sCoin
          const sCoin = txBlock.mintSCoin(
            sCoinName as SupportSCoin,
            toDestroyMarketCoin
          );

          // check if current sCoin exist
          try {
            const existSCoins = await this.utils.selectCoins(
              Number.MAX_SAFE_INTEGER,
              this.utils.parseSCoinType(sCoinName as SupportSCoin),
              this.walletAddress
            ); // throw error on no coins found
            const mergedSCoin = existSCoins[0];
            if (existSCoins.length > 1) {
              txBlock.mergeCoins(mergedSCoin, existSCoins.slice(1));
            }

            // merge existing sCoin to new sCoin
            txBlock.mergeCoins(sCoin, [mergedSCoin]);
          } catch (e: any) {
            // ignore
            const errMsg = e.toString() as String;
            if (!errMsg.includes('No valid coins found for the transaction'))
              throw e;
          }
          sCoins.push(sCoin);
        }

        // check for staked market coin in spool
        if (SUPPORT_SPOOLS.includes(sCoinName as SupportStakeMarketCoins)) {
          try {
            const sCoin = await txBlock.unstakeQuick(
              Number.MAX_SAFE_INTEGER,
              sCoinName as SupportStakeMarketCoins
            );
            if (sCoin) {
              sCoins.push(sCoin);
            }
          } catch (e: any) {
            // ignore
            const errMsg = e.toString();
            if (!errMsg.includes('No stake account found')) throw e;
          }
        }

        if (sCoins.length > 0) {
          const mergedSCoin = sCoins[0];
          if (sCoins.length > 1) {
            txBlock.mergeCoins(mergedSCoin, sCoins.slice(1));
          }

          toTransfer.push(mergedSCoin);
        }
      })
    );

    if (toTransfer.length > 0) {
      txBlock.transferObjects(toTransfer, this.walletAddress);
    }

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
