import { newScallopTxBlock } from '../../txBuilders/index.js';
import { SuiKit, SuiTransactionBlockResponse } from '@scallop-io/sui-kit';
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
import type { ScallopTxBlock } from '../../types/index.js';
import { ScallopBuilderInterface } from '../interface.js';
import {
  SuiKitTransactionExecutor,
  TransactionExecutor,
} from '../transactionExecutor.js';
import ScallopQuery from '../scallopQuery/index.js';
import type { ScallopQueryConstructorParams } from '../scallopQuery/types.js';
import { ScallopBuilderConstructorParams } from './types.js';
import { DEFAULT_PYTH_URL } from 'src/repositories/price/const.js';
import { coinWithBalance } from '@mysten/sui/transactions';
/**
 * @descriptionr
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
  public readonly sponsoredFeeds: string[];
  public readonly suiKit: SuiKit;
  public readonly pythEndpoint: string;
  /** Pyth (Hermes) API access token, forwarded to the pyth oracle rule. */
  public readonly pythApiKey?: string;

  public constructor({
    usePythPullModel = true,
    useOnChainXOracleList = true,
    sponsoredFeeds = [],
    query,
    pythEndpoints,
    pythEndpoint = pythEndpoints?.[0] ?? DEFAULT_PYTH_URL,
    ...scallopQueryArgs
  }: ScallopBuilderConstructorParams) {
    this.pythEndpoint = pythEndpoint;
    this.suiKit = new SuiKit({
      ...scallopQueryArgs,
      ...(scallopQueryArgs.fullnodeUrl
        ? { fullnodeUrls: [scallopQueryArgs.fullnodeUrl] }
        : {}),
    });
    this.query =
      query ??
      // Cast: object spread widens the `readTransport` discriminant, so TS can no
      // longer prove the `SuiGrpcTransport | SuiGraphqlTransport` union here even
      // though the incoming params were validated at the public entry point.
      new ScallopQuery({
        ...scallopQueryArgs,
        pythEndpoint,
        walletAddress:
          scallopQueryArgs.walletAddress ?? this.suiKit.currentAddress,
      } as ScallopQueryConstructorParams);
    this.usePythPullModel = usePythPullModel;
    this.useOnChainXOracleList = useOnChainXOracleList;
    this.sponsoredFeeds = sponsoredFeeds;
    this.pythApiKey = scallopQueryArgs.pythApiKey;
  }

  /**
   * The SDK-agnostic write-path signer/executor, memoised. Built from the raw
   * `SuiKit`; all write callers go through this rather than touching the SDK
   * directly, so the underlying SDK can be swapped in one place.
   */
  private _executor?: TransactionExecutor;
  get executor(): TransactionExecutor {
    return (this._executor ??= new SuiKitTransactionExecutor(this.suiKit));
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

  get coreClient() {
    return this.query.coreClient;
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
   * @param isSponsored - Whether the transaction is a sponsored transaction.
   * @return Take coin and left coin.
   */
  async selectCoin(
    _txBlock: ScallopTxBlock | SuiKitTxBlock,
    assetCoinName: string,
    amount: number,
    _sender: string = this.walletAddress,
    isSponsored: boolean = false
  ) {
    if (assetCoinName === 'sui' && !isSponsored) {
      return {
        takeCoin: coinWithBalance({ balance: amount, useGasCoin: true }),
      };
    } else {
      const coinType = this.utils.parseCoinType(assetCoinName);

      return { takeCoin: coinWithBalance({ type: coinType, balance: amount }) };
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
  async selectMarketCoin(
    _txBlock: ScallopTxBlock | SuiKitTxBlock,
    marketCoinName: string,
    amount: number,
    sender: string = this.walletAddress
  ) {
    const marketCoinType = this.utils.parseMarketCoinType(marketCoinName);
    const { balance } = await this.utils.client.getBalance({
      owner: sender,
      coinType: marketCoinType,
    });
    return {
      takeCoin: coinWithBalance({ type: marketCoinType, balance: amount }),
      totalAmount: +balance,
    };
  }

  /**
   * Specifying the sender's amount of sCoins to get coins args from transaction result.
   *
   * @param txBlock - Scallop txBlock or txBlock created by SuiKit .
   * @param sCoinName - Specific support sCoin name.
   * @param amount - Amount of coins to be selected.
   * @param sender - Sender address.
   * @return Take coin and left coin.
   */
  async selectSCoin(
    _txBlock: ScallopTxBlock | SuiKitTxBlock,
    sCoinName: string,
    amount: number,
    sender: string = this.walletAddress
  ) {
    const sCoinType = this.utils.parseSCoinType(sCoinName);
    const { balance } = await this.utils.client.getBalance({
      owner: sender,
      coinType: sCoinType,
    });
    return {
      takeCoin: coinWithBalance({ type: sCoinType, balance: amount }),
      totalAmount: +balance,
    };
  }

  /**
   * Select sCoin or market coin automatically. Prioritize sCoin first
   */
  async selectSCoinOrMarketCoin(
    txBlock: ScallopTxBlock | SuiKitTxBlock,
    sCoinName: string,
    amount: number,
    sender: string = this.walletAddress
  ) {
    let totalAmount = amount;
    const result = {
      sCoins: [] as TransactionObjectArgument[],
      marketCoins: [] as TransactionObjectArgument[],
    };
    try {
      // try sCoin first
      const { takeCoin, totalAmount: sCoinAmount } = await this.selectSCoin(
        txBlock,
        sCoinName,
        totalAmount,
        sender
      );
      result.sCoins.push(takeCoin);
      totalAmount -= sCoinAmount;

      if (totalAmount > 0) {
        // sCoin is not enough, try market coin
        const { takeCoin: marketCoin } = await this.selectMarketCoin(
          txBlock,
          sCoinName,
          amount,
          sender
        );
        result.marketCoins.push(marketCoin);
      }
    } catch (_e) {
      // no sCoin, try market coin
      const { takeCoin: marketCoin } = await this.selectMarketCoin(
        txBlock,
        sCoinName,
        amount,
        sender
      );
      result.marketCoins.push(marketCoin);
    }

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
  async signAndSendTxBlock(
    txBlock: ScallopTxBlock | SuiKitTxBlock | Transaction
  ) {
    return (await this.executor.signAndSendTxn(
      txBlock
    )) as SuiTransactionBlockResponse;
  }

  public moveCall(
    txb: ScallopTxBlock | SuiKitTxBlock,
    target: string,
    args?: (SuiTxArg | SuiVecTxArg | SuiObjectArg | SuiAmountsArg)[],
    typeArgs?: string[]
  ) {
    return txb.moveCall(target, args as any, typeArgs);
  }
}

export default ScallopBuilder;
