import type { TransactionObjectArgument } from '@mysten/sui/transactions';
import type {
  NetworkType,
  SuiObjectArg,
  SuiTransactionBlockResponse,
} from '@scallop-io/sui-kit';
import {
  BorrowService,
  CollateralService,
  LendingService,
  ReferralService,
  SpoolService,
  VeScaService,
} from 'src/services/index.js';
import type { ScallopTxBlock } from '../../types/index.js';
import { ScallopClientInterface } from '../interface.js';
import ScallopBuilder from '../scallopBuilder/index.js';
import {
  ScallopClientConstructorParams,
  ScallopClientFnReturnType,
  ScallopClientVeScaReturnType,
} from './types.js';

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
  public readonly collateralService: CollateralService;
  public readonly lendingService: LendingService;
  public readonly borrowService: BorrowService;
  public readonly spoolService: SpoolService;
  public readonly veScaService: VeScaService;
  public readonly referralService: ReferralService;
  public networkType: NetworkType;

  public constructor({
    builder,
    networkType,
    ...scallopBuilderArgs
  }: ScallopClientConstructorParams) {
    this.builder = builder ?? new ScallopBuilder(scallopBuilderArgs);
    this.collateralService = new CollateralService(this);
    this.lendingService = new LendingService(this);
    this.borrowService = new BorrowService(this);
    this.spoolService = new SpoolService(this);
    this.veScaService = new VeScaService(this);
    this.referralService = new ReferralService(this);
    this.networkType = networkType ?? 'mainnet';
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

  get suiKit() {
    return this.builder.suiKit;
  }

  get grpc() {
    return this.query.grpc;
  }

  get executor() {
    return this.builder.executor;
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
    return this.borrowService.openObligation(sign) as Promise<
      ScallopClientFnReturnType<S>
    >;
  }

  /**
   * Deposit collateral into the specific pool.
   *
   * @param collateralCoinName - Types of collateral coin.
   * @param amount - The amount of coins would deposit.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param obligationId - The obligation object.
   * @param walletAddress - The wallet address of the owner.
   * @param isSponsoredTx - Whether the transaction is sponsored.
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
    walletAddress?: string,
    isSponsoredTx?: boolean
  ): Promise<ScallopClientFnReturnType<S>>;
  async depositCollateral<S extends boolean>(
    collateralCoinName: string,
    amount: number,
    sign: S = true as S,
    obligationId?: string,
    walletAddress?: string,
    isSponsoredTx?: boolean
  ): Promise<ScallopClientFnReturnType<S>> {
    return this.collateralService.depositCollateral(
      collateralCoinName,
      amount,
      sign,
      obligationId,
      walletAddress,
      isSponsoredTx
    ) as Promise<ScallopClientFnReturnType<S>>;
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
   * @param isSponsoredTx - Whether the transaction is sponsored.
   * @return Transaction block response or transaction block.
   */
  async withdrawCollateral(
    collateralCoinName: string,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;

  async withdrawCollateral<S extends boolean>(
    collateralCoinName: string,
    amount: number,
    sign?: S,
    obligationId?: string,
    obligationKey?: string,
    walletAddress?: string,
    isSponsoredTx?: boolean
  ): Promise<ScallopClientFnReturnType<S>>;

  async withdrawCollateral<S extends boolean>(
    collateralCoinName: string,
    amount: number,
    sign: S = true as S,
    obligationId?: string,
    obligationKey?: string,
    walletAddress?: string,
    isSponsoredTx?: boolean
  ): Promise<ScallopClientFnReturnType<S>> {
    return this.collateralService.withdrawCollateral(
      collateralCoinName,
      amount,
      sign,
      obligationId,
      obligationKey,
      walletAddress,
      isSponsoredTx
    ) as Promise<ScallopClientFnReturnType<S>>;
  }

  /**
   * Supply asset into the specific lending pool.
   *
   * @param poolCoinName - Types of pool coin.
   * @param amount - The amount of coins would deposit.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block.
   */
  async supply(
    poolCoinName: string,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  async supply<S extends boolean>(
    poolCoinName: string,
    amount: number,
    sign?: S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  async supply<S extends boolean>(
    poolCoinName: string,
    amount: number,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    return this.lendingService.supply(
      poolCoinName,
      amount,
      sign,
      walletAddress
    ) as Promise<ScallopClientFnReturnType<S>>;
  }

  /**
   * Supply asset into the specific lending pool and stake market coin into the corresponding staking pool (spool).
   *
   * @param stakeCoinName - Types of stake coin.
   * @param amount - The amount of coins would supply.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param stakeAccountId - The stake account object.
   * @param walletAddress - The wallet address of the owner.
   * @return Transaction block response or transaction block.
   */
  async supplyAndStake(
    stakeCoinName: string,
    amount: number
  ): Promise<SuiTransactionBlockResponse>;
  async supplyAndStake<S extends boolean>(
    stakeCoinName: string,
    amount: number,
    sign?: S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>>;
  async supplyAndStake<S extends boolean>(
    stakeCoinName: string,
    amount: number,
    sign: S = true as S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ScallopClientFnReturnType<S>> {
    return this.borrowService.supplyAndStake(
      stakeCoinName,
      amount,
      sign,
      stakeAccountId,
      walletAddress
    ) as Promise<ScallopClientFnReturnType<S>>;
  }

  /**
   * Withdraw asset from the specific lending pool, must return market coin.
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
    return this.lendingService.withdraw(
      poolCoinName,
      amount,
      sign,
      walletAddress
    ) as Promise<ScallopClientFnReturnType<S>>;
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
   * @param isSponsoredTx - Whether the transaction is sponsored.
   * @return Transaction block response or transaction block.
   */
  async borrow<S extends boolean>(
    poolCoinName: string,
    amount: number,
    sign: S = true as S,
    obligationId: string,
    obligationKey: string,
    walletAddress?: string,
    isSponsoredTx?: boolean
  ): Promise<ScallopClientFnReturnType<S>> {
    return this.borrowService.borrow(
      poolCoinName,
      amount,
      sign,
      obligationId,
      obligationKey,
      walletAddress,
      isSponsoredTx
    ) as Promise<ScallopClientFnReturnType<S>>;
  }

  /**
   * Repay asset into the specific pool.
   *
   * @param poolCoinName - Specific support pool coin name.
   * @param amount - The amount of coins would repay.
   * @param sign - Decide to directly sign the transaction or return the transaction block.
   * @param obligationId - The obligation object.
   * @param walletAddress - The wallet address of the owner.
   * @param isSponsoredTx - Whether the transaction is sponsored.
   * @return Transaction block response or transaction block.
   */
  async repay<S extends boolean>(
    poolCoinName: string,
    amount: number,
    sign: S = true as S,
    obligationId: string,
    obligationKey: string,
    walletAddress?: string,
    isSponsoredTx?: boolean
  ): Promise<ScallopClientFnReturnType<S>> {
    return this.borrowService.repay(
      poolCoinName,
      amount,
      sign,
      obligationId,
      obligationKey,
      walletAddress,
      isSponsoredTx
    ) as Promise<ScallopClientFnReturnType<S>>;
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
    return this.lendingService.flashLoan(
      poolCoinName,
      amount,
      callback,
      sign,
      walletAddress
    ) as Promise<ScallopClientFnReturnType<S>>;
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
    return this.spoolService.createStakeAccount(
      marketCoinName,
      sign,
      walletAddress
    ) as Promise<ScallopClientFnReturnType<S>>;
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
    return this.spoolService.stake(
      stakeMarketCoinName,
      amount,
      sign,
      stakeAccountId,
      walletAddress
    ) as Promise<ScallopClientFnReturnType<S>>;
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
    return this.spoolService.unstake(
      stakeMarketCoinName,
      amount,
      sign,
      stakeAccountId,
      walletAddress
    ) as Promise<ScallopClientFnReturnType<S>>;
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
    return this.spoolService.unstakeAndWithdraw(
      stakeMarketCoinName,
      amount,
      sign,
      stakeAccountId,
      walletAddress
    ) as Promise<ScallopClientFnReturnType<S>>;
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
    return this.spoolService.claim(
      stakeMarketCoinName,
      sign,
      stakeAccountId,
      walletAddress
    ) as Promise<ScallopClientFnReturnType<S>>;
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
    return this.borrowService.stakeObligation(
      obligationId,
      obligationKeyId,
      sign,
      walletAddress
    ) as Promise<ScallopClientFnReturnType<S>>;
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
    return this.borrowService.unstakeObligation(
      obligationId,
      obligationKeyId,
      sign,
      walletAddress
    ) as Promise<ScallopClientFnReturnType<S>>;
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
    return this.borrowService.claimBorrowIncentive(
      obligationId,
      obligationKeyId,
      sign,
      walletAddress
    ) as Promise<ScallopClientFnReturnType<S>>;
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
      return (await this.executor.signAndSendTxn(
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
    return this.veScaService.claimAllUnlockedSca(
      sign,
      walletAddress
    ) as Promise<ScallopClientVeScaReturnType<S>>;
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
      return (await this.executor.signAndSendTxn(
        txBlock
      )) as ScallopClientFnReturnType<S>;
    } else {
      return txBlock.txBlock as ScallopClientFnReturnType<S>;
    }
  }
}

export default ScallopClient;
