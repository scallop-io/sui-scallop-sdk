import ScallopBuilder, { ScallopBuilderParams } from './scallopBuilder';
import type { SuiTransactionBlockResponse } from '@mysten/sui/client';
import type {
  Transaction,
  TransactionObjectArgument,
  TransactionResult,
} from '@mysten/sui/transactions';
import { requireSender } from 'src/utils';
import type { NetworkType, SuiObjectArg } from '@scallop-io/sui-kit';
import type { ScallopTxBlock } from '../types';
import { ScallopClientInterface } from './interface';

export type ScallopClientParams = {
  networkType?: NetworkType;
  builder?: ScallopBuilder;
} & ScallopBuilderParams;

type ScallopClientFnReturnType<T extends boolean> = T extends true
  ? SuiTransactionBlockResponse
  : Transaction;

type ScallopClientVeScaReturnType<T extends boolean> = T extends true
  ? SuiTransactionBlockResponse
  : {
      tx: Transaction;
      scaCoin: TransactionResult;
    };

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
class ScallopClient implements ScallopClientInterface {
  public readonly builder: ScallopBuilder;
  public networkType: NetworkType;

  public constructor(params: ScallopClientParams) {
    this.builder = params.builder ?? new ScallopBuilder(params);
    this.networkType = params.networkType ?? 'mainnet';
  }

  get query() {
    return this.builder.query;
  }

  get utils() {
    return this.query.utils;
  }

  get constants() {
    return this.utils.constants;
  }

  get walletAddress() {
    return this.utils.walletAddress;
  }

  get scallopSuiKit() {
    return this.utils.scallopSuiKit;
  }

  get address() {
    return this.builder.address;
  }

  /**
   * Request the scallop API to initialize data.
   *
   * @param force - Whether to force initialization.
   */
  async init(force: boolean = false) {
    await this.builder.init(force);
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
  async queryMarket() {
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
  async getObligations(ownerAddress?: string) {
    const owner = ownerAddress ?? this.walletAddress;
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
  async queryObligation(obligationId: string) {
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
    const owner = ownerAddress ?? this.walletAddress;
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
  async getStakeAccounts(stakeMarketCoinName: string, ownerAddress?: string) {
    const owner = ownerAddress ?? this.walletAddress;
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
  async getStakePool(stakeMarketCoinName: string) {
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
  async getStakeRewardPool(stakeMarketCoinName: string) {
    return await this.query.getStakeRewardPool(stakeMarketCoinName);
  }

  /* ==================== Core Method ==================== */

  /**
   * Open obligation.
   *
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @return Transaction block response or transaction block.
   */
  async openObligation(): Promise<SuiTransactionBlockResponse>;
  async openObligation<S extends boolean>(
    sign?: S
  ): Promise<ScallopClientFnReturnType<S>>;
  async openObligation<S extends boolean>(
    sign: S = true as S
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    txBlock.openObligationEntry();
    if (sign) {
      return (await this.scallopSuiKit.signAndSendTxn(
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
  async depositCollateral(
    collateralCoinName: string,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  async depositCollateral<S extends boolean>(
    collateralCoinName: string,
    amount: number,
    sign?: S,
    obligationId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  async depositCollateral<S extends boolean>(
    collateralCoinName: string,
    amount: number,
    sign: S = true as S,
    obligationId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress ?? this.walletAddress;
    txBlock.setSender(sender);

    const obligations = await this.query.getObligations(sender);
    const specificObligationId = obligationId ?? obligations[0]?.id;
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
      return (await this.scallopSuiKit.signAndSendTxn(
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
  async withdrawCollateral<S extends boolean>(
    collateralCoinName: string,
    amount: number,
    sign: S = true as S,
    obligationId: string,
    obligationKey: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress ?? this.walletAddress;
    txBlock.setSender(sender);

    const collateralCoin = await txBlock.takeCollateralQuick(
      amount,
      collateralCoinName,
      obligationId,
      obligationKey
    );
    txBlock.transferObjects([collateralCoin], sender);

    if (sign) {
      return (await this.scallopSuiKit.signAndSendTxn(
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
  async deposit(
    poolCoinName: string,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  async deposit<S extends boolean>(
    poolCoinName: string,
    amount: number,
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  async deposit<S extends boolean>(
    poolCoinName: string,
    amount: number,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress ?? this.walletAddress;
    txBlock.setSender(sender);

    const sCoin = await txBlock.depositQuick(amount, poolCoinName);
    txBlock.transferObjects([sCoin], sender);

    if (sign) {
      return (await this.scallopSuiKit.signAndSendTxn(
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
  async depositAndStake(
    stakeCoinName: string,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  async depositAndStake<S extends boolean>(
    stakeCoinName: string,
    amount: number,
    sign?: S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  async depositAndStake<S extends boolean>(
    stakeCoinName: string,
    amount: number,
    sign: S = true as S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress ?? this.walletAddress;
    txBlock.setSender(sender);

    const stakeMarketCoinName =
      this.utils.parseMarketCoinName<string>(stakeCoinName);
    const stakeAccounts =
      await this.query.getStakeAccounts(stakeMarketCoinName);
    const targetStakeAccount = stakeAccountId ?? stakeAccounts[0]?.id;

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
      return (await this.scallopSuiKit.signAndSendTxn(
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
  async withdraw(
    poolCoinName: string,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  async withdraw<S extends boolean>(
    poolCoinName: string,
    amount: number,
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  async withdraw<S extends boolean>(
    poolCoinName: string,
    amount: number,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress ?? this.walletAddress;
    txBlock.setSender(sender);

    const coin = await txBlock.withdrawQuick(amount, poolCoinName);
    txBlock.transferObjects([coin], sender);

    if (sign) {
      return (await this.scallopSuiKit.signAndSendTxn(
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
  async borrow<S extends boolean>(
    poolCoinName: string,
    amount: number,
    sign: S = true as S,
    obligationId: string,
    obligationKey: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress ?? this.walletAddress;
    txBlock.setSender(sender);

    const availableStake = this.constants.whitelist.lending.has(poolCoinName);
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
      await txBlock.stakeObligationWithVeScaQuick(obligationId, obligationKey);
    }

    if (sign) {
      return (await this.scallopSuiKit.signAndSendTxn(
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
  async repay<S extends boolean>(
    poolCoinName: string,
    amount: number,
    sign: S = true as S,
    obligationId: string,
    obligationKey: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress ?? this.walletAddress;
    txBlock.setSender(sender);

    const availableStake = this.constants.whitelist.lending.has(poolCoinName);
    if (sign && availableStake) {
      await txBlock.unstakeObligationQuick(obligationId, obligationKey);
    }
    await txBlock.repayQuick(amount, poolCoinName, obligationId);
    if (sign && availableStake) {
      await txBlock.stakeObligationWithVeScaQuick(obligationId, obligationKey);
    }

    if (sign) {
      return (await this.scallopSuiKit.signAndSendTxn(
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
  async flashLoan(
    poolCoinName: string,
    amount: number,
    callback: (
      txBlock: ScallopTxBlock,
      coin: TransactionObjectArgument | string
    ) => SuiObjectArg
  ): Promise<SuiTransactionBlockResponse>;
  async flashLoan<S extends boolean>(
    poolCoinName: string,
    amount: number,
    callback: (
      txBlock: ScallopTxBlock,
      coin: TransactionObjectArgument | string
    ) => SuiObjectArg,
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  async flashLoan<S extends boolean>(
    poolCoinName: string,
    amount: number,
    callback: (
      txBlock: ScallopTxBlock,
      coin: TransactionObjectArgument | string
    ) => SuiObjectArg | Promise<SuiObjectArg>,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress ?? this.walletAddress;
    txBlock.setSender(sender);
    const [coin, loan] = txBlock.borrowFlashLoan(amount, poolCoinName);
    txBlock.repayFlashLoan(await callback(txBlock, coin), loan, poolCoinName);

    if (sign) {
      return (await this.scallopSuiKit.signAndSendTxn(
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
  async createStakeAccount(
    marketCoinName: string
  ): Promise<SuiTransactionBlockResponse>;
  async createStakeAccount<S extends boolean>(
    marketCoinName: string,
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  async createStakeAccount<S extends boolean>(
    marketCoinName: string,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress ?? this.walletAddress;
    txBlock.setSender(sender);

    const stakeAccount = txBlock.createStakeAccount(marketCoinName);
    txBlock.transferObjects([stakeAccount], sender);

    if (sign) {
      return (await this.scallopSuiKit.signAndSendTxn(
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
  async stake(
    stakeMarketCoinName: string,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  async stake<S extends boolean>(
    stakeMarketCoinName: string,
    amount: number,
    sign?: S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  async stake<S extends boolean>(
    stakeMarketCoinName: string,
    amount: number,
    sign: S = true as S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress ?? this.walletAddress;
    txBlock.setSender(sender);

    const stakeAccounts =
      await this.query.getStakeAccounts(stakeMarketCoinName);
    const targetStakeAccount = stakeAccountId ?? stakeAccounts[0]?.id;
    if (targetStakeAccount) {
      await txBlock.stakeQuick(amount, stakeMarketCoinName, targetStakeAccount);
    } else {
      const account = txBlock.createStakeAccount(stakeMarketCoinName);
      await txBlock.stakeQuick(amount, stakeMarketCoinName, account);
      txBlock.transferObjects([account], sender);
    }

    if (sign) {
      return (await this.scallopSuiKit.signAndSendTxn(
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
  async unstake(
    stakeMarketCoinName: string,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  async unstake<S extends boolean>(
    stakeMarketCoinName: string,
    amount: number,
    sign?: S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  async unstake<S extends boolean>(
    stakeMarketCoinName: string,
    amount: number,
    sign: S = true as S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress ?? this.walletAddress;
    txBlock.setSender(sender);

    const sCoin = await txBlock.unstakeQuick(
      amount,
      stakeMarketCoinName,
      stakeAccountId
    );

    if (sCoin) {
      const sCoinType = this.utils.parseSCoinType(stakeMarketCoinName);
      if (!sCoinType)
        throw new Error(`Invalid sCoin type: ${stakeMarketCoinName}`);

      // merge to existing sCoins if exist
      await this.utils.mergeSimilarCoins(
        txBlock,
        sCoin,
        sCoinType,
        requireSender(txBlock)
      );
    }

    txBlock.transferObjects([sCoin], sender);

    if (sign) {
      return (await this.scallopSuiKit.signAndSendTxn(
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
  async unstakeAndWithdraw(
    stakeMarketCoinName: string,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  async unstakeAndWithdraw<S extends boolean>(
    stakeMarketCoinName: string,
    amount: number,
    sign?: S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  async unstakeAndWithdraw<S extends boolean>(
    stakeMarketCoinName: string,
    amount: number,
    sign: S = true as S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress ?? this.walletAddress;
    txBlock.setSender(sender);

    const stakeMarketCoin = await txBlock.unstakeQuick(
      amount,
      stakeMarketCoinName,
      stakeAccountId,
      false
    );
    const stakeCoinName = this.utils.parseCoinName(stakeMarketCoinName);

    if (stakeMarketCoin) {
      const coin = txBlock.withdraw(stakeMarketCoin, stakeCoinName);
      await this.utils.mergeSimilarCoins(
        txBlock,
        coin,
        this.utils.parseCoinType(stakeCoinName),
        requireSender(txBlock)
      );

      txBlock.transferObjects([coin], sender);
    } else {
      throw new Error(`No stake found for ${stakeMarketCoinName}`);
    }

    if (sign) {
      return (await this.scallopSuiKit.signAndSendTxn(
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
  async claim(
    stakeMarketCoinName: string
  ): Promise<SuiTransactionBlockResponse>;
  async claim<S extends boolean>(
    stakeMarketCoinName: string,
    sign?: S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  async claim<S extends boolean>(
    stakeMarketCoinName: string,
    sign: S = true as S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress ?? this.walletAddress;
    txBlock.setSender(sender);

    const rewardCoins = await txBlock.claimQuick(
      stakeMarketCoinName,
      stakeAccountId
    );
    txBlock.transferObjects(rewardCoins, sender);

    if (sign) {
      return (await this.scallopSuiKit.signAndSendTxn(
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
  async stakeObligation<S extends boolean>(
    obligationId: string,
    obligationKeyId: string,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress ?? this.walletAddress;
    txBlock.setSender(sender);

    await txBlock.stakeObligationWithVeScaQuick(obligationId, obligationKeyId);

    if (sign) {
      return (await this.scallopSuiKit.signAndSendTxn(
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
  async unstakeObligation<S extends boolean>(
    obligationId: string,
    obligationKeyId: string,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress ?? this.walletAddress;
    txBlock.setSender(sender);

    await txBlock.unstakeObligationQuick(obligationId, obligationKeyId);

    if (sign) {
      return (await this.scallopSuiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /**
   * Claim borrow incentive reward.
   *
   * @param poolName
   * @param amount - The amount of coins would deposit.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param accountId - The stake account object.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  async claimBorrowIncentive<S extends boolean>(
    obligationId: string,
    obligationKeyId: string,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    const sender = walletAddress ?? this.walletAddress;
    txBlock.setSender(sender);

    const rewardCoinsCollection: Record<string, TransactionResult[]> = {};
    const obligationAccount =
      await this.query.getObligationAccount(obligationId);
    if (!obligationAccount) throw new Error('Obligation not found');
    const rewardCoinNames = Object.values(obligationAccount.borrowIncentives)
      .filter((t): t is NonNullable<typeof t> => !!t)
      .flatMap(({ rewards }) =>
        rewards.filter(({ availableClaimAmount }) => availableClaimAmount > 0)
      )
      .flatMap(({ coinName }) => coinName);
    for (const rewardCoinName of rewardCoinNames) {
      const rewardCoin = await txBlock.claimBorrowIncentiveQuick(
        rewardCoinName,
        obligationId,
        obligationKeyId
      );
      if (!rewardCoinsCollection[rewardCoinName]) {
        rewardCoinsCollection[rewardCoinName] = [rewardCoin];
      } else {
        rewardCoinsCollection[rewardCoinName].push(rewardCoin);
      }
    }

    txBlock.transferObjects(
      Object.values(rewardCoinsCollection).map((rewardCoins) => {
        const mergeDest = rewardCoins[0];
        if (rewardCoins.length > 1) {
          txBlock.mergeCoins(mergeDest, rewardCoins.slice(1));
        }
        return mergeDest;
      }),
      sender
    );

    if (sign) {
      return (await this.scallopSuiKit.signAndSendTxn(
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
  async migrateAllMarketCoin<S extends boolean>(
    includeStakePool: boolean = true,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const sender = walletAddress ?? this.walletAddress;
    const txBlock = this.builder.createTxBlock();
    txBlock.setSender(sender);

    const toTransfer: SuiObjectArg[] = [];
    for (const sCoinName of this.constants.whitelist.scoin) {
      /**
       * First check marketCoin inside mini wallet
       * Then check stakedMarketCoin inside spool
       */
      const sCoins: SuiObjectArg[] = [];

      // check market coin in mini wallet
      try {
        const { takeCoin } = await this.builder.selectMarketCoin(
          txBlock,
          sCoinName,
          Number.MAX_SAFE_INTEGER,
          sender
        ); // throw error no coins found

        if (takeCoin) {
          // mint new sCoin
          const sCoin = txBlock.mintSCoin(sCoinName as string, takeCoin);
          sCoins.push(sCoin);
        }
      } catch (e: any) {
        // Ignore
        const errMsg = e.toString() as String;
        if (!errMsg.includes('No valid coins found for the transaction'))
          throw e;
      }

      // if market coin found, mint sCoin
      if (includeStakePool) {
        // check for staked market coin in spool
        if (this.constants.whitelist.spool.has(sCoinName as string)) {
          try {
            const sCoin = await txBlock.unstakeQuick(
              Number.MAX_SAFE_INTEGER,
              sCoinName as string
            );
            if (sCoin) {
              sCoins.push(sCoin);
            }
          } catch (_e: any) {
            // ignore
          }
        }
      }

      if (sCoins.length > 0) {
        const mergedSCoin = sCoins[0];
        if (sCoins.length > 1) {
          txBlock.mergeCoins(mergedSCoin, sCoins.slice(1));
        }
        const sCoinType = this.utils.parseSCoinType(sCoinName as string);

        // Merge with existing sCoin in wallet
        await this.utils.mergeSimilarCoins(
          txBlock,
          mergedSCoin,
          sCoinType,
          sender
        );
        toTransfer.push(mergedSCoin);
      }
    }

    if (toTransfer.length > 0) {
      txBlock.transferObjects(toTransfer, sender);
    }

    if (sign) {
      return (await this.scallopSuiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }

  /* ==================== VeSCA ==================== */
  /**
   * Claim unlocked SCA from all veSCA accounts.
   */
  async claimAllUnlockedSca(): Promise<SuiTransactionBlockResponse>;
  async claimAllUnlockedSca<S extends boolean>(
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientVeScaReturnType<S>>;
  async claimAllUnlockedSca<S extends boolean>(
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientVeScaReturnType<S>> {
    const sender = walletAddress ?? this.walletAddress;
    // get all veSca keys
    const veScaKeys = (
      (await this.query.getVeScas({
        walletAddress: sender,
      })) ?? []
    ).map(({ keyObject }) => keyObject);
    if (veScaKeys.length === 0) {
      throw new Error('No veSCA found in the wallet');
    }

    const scaCoins: TransactionResult[] = [];
    const tx = this.builder.createTxBlock();
    tx.setSender(sender);

    await Promise.all(
      veScaKeys.map(async (veScaKey) => {
        try {
          const scaCoin = await tx.redeemScaQuick({
            veScaKey,
            transferSca: false,
          });
          if (!scaCoin) return;
          scaCoins.push(scaCoin);
        } catch (_e) {
          // ignore
        }
      })
    );

    if (scaCoins.length === 0) {
      throw new Error('No unlocked SCA found in the veSCA accounts');
    }

    if (scaCoins.length > 1) {
      tx.mergeCoins(scaCoins[0], scaCoins.slice(1));
    }
    await this.utils.mergeSimilarCoins(tx, scaCoins[0], 'sca', sender);

    if (sign) {
      return (await this.scallopSuiKit.signAndSendTxn(
        tx
      )) as ScallopClientVeScaReturnType<S>;
    } else {
      return {
        tx: tx.txBlock,
        scaCoin: scaCoins[0],
      } as ScallopClientVeScaReturnType<S>;
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
  async mintTestCoin(
    assetCoinName: Exclude<string, 'sui'>,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  async mintTestCoin<S extends boolean>(
    assetCoinName: Exclude<string, 'sui'>,
    amount: number,
    sign?: S,
    receiveAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  async mintTestCoin<S extends boolean>(
    assetCoinName: Exclude<string, 'sui'>,
    amount: number,
    sign: S = true as S,
    receiveAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    const isTestnet = this.networkType === 'testnet';

    if (!isTestnet) {
      throw new Error('Only be used on the test network.');
    }

    const txBlock = this.builder.createTxBlock();
    const recipient = receiveAddress ?? this.walletAddress;
    const packageId = this.address.get('core.packages.testCoin.id');
    const treasuryId = this.address.get(`core.coins.${assetCoinName}.treasury`);
    const target = `${packageId}::${assetCoinName}::mint`;
    const coin = txBlock.moveCall(target, [treasuryId, amount]);
    txBlock.transferObjects([coin], recipient);

    if (sign) {
      return (await this.scallopSuiKit.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }
}

export default ScallopClient;
