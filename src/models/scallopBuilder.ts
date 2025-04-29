import { newScallopTxBlock } from '../builders';
import ScallopQuery, { ScallopQueryParams } from './scallopQuery';
import type { SuiTransactionBlockResponse } from '@mysten/sui/client';
import type {
  Transaction,
  TransactionObjectArgument,
} from '@mysten/sui/transactions';
import type {
  SuiAmountsArg,
  SuiTxBlock as SuiKitTxBlock,
  SuiObjectArg,
  SuiTxArg,
  SuiVecTxArg,
} from '@scallop-io/sui-kit';
import type { ScallopTxBlock, SelectCoinReturnType } from '../types';
import { ScallopBuilderInterface } from './interface';

export type ScallopBuilderParams = {
  query?: ScallopQuery;
  usePythPullModel?: boolean;
  useOnChainXOracleList?: boolean;
} & ScallopQueryParams;

/**
 * @description
 * It provides methods for operating the transaction block, making it more convenient to organize transaction combinations.
 *
 * @example
 * ```typescript
 * const scallopBuilder = new ScallopBuilder(<parameters>);
 * await scallopBuilder.init();
 * const txBlock = scallopBuilder.<builder functions>();
 * ```
 */
class ScallopBuilder implements ScallopBuilderInterface {
  public readonly query: ScallopQuery;
  public readonly usePythPullModel: boolean;
  public readonly useOnChainXOracleList: boolean;

  public constructor(params: ScallopBuilderParams) {
    this.query = params.query ?? new ScallopQuery(params);
    this.usePythPullModel = params.usePythPullModel ?? true;
    this.useOnChainXOracleList = params.useOnChainXOracleList ?? true;
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

  get suiKit() {
    return this.scallopSuiKit.suiKit;
  }

  get address() {
    return this.utils.address;
  }

  /**
   * Request the scallop API to initialize data.
   *
   * @param force - Whether to force initialization.
   */
  async init(force: boolean = false) {
    await this.query.init(force);
  }

  /**
   * Create a scallop txBlock instance that enhances transaction block.
   *
   * @param txBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
   * @return Scallop txBlock.
   */
  createTxBlock(txBlock?: ScallopTxBlock | SuiKitTxBlock | Transaction) {
    return newScallopTxBlock(this, txBlock);
  }

  /**
   * Specifying the sender's amount of coins to get coins args from transaction result.
   *
   * @param txBlock - Scallop txBlock or txBlock created by SuiKit .
   * @param assetCoinName - Specific support asset coin name.
   * @param amount - Amount of coins to be selected.
   * @param sender - Sender address.
   * @return Take coin and left coin.
   */
  public async selectCoin<T extends string>(
    txBlock: ScallopTxBlock | SuiKitTxBlock,
    assetCoinName: T,
    amount: number,
    sender: string = this.walletAddress
  ): Promise<SelectCoinReturnType<T>> {
    if (assetCoinName === 'sui') {
      const [takeCoin] = txBlock.splitSUIFromGas([amount]);
      return { takeCoin } as SelectCoinReturnType<T>;
    } else {
      const coinType = this.utils.parseCoinType(assetCoinName);
      const coins = await this.utils.selectCoins(amount, coinType, sender);
      const [takeCoin, leftCoin] = txBlock.takeAmountFromCoins(coins, amount);
      return { takeCoin, leftCoin } as SelectCoinReturnType<T>;
    }
  }

  /**
   * Specifying the sender's amount of market coins to get coins args from transaction result.
   *
   * @param txBlock - Scallop txBlock or txBlock created by SuiKit .
   * @param marketCoinName - Specific support market coin name.
   * @param amount - Amount of coins to be selected.
   * @param sender - Sender address.
   * @return Take coin and left coin.
   */
  public async selectMarketCoin(
    txBlock: ScallopTxBlock | SuiKitTxBlock,
    marketCoinName: string,
    amount: number,
    sender: string = this.walletAddress
  ) {
    const marketCoinType = this.utils.parseMarketCoinType(marketCoinName);
    const coins = await this.utils.selectCoins(amount, marketCoinType, sender);
    const totalAmount = coins.reduce((prev, coin) => {
      prev += Number(coin.balance);
      return prev;
    }, 0);
    const [takeCoin, leftCoin] = txBlock.takeAmountFromCoins(
      coins,
      Math.min(amount, totalAmount)
    );
    return { takeCoin, leftCoin, totalAmount };
  }

  /**
   * Specifying the sender's amount of sCoins to get coins args from transaction result.
   *
   * @param txBlock - Scallop txBlock or txBlock created by SuiKit .
   * @param marketCoinName - Specific support sCoin name.
   * @param amount - Amount of coins to be selected.
   * @param sender - Sender address.
   * @return Take coin and left coin.
   */
  public async selectSCoin(
    txBlock: ScallopTxBlock | SuiKitTxBlock,
    sCoinName: string,
    amount: number,
    sender: string = this.walletAddress
  ) {
    const sCoinType = this.utils.parseSCoinType(sCoinName);
    const coins = await this.utils.selectCoins(amount, sCoinType, sender);
    const totalAmount = coins.reduce((prev, coin) => {
      prev += Number(coin.balance);
      return prev;
    }, 0);
    const [takeCoin, leftCoin] = txBlock.takeAmountFromCoins(
      coins,
      Math.min(totalAmount, amount)
    );
    return {
      takeCoin,
      leftCoin,
      totalAmount,
    };
  }

  /**
   * Select sCoin or market coin automatically. Prioritize sCoin first
   */
  public async selectSCoinOrMarketCoin(
    txBlock: ScallopTxBlock | SuiKitTxBlock,
    sCoinName: string,
    amount: number,
    sender: string = this.walletAddress
  ) {
    let totalAmount = amount;
    const result = {
      sCoins: [] as TransactionObjectArgument[],
      marketCoins: [] as TransactionObjectArgument[],
      leftCoins: [] as TransactionObjectArgument[],
    };
    try {
      // try sCoin first
      const {
        leftCoin,
        takeCoin,
        totalAmount: sCoinAmount,
      } = await this.selectSCoin(txBlock, sCoinName, totalAmount, sender);
      result.leftCoins.push(leftCoin);
      result.sCoins.push(takeCoin);
      totalAmount -= sCoinAmount;

      if (totalAmount > 0) {
        // sCoin is not enough, try market coin
        const { leftCoin, takeCoin: marketCoin } = await this.selectMarketCoin(
          txBlock,
          sCoinName,
          amount,
          sender
        );
        txBlock.transferObjects([leftCoin], sender);
        result.marketCoins.push(marketCoin);
      }
    } catch (_e) {
      // no sCoin, try market coin
      const { takeCoin: marketCoin, leftCoin } = await this.selectMarketCoin(
        txBlock,
        sCoinName,
        amount,
        sender
      );
      result.leftCoins.push(leftCoin);
      result.marketCoins.push(marketCoin);
    }

    txBlock.transferObjects(result.leftCoins, sender);

    // merge sCoins and marketCoins
    const mergedMarketCoins =
      result.marketCoins.length > 0
        ? result.marketCoins.length > 1
          ? txBlock.mergeCoins(
              result.marketCoins[0],
              result.marketCoins.slice(1)
            )
          : result.marketCoins[0]
        : undefined;
    const mergedSCoins =
      result.sCoins.length > 0
        ? result.sCoins.length > 1
          ? txBlock.mergeCoins(result.sCoins[0], result.sCoins.slice(1))
          : result.sCoins[0]
        : undefined;
    return {
      sCoin: mergedSCoins,
      marketCoin: mergedMarketCoins,
    };
  }

  /**
   * Execute Scallop txBlock using the `signAndSendTxn` methods in suikit.
   *
   * @param txBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
   */
  public async signAndSendTxBlock(
    txBlock: ScallopTxBlock | SuiKitTxBlock | Transaction
  ) {
    return (await this.scallopSuiKit.suiKit.signAndSendTxn(
      txBlock
    )) as SuiTransactionBlockResponse;
  }

  public moveCall(
    txb: ScallopTxBlock | SuiKitTxBlock,
    target: string,
    args?: (SuiTxArg | SuiVecTxArg | SuiObjectArg | SuiAmountsArg)[],
    typeArgs?: string[]
  ) {
    return txb.moveCall(target, args, typeArgs);
  }
}

export default ScallopBuilder;
