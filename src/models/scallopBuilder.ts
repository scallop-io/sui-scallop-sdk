import { normalizeSuiAddress } from '@mysten/sui/utils';
import { SuiKit } from '@scallop-io/sui-kit';
import { newScallopTxBlock } from '../builders';
import { ScallopAddress } from './scallopAddress';
import { ScallopQuery } from './scallopQuery';
import { ScallopUtils } from './scallopUtils';
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
import type {
  ScallopBuilderParams,
  ScallopTxBlock,
  ScallopBuilderInstanceParams,
  SelectCoinReturnType,
} from '../types';
import { ScallopCache } from './scallopCache';
import { newSuiKit } from './suiKit';
import { ScallopConstants } from './scallopConstants';

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
export class ScallopBuilder {
  public readonly params: ScallopBuilderParams;
  public readonly isTestnet: boolean;

  public suiKit: SuiKit;
  public address: ScallopAddress;
  public constants: ScallopConstants;
  public query: ScallopQuery;
  public utils: ScallopUtils;
  public walletAddress: string;
  public cache: ScallopCache;

  public constructor(
    params: ScallopBuilderParams,
    instance?: ScallopBuilderInstanceParams
  ) {
    this.suiKit = instance?.suiKit ?? newSuiKit(params);

    this.params = params;
    this.walletAddress = normalizeSuiAddress(
      params?.walletAddress ?? this.suiKit.currentAddress()
    );

    this.cache =
      instance?.query?.cache ??
      new ScallopCache(this.params, {
        suiKit: this.suiKit,
      });

    this.address =
      instance?.query?.address ??
      new ScallopAddress(this.params, {
        cache: this.cache,
      });

    this.constants =
      instance?.query?.constants ??
      new ScallopConstants(this.params, {
        address: this.address,
      });

    this.utils =
      instance?.query?.utils ??
      new ScallopUtils(this.params, {
        constants: this.constants,
      });

    this.query =
      instance?.query ??
      new ScallopQuery(this.params, {
        utils: this.utils,
      });

    this.isTestnet = params.networkType
      ? params.networkType === 'testnet'
      : false;
  }

  /**
   * Request the scallop API to initialize data.
   *
   * @param force - Whether to force initialization.
   * @param address - ScallopAddress instance.
   */
  public async init(force: boolean = false) {
    if (force || !this.constants.isInitialized) {
      await this.constants.init();
    }
    await this.query.init(force);
  }

  /**
   * Create a scallop txBlock instance that enhances transaction block.
   *
   * @param txBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
   * @return Scallop txBlock.
   */
  public createTxBlock(txBlock?: ScallopTxBlock | SuiKitTxBlock | Transaction) {
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
    return (await this.suiKit.signAndSendTxn(
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
