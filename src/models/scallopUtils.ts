import { SUI_TYPE_ARG, normalizeStructTag } from '@mysten/sui.js/utils';
import { SuiAddressArg, SuiKit } from '@scallop-io/sui-kit';
import { SuiPriceServiceConnection } from '@pythnetwork/pyth-sui-js';
import { ScallopAddress } from './scallopAddress';
import { ScallopQuery } from './scallopQuery';
import {
  ADDRESSES_ID,
  PROTOCOL_OBJECT_ID,
  SUPPORT_POOLS,
  SUPPORT_COLLATERALS,
  rewardCoins,
  coinDecimals,
  wormholeCoinIds,
  voloCoinIds,
  coinIds,
} from '../constants';
import { queryObligation } from '../queries';
import {
  parseDataFromPythPriceFeed,
  isMarketCoin,
  parseAssetSymbol,
} from '../utils';
import type {
  ScallopUtilsParams,
  ScallopInstanceParams,
  SupportCoins,
  SupportAssetCoins,
  SupportMarketCoins,
  SupportStakeMarketCoins,
  CoinPrices,
  PriceMap,
  CoinWrappedType,
} from '../types';

/**
 * @description
 * Integrates some helper functions frequently used in interactions with the Scallop contract.
 *
 * @example
 * ```typescript
 * const scallopUtils  = new ScallopUtils(<parameters>);
 * await scallopUtils.init();
 * scallopUtils.<utils functions>();
 * await scallopUtils.<utils functions>();
 * ```
 */
export class ScallopUtils {
  public readonly params: ScallopUtilsParams;
  public readonly isTestnet: boolean;

  private _suiKit: SuiKit;
  private _address: ScallopAddress;
  private _query: ScallopQuery;
  private _priceMap: PriceMap = new Map();

  public constructor(
    params: ScallopUtilsParams,
    instance?: ScallopInstanceParams
  ) {
    this.params = params;
    this._suiKit = instance?.suiKit ?? new SuiKit(params);
    this._address =
      instance?.address ??
      new ScallopAddress({
        id: params?.addressesId || ADDRESSES_ID,
        network: params?.networkType,
      });
    this._query =
      instance?.query ??
      new ScallopQuery(params, {
        suiKit: this._suiKit,
        address: this._address,
      });
    this.isTestnet = params.networkType
      ? params.networkType === 'testnet'
      : false;
  }

  /**
   * Request the scallop API to initialize data.
   *
   * @param forece - Whether to force initialization.
   */
  public async init(forece: boolean = false) {
    if (forece || !this._address.getAddresses()) {
      await this._address.read();
    }
    await this._query.init(forece);
  }

  /**
   * Convert coin name to symbol.
   *
   * @param coinName - Specific support coin name.
   * @return Symbol string.
   */
  public parseSymbol(coinName: SupportCoins) {
    if (isMarketCoin(coinName)) {
      const assetCoinName = coinName
        .slice(1)
        .toLowerCase() as SupportAssetCoins;
      return (
        coinName.slice(0, 1).toLowerCase() + parseAssetSymbol(assetCoinName)
      );
    } else {
      return parseAssetSymbol(coinName);
    }
  }

  /**
   * Convert coin name to coin type.
   *
   * @description
   * The Coin type of wormhole is fixed `coin:Coin`. Here using package id
   * to determine and return the type.
   *
   * @param coinPackageId - Package id of coin.
   * @param coinName - Specific support coin name.
   * @return Coin type.
   */
  public parseCoinType(coinName: SupportCoins) {
    coinName = isMarketCoin(coinName) ? this.parseCoinName(coinName) : coinName;
    const coinPackageId =
      this._address.get(`core.coins.${coinName}.id`) ||
      coinIds[coinName] ||
      undefined;
    if (!coinPackageId) {
      throw Error(`Coin ${coinName} is not supported`);
    }
    if (coinName === 'sui')
      return normalizeStructTag(`${coinPackageId}::sui::SUI`);
    const wormHolePckageIds = [
      this._address.get('core.coins.usdc.id') ?? wormholeCoinIds.usdc,
      this._address.get('core.coins.usdt.id') ?? wormholeCoinIds.usdt,
      this._address.get('core.coins.eth.id') ?? wormholeCoinIds.eth,
      this._address.get('core.coins.btc.id') ?? wormholeCoinIds.btc,
      this._address.get('core.coins.sol.id') ?? wormholeCoinIds.sol,
      this._address.get('core.coins.apt.id') ?? wormholeCoinIds.apt,
    ];
    const voloPckageIds = [
      this._address.get('core.coins.vsui.id') ?? voloCoinIds.vsui,
    ];
    if (wormHolePckageIds.includes(coinPackageId)) {
      return `${coinPackageId}::coin::COIN`;
    } else if (voloPckageIds.includes(coinPackageId)) {
      return `${coinPackageId}::cert::CERT`;
    } else {
      return `${coinPackageId}::${coinName}::${coinName.toUpperCase()}`;
    }
  }

  /**
   * Convert coin name to market coin type.
   *
   * @param coinPackageId - Package id of coin.
   * @param coinName - Specific support coin name.
   * @return Market coin type.
   */
  public parseMarketCoinType(coinName: SupportCoins) {
    const coinType = this.parseCoinType(coinName);
    return `${PROTOCOL_OBJECT_ID}::reserve::MarketCoin<${coinType}>`;
  }

  /**
   * Convert coin type to coin name.
   *
   * @description
   * The coin name cannot be obtained directly from the wormhole type. Here
   * the package id is used to determine and return a specific name.
   *
   * @param coinType - Specific support coin type.
   * @return Coin Name.
   */
  public parseCoinNameFromType<T extends SupportAssetCoins>(
    coinType: string
  ): T extends SupportAssetCoins ? T : SupportAssetCoins;
  public parseCoinNameFromType<T extends SupportMarketCoins>(
    coinType: string
  ): T extends SupportMarketCoins ? T : SupportMarketCoins;
  public parseCoinNameFromType<T extends SupportCoins>(
    coinType: string
  ): T extends SupportCoins ? T : SupportCoins;
  public parseCoinNameFromType(coinType: string) {
    coinType = normalizeStructTag(coinType);
    const coinTypeRegex = new RegExp(`((0x[^:]+::[^:]+::[^<>]+))(?![^<>]*<)`);
    const coinTypeMatch = coinType.match(coinTypeRegex);
    const isMarketCoinType = coinType.includes('reserve::MarketCoin');
    coinType = coinTypeMatch?.[1] || coinType;

    const wormHoleCoinTypeMap: Record<string, SupportAssetCoins> = {
      [`${
        this._address.get('core.coins.usdc.id') ?? wormholeCoinIds.usdc
      }::coin::COIN`]: 'usdc',
      [`${
        this._address.get('core.coins.usdt.id') ?? wormholeCoinIds.usdt
      }::coin::COIN`]: 'usdt',
      [`${
        this._address.get('core.coins.eth.id') ?? wormholeCoinIds.eth
      }::coin::COIN`]: 'eth',
      [`${
        this._address.get('core.coins.btc.id') ?? wormholeCoinIds.btc
      }::coin::COIN`]: 'btc',
      [`${
        this._address.get('core.coins.sol.id') ?? wormholeCoinIds.sol
      }::coin::COIN`]: 'sol',
      [`${
        this._address.get('core.coins.apt.id') ?? wormholeCoinIds.apt
      }::coin::COIN`]: 'apt',
    };
    const voloCoinTypeMap: Record<string, SupportAssetCoins> = {
      [`${
        this._address.get('core.coins.vsui.id') ?? voloCoinIds.vsui
      }::cert::CERT`]: 'vsui',
    };

    const assetCoinName =
      wormHoleCoinTypeMap[coinType] ||
      voloCoinTypeMap[coinType] ||
      (coinType.split('::')[2].toLowerCase() as SupportAssetCoins);

    return isMarketCoinType
      ? this.parseMarketCoinName(assetCoinName)
      : assetCoinName;
  }

  /**
   * Convert marke coin name to coin name.
   *
   * @param marketCoinName - Specific support market coin name.
   * @return Coin Name.
   */
  public parseCoinName<T extends SupportAssetCoins>(marketCoinName: string) {
    return marketCoinName.slice(1) as T;
  }

  /**
   * Convert coin name to market coin name.
   *
   * @param coinName - Specific support coin name.
   * @return Market coin name.
   */
  public parseMarketCoinName<T extends SupportMarketCoins>(
    coinName: SupportCoins
  ) {
    return `s${coinName}` as T;
  }

  /**
   * Get reward type of stake pool.
   *
   * @param stakeMarketCoinName - Support stake market coin.
   * @return Reward coin name.
   */
  public getRewardCoinName = (stakeMarketCoinName: SupportStakeMarketCoins) => {
    return rewardCoins[stakeMarketCoinName];
  };

  /**
   * Get coin decimal.
   *
   * return Coin decimal.
   */
  public getCoinDecimal(coinName: SupportCoins) {
    return coinDecimals[coinName];
  }

  /**
   * Get coin wrapped type.
   *
   * return Coin wrapped type.
   */
  public getCoinWrappedType(assetCoinName: SupportAssetCoins): CoinWrappedType {
    return assetCoinName === 'usdc' ||
      assetCoinName === 'usdt' ||
      assetCoinName === 'eth' ||
      assetCoinName === 'btc' ||
      assetCoinName === 'apt' ||
      assetCoinName === 'sol'
      ? {
          from: 'Wormhole',
          type: 'Portal from Ethereum',
        }
      : undefined;
  }

  /**
   * Select coin id  that add up to the given amount as transaction arguments.
   *
   * @param ownerAddress - The address of the owner.
   * @param amount - The amount that including coin decimals.
   * @param coinType - The coin type, default is 0x2::SUI::SUI.
   * @return The selected transaction coin arguments.
   */
  public async selectCoinIds(
    amount: number,
    coinType: string = SUI_TYPE_ARG,
    ownerAddress?: string
  ) {
    ownerAddress = ownerAddress || this._suiKit.currentAddress();
    const coins = await this._suiKit.suiInteractor.selectCoins(
      ownerAddress,
      amount,
      coinType
    );
    return coins.map((c) => c.objectId);
  }

  /**
   * Get all asset coin names in the obligation record by obligation id.
   *
   * @description
   * This can often be used to determine which assets in an obligation require
   * price updates before interacting with specific instructions of the Scallop contract.
   *
   * @param obligationId - The obligation id.
   * @return Asset coin Names.
   */
  public async getObligationCoinNames(obligationId: SuiAddressArg) {
    const obligation = await queryObligation(this._query, obligationId);
    const collateralCoinTypes = obligation.collaterals.map((collateral) => {
      return `0x${collateral.type.name}`;
    });
    const debtCoinTypes = obligation.debts.map((debt) => {
      return `0x${debt.type.name}`;
    });
    const obligationCoinTypes = [
      ...new Set([...collateralCoinTypes, ...debtCoinTypes]),
    ];
    const obligationCoinNames = obligationCoinTypes.map((coinType) => {
      return this.parseCoinNameFromType(coinType);
    });
    return obligationCoinNames;
  }

  /**
   * Get asset coin price.
   *
   * @description
   * The strategy for obtaining the price is to get it through API first,
   * and then on-chain data if API cannot be retrieved.
   * Currently, we only support obtaining from pyth protocol, other
   * oracles will be supported in the future.
   *
   * @param assetCoinNames - Specific an array of support asset coin name.
   * @return  Asset coin price.
   */
  public async getCoinPrices(assetCoinNames?: SupportAssetCoins[]) {
    assetCoinNames =
      assetCoinNames ||
      ([
        ...new Set([...SUPPORT_POOLS, ...SUPPORT_COLLATERALS]),
      ] as SupportAssetCoins[]);

    const coinPrices: CoinPrices = {};
    const existPricesCoinNames: SupportAssetCoins[] = [];
    const lackPricesCoinNames: SupportAssetCoins[] = [];

    assetCoinNames.forEach((assetCoinName) => {
      if (
        this._priceMap.has(assetCoinName) &&
        Date.now() - this._priceMap.get(assetCoinName)!.publishTime < 1000 * 60
      ) {
        existPricesCoinNames.push(assetCoinName);
      } else {
        lackPricesCoinNames.push(assetCoinName);
      }
    });

    if (existPricesCoinNames.length > 0) {
      for (const coinName of existPricesCoinNames) {
        coinPrices[coinName] = this._priceMap.get(coinName)!.price;
      }
    }

    if (lackPricesCoinNames.length > 0) {
      const pythConnection = new SuiPriceServiceConnection(
        this.isTestnet
          ? 'https://hermes-beta.pyth.network'
          : 'https://hermes.pyth.network'
      );
      const priceIds = lackPricesCoinNames.map((coinName) =>
        this._address.get(`core.coins.${coinName}.oracle.pyth.feed`)
      );
      try {
        const priceFeeds =
          (await pythConnection.getLatestPriceFeeds(priceIds)) || [];
        for (const [index, feed] of priceFeeds.entries()) {
          const data = parseDataFromPythPriceFeed(feed, this._address);
          const coinName = lackPricesCoinNames[index];
          this._priceMap.set(coinName, {
            price: data.price,
            publishTime: data.publishTime,
          });
          coinPrices[coinName] = data.price;
        }
      } catch (_e) {
        for (const coinName of lackPricesCoinNames) {
          const price = await this._query.getPriceFromPyth(coinName);
          this._priceMap.set(coinName, {
            price: price,
            publishTime: Date.now(),
          });
          coinPrices[coinName] = price;
        }
      }
    }

    return coinPrices;
  }

  /**
   * Convert apr to apy.
   *
   * @param apr The annual percentage rate (APR).
   * @param compoundFrequency How often interest is compounded per year. Default is daily (365 times a year).
   * @return The equivalent annual percentage yield (APY) for the given APR and compounding frequency.
   */
  public parseAprToApy(apr: number, compoundFrequency = 365) {
    return (1 + apr / compoundFrequency) ** compoundFrequency - 1;
  }

  /**
   * Convert apr to apy.
   *
   * @param apr The equivalent annual percentage yield (APY).
   * @param compoundFrequency How often interest is compounded per year. Default is daily (365 times a year).
   * @return The equivalent annual percentage rate (APR) for the given APY and compounding frequency.
   */
  public parseApyToApr(apy: number, compoundFrequency = 365) {
    return ((1 + apy) ** (1 / compoundFrequency) - 1) * compoundFrequency;
  }
}
