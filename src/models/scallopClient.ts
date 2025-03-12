import { normalizeSuiAddress } from '@mysten/sui/utils';
import { SuiKit } from '@scallop-io/sui-kit';
import { ScallopAddress } from './scallopAddress';
import { ScallopUtils } from './scallopUtils';
import { ScallopBuilder } from './scallopBuilder';
import { ScallopQuery } from './scallopQuery';
import type { SuiTransactionBlockResponse } from '@mysten/sui/client';
import type {
  TransactionObjectArgument,
  TransactionResult,
} from '@mysten/sui/transactions';
import { ScallopCache } from './scallopCache';
import { requireSender } from 'src/utils';
import type { SuiObjectArg } from '@scallop-io/sui-kit';
import type {
  ScallopClientFnReturnType,
  ScallopClientParams,
  ScallopTxBlock,
  ScallopClientVeScaReturnType,
  ScallopClientInstanceParams,
} from '../types';
import { newSuiKit } from './suiKit';
import { ScallopConstants } from './scallopConstants';

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
  public constants: ScallopConstants;
  public builder: ScallopBuilder;
  public query: ScallopQuery;
  public utils: ScallopUtils;
  public cache: ScallopCache;
  public walletAddress: string;

  public constructor(
    params: ScallopClientParams,
    instance?: ScallopClientInstanceParams
  ) {
    this.params = params;
    this.suiKit =
      instance?.suiKit ?? instance?.builder?.suiKit ?? newSuiKit(params);
    this.walletAddress = normalizeSuiAddress(
      params?.walletAddress ?? this.suiKit.currentAddress()
    );

    this.cache =
      instance?.builder?.cache ??
      instance?.cache ??
      new ScallopCache(this.params, {
        suiKit: this.suiKit,
      });

    this.address =
      instance?.builder?.address ??
      new ScallopAddress(this.params, {
        cache: this.cache,
      });

    this.constants =
      instance?.builder?.constants ??
      new ScallopConstants(this.params, {
        address: this.address,
      });

    this.utils =
      instance?.builder?.utils ??
      new ScallopUtils(this.params, {
        constants: this.constants,
      });

    this.query =
      instance?.builder?.query ??
      new ScallopQuery(this.params, {
        utils: this.utils,
      });

    this.builder =
      instance?.builder ??
      new ScallopBuilder(this.params, {
        query: this.query,
      });
  }

  /**
   * Request the scallop API to initialize data.
   *
   * @param force - Whether to force initialization.
   */
  public async init(force: boolean = false) {
    if (force || !this.constants.isInitialized) {
      await this.constants.init();
    }

    await this.builder.init(force);
    await this.query.init(force);
    await this.utils.init(force);
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
    collateralCoinName: string,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async depositCollateral<S extends boolean>(
    collateralCoinName: string,
    amount: number,
    sign?: S,
    obligationId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async depositCollateral<S extends boolean>(
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
    poolCoinName: string,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async deposit<S extends boolean>(
    poolCoinName: string,
    amount: number,
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async deposit<S extends boolean>(
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
    stakeCoinName: string,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async depositAndStake<S extends boolean>(
    stakeCoinName: string,
    amount: number,
    sign?: S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async depositAndStake<S extends boolean>(
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
    poolCoinName: string,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async withdraw<S extends boolean>(
    poolCoinName: string,
    amount: number,
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async withdraw<S extends boolean>(
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
    poolCoinName: string,
    amount: number,
    callback: (
      txBlock: ScallopTxBlock,
      coin: TransactionObjectArgument | string
    ) => SuiObjectArg
  ): Promise<SuiTransactionBlockResponse>;
  public async flashLoan<S extends boolean>(
    poolCoinName: string,
    amount: number,
    callback: (
      txBlock: ScallopTxBlock,
      coin: TransactionObjectArgument | string
    ) => SuiObjectArg,
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async flashLoan<S extends boolean>(
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
    marketCoinName: string
  ): Promise<SuiTransactionBlockResponse>;
  public async createStakeAccount<S extends boolean>(
    marketCoinName: string,
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async createStakeAccount<S extends boolean>(
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
    stakeMarketCoinName: string,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async stake<S extends boolean>(
    stakeMarketCoinName: string,
    amount: number,
    sign?: S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async stake<S extends boolean>(
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
    stakeMarketCoinName: string,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async unstake<S extends boolean>(
    stakeMarketCoinName: string,
    amount: number,
    sign?: S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async unstake<S extends boolean>(
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
    stakeMarketCoinName: string,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async unstakeAndWithdraw<S extends boolean>(
    stakeMarketCoinName: string,
    amount: number,
    sign?: S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async unstakeAndWithdraw<S extends boolean>(
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
    stakeMarketCoinName: string
  ): Promise<SuiTransactionBlockResponse>;
  public async claim<S extends boolean>(
    stakeMarketCoinName: string,
    sign?: S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async claim<S extends boolean>(
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
    const sender = walletAddress ?? this.walletAddress;
    txBlock.setSender(sender);

    await txBlock.stakeObligationWithVeScaQuick(obligationId, obligationKeyId);

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
    const sender = walletAddress ?? this.walletAddress;
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
   * Claim borrow incentive reward.
   *
   * @param poolName
   * @param amount - The amount of coins would deposit.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param accountId - The stake account object.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block
   */
  public async claimBorrowIncentive<S extends boolean>(
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
    includeStakePool: boolean = true,
    sign: S = true as S
  ): Promise<ScallopClientFnReturnType<S>> {
    const txBlock = this.builder.createTxBlock();
    txBlock.setSender(this.walletAddress);

    const toTransfer: SuiObjectArg[] = [];
    await Promise.all(
      [...this.constants.whitelist.scoin].map(async (sCoinName) => {
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
            this.utils.parseMarketCoinType(sCoinName as string),
            this.walletAddress
          ); // throw error no coins found

          toDestroyMarketCoin = marketCoins[0];
          if (marketCoins.length > 1) {
            txBlock.mergeCoins(toDestroyMarketCoin, marketCoins.slice(1));
          }
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
            sCoinName as string,
            toDestroyMarketCoin
          );

          const sCoinType = this.utils.parseSCoinType(sCoinName as string);
          if (!sCoinType) throw new Error('Invalid sCoin type');
          // Merge with existing sCoin
          await this.utils.mergeSimilarCoins(
            txBlock,
            sCoin,
            sCoinType,
            requireSender(txBlock)
          );
          sCoins.push(sCoin);
        }
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

  /* ==================== VeSCA ==================== */
  /**
   * Claim unlocked SCA from all veSCA accounts.
   */
  public async claimAllUnlockedSca(): Promise<SuiTransactionBlockResponse>;
  public async claimAllUnlockedSca<S extends boolean>(
    sign?: S
  ): Promise<ScallopClientVeScaReturnType<S>>;
  public async claimAllUnlockedSca<S extends boolean>(
    sign: S = true as S
  ): Promise<ScallopClientVeScaReturnType<S>> {
    // get all veSca keys
    const veScaKeys = (
      (await this.query.getVeScas({
        walletAddress: this.walletAddress,
      })) ?? []
    ).map(({ keyObject }) => keyObject);
    if (veScaKeys.length === 0) {
      throw new Error('No veSCA found in the wallet');
    }

    const scaCoins: TransactionResult[] = [];
    const tx = this.builder.createTxBlock();
    tx.setSender(this.walletAddress);

    await Promise.all(
      veScaKeys.map(async (key) => {
        try {
          const scaCoin = await tx.redeemScaQuick(key, false);
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
    await this.utils.mergeSimilarCoins(
      tx,
      scaCoins[0],
      'sca',
      this.walletAddress
    );

    if (sign) {
      return (await this.suiKit.signAndSendTxn(
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
  public async mintTestCoin(
    assetCoinName: Exclude<string, 'sui'>,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  public async mintTestCoin<S extends boolean>(
    assetCoinName: Exclude<string, 'sui'>,
    amount: number,
    sign?: S,
    receiveAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  public async mintTestCoin<S extends boolean>(
    assetCoinName: Exclude<string, 'sui'>,
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
    const recipient = receiveAddress ?? this.walletAddress;
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
