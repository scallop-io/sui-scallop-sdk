import { normalizeSuiAddress } from '@mysten/sui/utils';
import { SuiKit } from '@scallop-io/sui-kit';
import { ADDRESSES_ID } from '../constants';
import { newScallopTxBlock } from '../builders';
import { ScallopAddress } from './scallopAddress';
import { ScallopQuery } from './scallopQuery';
import { ScallopUtils } from './scallopUtils';
import type { SuiTransactionBlockResponse } from '@mysten/sui/client';
import type { Transaction } from '@mysten/sui/transactions';
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
  SupportMarketCoins,
  SupportAssetCoins,
  SupportSCoin,
  ScallopBuilderInstanceParams,
  SelectCoinReturnType,
} from '../types';
import { ScallopCache } from './scallopCache';
import { newSuiKit } from './suiKit';

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

    if (instance?.query) {
      this.query = instance.query;
      this.utils = this.query.utils;
      this.address = this.utils.address;
      this.cache = this.address.cache;
    } else {
      this.cache = new ScallopCache(this.params, {
        suiKit: this.suiKit,
      });
      this.address = new ScallopAddress(
        {
          id: params?.addressesId ?? ADDRESSES_ID,
          network: params?.networkType,
          forceInterface: params?.forceAddressesInterface,
        },
        {
          cache: this.cache,
        }
      );
      this.utils = new ScallopUtils(this.params, {
        address: this.address,
      });
      this.query = new ScallopQuery(
        {
          walletAddress: this.walletAddress,
        },
        {
          utils: this.utils,
        }
      );
    }
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
  public async init(force: boolean = false, address?: ScallopAddress) {
    if (address && !this.address) this.address = address;
    if (force || !this.address.getAddresses()) {
      await this.address.read();
    }
    await this.query.init(force, this.address);
    // await this.utils.init(force, this.address);
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
  public async selectCoin<T extends SupportAssetCoins>(
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
    marketCoinName: SupportMarketCoins,
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
    sCoinName: SupportSCoin,
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
    // Disable for now
    // const resolvedQueryTarget =
    //   await this.cache.queryGetNormalizedMoveFunction(target);
    // if (!resolvedQueryTarget) throw new Error('Invalid query target');

    // const { parameters } = resolvedQueryTarget;
    // try {
    //   // we can try resolve the args first
    //   const resolvedArgs = await Promise.all(
    //     (args ?? []).map(async (arg, idx) => {
    //       if (typeof arg !== 'string') return arg;

    //       const cachedData = (await this.cache.queryGetObject(arg))?.data;
    //       if (!cachedData) return arg;

    //       const owner = cachedData.owner;
    //       if (!owner || typeof owner !== 'object' || !('Shared' in owner))
    //         return {
    //           objectId: cachedData.objectId,
    //           version: cachedData.version,
    //           digest: cachedData.digest,
    //         };

    //       const parameter = parameters[idx];
    //       if (
    //         typeof parameter !== 'object' ||
    //         !('MutableReference' in parameter || 'Reference' in parameter)
    //       )
    //         return arg;

    //       return {
    //         objectId: cachedData.objectId,
    //         initialSharedVersion: owner.Shared.initial_shared_version,
    //         mutable: 'MutableReference' in parameter,
    //       };
    //     })
    //   );
    //   return txb.moveCall(target, resolvedArgs, typeArgs);
    // } catch (e: any) {
    //   console.error(e.message);
    //   return txb.moveCall(target, args, typeArgs);
    // }
    return txb.moveCall(target, args, typeArgs);
  }
}
