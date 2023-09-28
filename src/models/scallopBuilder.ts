import { normalizeSuiAddress } from '@mysten/sui.js/utils';
import { SuiKit } from '@scallop-io/sui-kit';
import { ScallopAddress } from './scallopAddress';
import { ScallopQuery } from './scallopQuery';
import { ScallopUtils } from './scallopUtils';
import { ADDRESSES_ID } from '../constants';
import { newScallopTxBlock } from '../builders';
import type { SuiTransactionBlockResponse } from '@mysten/sui.js/client';
import type { TransactionBlock } from '@mysten/sui.js/transactions';
import type { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import type {
  ScallopInstanceParams,
  ScallopBuilderParams,
  ScallopTxBlock,
  SupportCoins,
} from '../types';

/**
 * @description
 * it provides methods for operating the transaction block, making it more convenient to organize transaction combinations.
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
  public query: ScallopQuery;
  public utils: ScallopUtils;
  public walletAddress: string;

  public constructor(
    params: ScallopBuilderParams,
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
      new ScallopUtils(this.params, {
        suiKit: this.suiKit,
        address: this.address,
        query: this.query,
      });
    this.walletAddress = normalizeSuiAddress(
      params?.walletAddress || this.suiKit.currentAddress()
    );
    this.isTestnet = params.networkType
      ? params.networkType === 'testnet'
      : false;
  }

  /**
   * Request the scallop API to initialize data.
   *
   * @param forece Whether to force initialization.
   */
  public async init(forece: boolean = false) {
    if (forece || !this.address.getAddresses()) {
      await this.address.read();
    }
    await this.query.init(forece);
    await this.utils.init(forece);
  }

  /**
   * Create a scallop txBlock instance that enhances transaction block.
   *
   * @param txBlock Scallop txBlock, txBlock created by SuiKit, or original transaction block.
   * @return Scallop txBlock.
   */
  public createTxBlock(
    txBlock?: ScallopTxBlock | SuiKitTxBlock | TransactionBlock
  ) {
    return newScallopTxBlock(this, txBlock);
  }

  /**
   * Specifying the sender's amount of coins to get coins args from transaction result.
   *
   * @param txBlock Scallop txBlock or txBlock created by SuiKit .
   * @param coinName Specific support coin name.
   * @param amount Amount of coins to be selected.
   * @param sender Sender address.
   * @return Take coin and left coin.
   */
  public async selectCoin(
    txBlock: ScallopTxBlock | SuiKitTxBlock,
    coinName: SupportCoins,
    amount: number,
    sender: string
  ) {
    const coinType = this.utils.parseCoinType(coinName);
    const coins = await this.utils.selectCoins(sender, amount, coinType);
    const [takeCoin, leftCoin] = txBlock.takeAmountFromCoins(coins, amount);
    return { takeCoin, leftCoin };
  }

  /**
   * Specifying the sender's amount of market coins to get coins args from transaction result.
   *
   * @param txBlock Scallop txBlock or txBlock created by SuiKit .
   * @param coinName Specific support coin name.
   * @param amount Amount of coins to be selected.
   * @param sender Sender address.
   * @return Take coin and left coin.
   */
  public async selectMarketCoin(
    txBlock: ScallopTxBlock | SuiKitTxBlock,
    coinName: SupportCoins,
    amount: number,
    sender: string
  ) {
    const coinType = this.utils.parseMarketCoinType(coinName);
    const coins = await this.utils.selectCoins(sender, amount, coinType);
    const [takeCoin, leftCoin] = txBlock.takeAmountFromCoins(coins, amount);
    return { takeCoin, leftCoin };
  }

  /**
   * Execute Scallop txBlock using the `signAndSendTxn` methods in suikit.
   *
   * @param txBlock Scallop txBlock, txBlock created by SuiKit, or original transaction block.
   */
  public async signAndSendTxBlock(
    txBlock: ScallopTxBlock | SuiKitTxBlock | TransactionBlock
  ) {
    return (await this.suiKit.signAndSendTxn(
      txBlock
    )) as SuiTransactionBlockResponse;
  }
}
