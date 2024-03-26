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
  spoolRewardCoins,
  borrowIncentiveRewardCoins,
  coinDecimals,
  wormholeCoinIds,
  voloCoinIds,
  coinIds,
  UNLOCK_ROUND_DURATION,
  MAX_LOCK_DURATION,
} from '../constants';
import { queryObligation } from '../queries';
import {
  parseDataFromPythPriceFeed,
  isMarketCoin,
  parseAssetSymbol,
  findClosestUnlockRound,
} from '../utils';
import type {
  ScallopUtilsParams,
  ScallopInstanceParams,
  SupportCoins,
  SupportAssetCoins,
  SupportMarketCoins,
  SupportStakeMarketCoins,
  SupportBorrowIncentiveCoins,
  CoinPrices,
  PriceMap,
  CoinWrappedType,
} from '../types';
import { PYTH_ENDPOINTS } from 'src/constants/pyth';
import { ScallopCache } from './scallopCache';

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
  private _cache: ScallopCache;

  public constructor(
    params: ScallopUtilsParams,
    instance?: ScallopInstanceParams
  ) {
    this.params = params;
    this._suiKit = instance?.suiKit ?? new SuiKit(params);
    this._cache = instance?.cache ?? new ScallopCache();
    this._address =
      instance?.address ??
      new ScallopAddress(
        {
          id: params?.addressesId || ADDRESSES_ID,
          network: params?.networkType,
        },
        this._cache
      );
    this._query =
      instance?.query ??
      new ScallopQuery(params, {
        suiKit: this._suiKit,
        address: this._address,
        cache: this._cache,
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
  public async init(force: boolean = false, address?: ScallopAddress) {
    if (force || !this._address.getAddresses() || !address?.getAddresses()) {
      await this._address.read();
    } else {
      this._address = address;
    }

    if (!this._query.address.getAddresses()) {
      await this._query.init(force, this._address);
    }
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
    const protocolObjectId =
      this._address.get('core.object') || PROTOCOL_OBJECT_ID;
    const coinType = this.parseCoinType(coinName);
    return `${protocolObjectId}::reserve::MarketCoin<${coinType}>`;
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
   * Get reward type of spool.
   *
   * @param stakeMarketCoinName - Support stake market coin.
   * @return Spool reward coin name.
   */
  public getSpoolRewardCoinName = (
    stakeMarketCoinName: SupportStakeMarketCoins
  ) => {
    return spoolRewardCoins[stakeMarketCoinName];
  };

  /**
   * Get reward type of borrow incentive pool.
   *
   * @param borrowIncentiveCoinName - Support borrow incentive coin.
   * @return Borrow incentive reward coin name.
   */
  public getBorrowIncentiveRewardCoinName = (
    borrowIncentiveCoinName: SupportBorrowIncentiveCoins
  ) => {
    return borrowIncentiveRewardCoins[borrowIncentiveCoinName];
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
      const endpoints =
        this.params.pythEndpoints ??
        PYTH_ENDPOINTS[this.isTestnet ? 'testnet' : 'mainnet'];
      try {
        for (const endpoint of endpoints) {
          try {
            const pythConnection = new SuiPriceServiceConnection(endpoint);
            const priceIds = Array.from(
              new Set(
                lackPricesCoinNames.map((coinName) =>
                  this._address.get(`core.coins.${coinName}.oracle.pyth.feed`)
                )
              )
            );

            for (const [index, priceId] of priceIds.entries()) {
              const feed = await this._cache.queryClient.fetchQuery({
                queryKey: [priceId],
                queryFn: async () => {
                  return await pythConnection.getLatestPriceFeeds([priceId]);
                },
              });
              if (feed) {
                const data = parseDataFromPythPriceFeed(feed[0], this._address);
                const coinName = lackPricesCoinNames[index];
                this._priceMap.set(coinName, {
                  price: data.price,
                  publishTime: data.publishTime,
                });
                coinPrices[coinName] = data.price;
              }
            }
            break;
          } catch (e) {
            console.warn(
              `Failed to get price feeds with endpoint ${endpoint}: ${e}`
            );
          }

          throw new Error('Failed to get price feeds with all endpoints');
        }
      } catch (_e) {
        console.warn(_e);
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

  /**
   * Give extend lock period to get unlock at in seconds timestamp.
   *
   * @description
   * - When the user without remaining unlock period, If the extended unlock day is not specified,
   *   the unlock period will be increased by one day by default.
   * - When the given extended day plus the user's remaining unlock period exceeds the maximum
   *    unlock period, the maximum unlock period is used as unlock period.
   *
   * @param extendLockPeriodInDay The extend lock period in day.
   * @param unlockAtInSecondTimestamp The unlock timestamp from veSca object.
   * @return New unlock at in seconds timestamp.
   */
  public getUnlockAt(
    extendLockPeriodInDay?: number,
    unlockAtInSecondTimestamp?: number
  ) {
    const now = Math.floor(new Date().getTime() / 1000);
    const remainingLockPeriod = unlockAtInSecondTimestamp
      ? Math.max(unlockAtInSecondTimestamp - now, 0)
      : 0;

    let newUnlockAtInSecondTimestamp = 0;

    if (remainingLockPeriod === 0) {
      const lockPeriod = (extendLockPeriodInDay ?? 1) * UNLOCK_ROUND_DURATION;
      newUnlockAtInSecondTimestamp = Math.min(
        now + lockPeriod,
        now + MAX_LOCK_DURATION
      );
    } else {
      const lockPeriod = Math.min(
        extendLockPeriodInDay
          ? extendLockPeriodInDay * UNLOCK_ROUND_DURATION + remainingLockPeriod
          : remainingLockPeriod,
        MAX_LOCK_DURATION
      );
      newUnlockAtInSecondTimestamp = now + lockPeriod;
    }
    return findClosestUnlockRound(newUnlockAtInSecondTimestamp);
  }
}
