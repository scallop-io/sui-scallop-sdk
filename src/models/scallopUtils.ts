import { SUI_TYPE_ARG, normalizeStructTag } from '@mysten/sui.js/utils';
import { SuiKit } from '@scallop-io/sui-kit';
import { SuiPriceServiceConnection } from '@pythnetwork/pyth-sui-js';
import { ScallopAddress } from './scallopAddress';
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
  SUPPORT_SCOIN,
  sCoinIds,
} from '../constants';
import { getPythPrice, queryObligation } from '../queries';
import {
  parseDataFromPythPriceFeed,
  isMarketCoin,
  parseAssetSymbol,
  findClosestUnlockRound,
} from '../utils';
import { PYTH_ENDPOINTS } from 'src/constants/pyth';
import { ScallopCache } from './scallopCache';
import { DEFAULT_CACHE_OPTIONS } from 'src/constants/cache';
import type {
  ScallopUtilsParams,
  SupportCoins,
  SupportAssetCoins,
  SupportMarketCoins,
  SupportStakeMarketCoins,
  SupportBorrowIncentiveCoins,
  CoinPrices,
  PriceMap,
  CoinWrappedType,
  SupportSCoin,
  ScallopUtilsInstanceParams,
} from '../types';
import type { SuiAddressArg, SuiTxArg, SuiTxBlock } from '@scallop-io/sui-kit';

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

  public suiKit: SuiKit;
  public address: ScallopAddress;
  public cache: ScallopCache;
  private _priceMap: PriceMap = new Map();

  public constructor(
    params: ScallopUtilsParams,
    instance?: ScallopUtilsInstanceParams
  ) {
    this.params = {
      pythEndpoints: params.pythEndpoints ?? PYTH_ENDPOINTS['mainnet'],
      ...params,
    };
    this.suiKit =
      instance?.suiKit ??
      instance?.address?.cache._suiKit ??
      new SuiKit(params);

    if (instance?.address) {
      this.address = instance.address;
      this.cache = this.address.cache;
      this.suiKit = this.address.cache._suiKit;
    } else {
      this.cache = new ScallopCache(this.suiKit, DEFAULT_CACHE_OPTIONS);
      this.address =
        instance?.address ??
        new ScallopAddress(
          {
            id: params?.addressesId || ADDRESSES_ID,
            network: params?.networkType,
          },
          {
            cache: this.cache,
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
    if (force || !this.address.getAddresses() || !address?.getAddresses()) {
      await this.address.read();
    } else {
      this.address = address;
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
      this.address.get(`core.coins.${coinName}.id`) ||
      coinIds[coinName] ||
      undefined;
    if (!coinPackageId) {
      throw Error(`Coin ${coinName} is not supported`);
    }
    if (coinName === 'sui')
      return normalizeStructTag(`${coinPackageId}::sui::SUI`);
    const wormHolePackageIds = [
      this.address.get('core.coins.usdc.id') ?? wormholeCoinIds.usdc,
      this.address.get('core.coins.usdt.id') ?? wormholeCoinIds.usdt,
      this.address.get('core.coins.eth.id') ?? wormholeCoinIds.eth,
      this.address.get('core.coins.btc.id') ?? wormholeCoinIds.btc,
      this.address.get('core.coins.sol.id') ?? wormholeCoinIds.sol,
      this.address.get('core.coins.apt.id') ?? wormholeCoinIds.apt,
    ];
    const voloPackageIds = [
      this.address.get('core.coins.vsui.id') ?? voloCoinIds.vsui,
    ];
    if (wormHolePackageIds.includes(coinPackageId)) {
      return `${coinPackageId}::coin::COIN`;
    } else if (voloPackageIds.includes(coinPackageId)) {
      return `${coinPackageId}::cert::CERT`;
    } else {
      return `${coinPackageId}::${coinName}::${coinName.toUpperCase()}`;
    }
  }

  /**
   * Convert coin name to sCoin name.
   *
   * @param coinName - Specific support coin name.
   * @return sCoin name.
   */
  public parseSCoinName<T extends SupportSCoin>(
    coinName: SupportCoins | SupportMarketCoins
  ) {
    // need more check because sbtc, ssol and sapt has no sCoin type
    if (
      isMarketCoin(coinName) &&
      SUPPORT_SCOIN.includes(coinName as SupportSCoin)
    ) {
      return coinName as T;
    } else {
      const marketCoinName = `s${coinName}`;
      if (SUPPORT_SCOIN.includes(marketCoinName as SupportSCoin)) {
        return marketCoinName as T;
      }
      return undefined;
    }
  }
  /**
   * Convert sCoin name into sCoin type
   * @param sCoinName
   * @returns sCoin type
   */
  public parseSCoinType(sCoinName: SupportSCoin) {
    return sCoinIds[sCoinName];
  }

  /**
   * Convert sCoin name into its underlying coin type
   * @param sCoinName
   * @returns coin type
   */
  public parseUnderlyingSCoinType(sCoinName: SupportSCoin) {
    const coinName = this.parseCoinName(sCoinName);
    return this.parseCoinType(coinName);
  }

  /**
   * Get sCoin treasury id from sCoin name
   * @param sCoinName
   * @returns sCoin treasury id
   */
  public getSCoinTreasury(sCoinName: SupportSCoin) {
    return this.address.get(`scoin.coins.${sCoinName}.treasury`);
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
      this.address.get('core.object') || PROTOCOL_OBJECT_ID;
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
        this.address.get('core.coins.usdc.id') ?? wormholeCoinIds.usdc
      }::coin::COIN`]: 'usdc',
      [`${
        this.address.get('core.coins.usdt.id') ?? wormholeCoinIds.usdt
      }::coin::COIN`]: 'usdt',
      [`${
        this.address.get('core.coins.eth.id') ?? wormholeCoinIds.eth
      }::coin::COIN`]: 'eth',
      [`${
        this.address.get('core.coins.btc.id') ?? wormholeCoinIds.btc
      }::coin::COIN`]: 'btc',
      [`${
        this.address.get('core.coins.sol.id') ?? wormholeCoinIds.sol
      }::coin::COIN`]: 'sol',
      [`${
        this.address.get('core.coins.apt.id') ?? wormholeCoinIds.apt
      }::coin::COIN`]: 'apt',
    };
    const voloCoinTypeMap: Record<string, SupportAssetCoins> = {
      [`${
        this.address.get('core.coins.vsui.id') ?? voloCoinIds.vsui
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
  public async selectCoins(
    amount: number,
    coinType: string = SUI_TYPE_ARG,
    ownerAddress?: string
  ) {
    ownerAddress = ownerAddress || this.suiKit.currentAddress();
    const coins = await this.suiKit.suiInteractor.selectCoins(
      ownerAddress,
      amount,
      coinType
    );
    return coins;
  }

  /**
   * Merge coins with type `coinType` to dest
   * @param txBlock
   * @param dest
   * @param coinType
   * @param sender
   */
  public async mergeSimilarCoins(
    txBlock: SuiTxBlock,
    dest: SuiTxArg,
    coinType: string,
    sender: string
  ): Promise<void> {
    // merge to existing coins if exist
    try {
      const existingSCoin = await this.selectCoins(
        Number.MAX_SAFE_INTEGER,
        coinType,
        sender
      );

      if (existingSCoin.length > 0) {
        txBlock.mergeCoins(dest, existingSCoin);
      }
    } catch (e) {
      // ignore
    }
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
    const obligation = await queryObligation(this, obligationId);
    if (!obligation) return undefined;

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

      const failedRequests: Set<SupportAssetCoins> = new Set(
        lackPricesCoinNames
      );

      for (const endpoint of endpoints) {
        const priceIds = Array.from(failedRequests.values()).reduce(
          (acc, coinName) => {
            const priceId = this.address.get(
              `core.coins.${coinName}.oracle.pyth.feed`
            );
            acc[coinName] = priceId;
            return acc;
          },
          {} as Record<SupportAssetCoins, string>
        );

        await Promise.allSettled(
          Object.entries(priceIds).map(async ([coinName, priceId]) => {
            const pythConnection = new SuiPriceServiceConnection(endpoint);
            try {
              const feed = await this.address.cache.queryClient.fetchQuery({
                queryKey: [priceId],
                queryFn: async () => {
                  return await pythConnection.getLatestPriceFeeds([priceId]);
                },
              });
              if (feed) {
                const data = parseDataFromPythPriceFeed(feed[0], this.address);
                this._priceMap.set(coinName as SupportAssetCoins, {
                  price: data.price,
                  publishTime: data.publishTime,
                });
                coinPrices[coinName as SupportAssetCoins] = data.price;
              }
              failedRequests.delete(coinName as SupportAssetCoins); // remove success price feed to prevent duplicate request on the next endpoint
            } catch (e) {
              console.warn(
                `Failed to get price ${coinName} feeds with endpoint ${endpoint}: ${e}`
              );
            }
          })
        );
        if (failedRequests.size === 0) break;
      }

      if (failedRequests.size > 0) {
        await Promise.allSettled(
          Array.from(failedRequests.values()).map(async (coinName) => {
            const price = await getPythPrice(this, coinName);
            this._priceMap.set(coinName, {
              price: price,
              publishTime: Date.now(),
            });
            coinPrices[coinName] = price;
          })
        );
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
    unlockAtInMillisTimestamp?: number
  ) {
    const now = Math.floor(new Date().getTime() / 1000);
    const remainingLockPeriod = unlockAtInMillisTimestamp
      ? Math.max(Math.floor(unlockAtInMillisTimestamp / 1000) - now, 0)
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
