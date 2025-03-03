import { SUI_TYPE_ARG, normalizeStructTag } from '@mysten/sui/utils';
import { SuiKit } from '@scallop-io/sui-kit';
import { SuiPriceServiceConnection } from '@pythnetwork/pyth-sui-js';
import { ScallopAddress } from './scallopAddress';
import {
  ADDRESS_ID,
  PROTOCOL_OBJECT_ID,
  SUPPORT_POOLS,
  SUPPORT_COLLATERALS,
  spoolRewardCoins,
  coinDecimals,
  wormholeCoinIds,
  voloCoinIds,
  coinIds,
  UNLOCK_ROUND_DURATION,
  MAX_LOCK_DURATION,
  SUPPORT_SCOIN,
  sCoinIds,
  suiBridgeCoins,
  COIN_GECKGO_IDS,
  POOL_ADDRESSES,
  sCoinTypeToName,
  sCoinRawNameToName,
} from '../constants';
import { getPythPrices, queryObligation } from '../queries';
import {
  parseDataFromPythPriceFeed,
  isMarketCoin,
  parseAssetSymbol,
  findClosestUnlockRound,
  isSuiBridgeAsset,
  isWormholeAsset,
} from '../utils';
import { PYTH_ENDPOINTS, PYTH_FEED_IDS } from 'src/constants/pyth';
import { ScallopCache } from './scallopCache';
import type {
  ScallopUtilsParams,
  SupportCoins,
  SupportAssetCoins,
  SupportMarketCoins,
  SupportStakeMarketCoins,
  CoinPrices,
  CoinWrappedType,
  SupportSCoin,
  ScallopUtilsInstanceParams,
  SupportSuiBridgeCoins,
  SupportWormholeCoins,
  PoolAddressInfo,
} from '../types';
import { queryKeys } from 'src/constants';
import type { SuiObjectArg, SuiTxBlock } from '@scallop-io/sui-kit';
import { newSuiKit } from './suiKit';

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
  public walletAddress: string;

  public constructor(
    params: ScallopUtilsParams,
    instance?: ScallopUtilsInstanceParams
  ) {
    this.params = {
      pythEndpoints: params.pythEndpoints ?? PYTH_ENDPOINTS['mainnet'],
      ...params,
    };
    this.walletAddress =
      params.walletAddress ?? instance?.suiKit?.currentAddress() ?? '';
    this.suiKit =
      instance?.suiKit ?? instance?.address?.cache.suiKit ?? newSuiKit(params);

    if (instance?.address) {
      this.address = instance.address;
      this.cache = this.address.cache;
    } else {
      this.cache = new ScallopCache(this.params, {
        suiKit: this.suiKit,
      });
      this.address =
        instance?.address ??
        new ScallopAddress(
          {
            id: params?.addressId ?? ADDRESS_ID,
            network: params?.networkType,
            forceInterface: params?.forceAddressesInterface,
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
  // -------------- TYPE GUARDS --------------
  public isSuiBridgeAsset(coinName: any): coinName is SupportSuiBridgeCoins {
    return isSuiBridgeAsset(coinName);
  }

  public isWormholeAsset(coinName: any): coinName is SupportWormholeCoins {
    return isWormholeAsset(coinName);
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
  }

  /**
   * Convert coin name to symbol.
   *
   * @param coinName - Specific support coin name.
   * @return Symbol string.
   */
  public parseSymbol(coinName: SupportCoins) {
    return parseAssetSymbol(coinName);
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
  public parseCoinType(
    coinName: SupportCoins,
    useOldMarketCoin: boolean = false
  ) {
    // try parse scoin first
    if (sCoinIds[coinName as SupportSCoin] && !useOldMarketCoin) {
      return sCoinIds[coinName as SupportSCoin];
    }
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
    if (coinName === 'blub')
      return normalizeStructTag(`${coinPackageId}::BLUB::BLUB`);
    if (coinName === 'sbwbtc')
      return normalizeStructTag(`${coinPackageId}::btc::BTC`);

    const wormHolePackageIds = [
      this.address.get('core.coins.wusdc.id') ?? wormholeCoinIds.wusdc,
      this.address.get('core.coins.wusdt.id') ?? wormholeCoinIds.wusdt,
      this.address.get('core.coins.weth.id') ?? wormholeCoinIds.weth,
      this.address.get('core.coins.wbtc.id') ?? wormholeCoinIds.wbtc,
      this.address.get('core.coins.wsol.id') ?? wormholeCoinIds.wsol,
      this.address.get('core.coins.wapt.id') ?? wormholeCoinIds.wapt,
    ];
    const voloPackageIds = [
      this.address.get('core.coins.vsui.id') ?? voloCoinIds.vsui,
    ];

    const suiBridgePackageIds = Object.values<SupportSuiBridgeCoins>(
      suiBridgeCoins
    ).reduce((curr, coinName) => {
      curr.push(
        this.address.get(`core.coins.${coinName}.id`) ?? coinIds[coinName]
      );
      return curr;
    }, [] as string[]);
    if (wormHolePackageIds.includes(coinPackageId)) {
      return `${coinPackageId}::coin::COIN`;
    } else if (voloPackageIds.includes(coinPackageId)) {
      return `${coinPackageId}::cert::CERT`;
    } else if (suiBridgePackageIds.includes(coinPackageId)) {
      // handle sui bridge assets
      const typeCoinName = coinName.slice(2);
      return `${coinPackageId}::${typeCoinName}::${typeCoinName.toUpperCase()}`;
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
    // need more check because swapt has no sCoin type
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
   * Convert sCoin name to market coin name.
   * This function will parse new sCoin name `scallop_...` to its old market coin name which is shorter
   * e.g: `scallop_sui -> ssui
   * if no `scallop_...` is encountered, return coinName
   * @return sCoin name
   */
  public parseSCoinTypeNameToMarketCoinName(coinName: string) {
    return sCoinRawNameToName[coinName] ?? coinName;
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
   * Convert sCoinType into sCoin name
   * @param sCoinType
   * @returns sCoin name
   */
  public parseSCoinNameFromType(sCoinType: string) {
    return sCoinTypeToName[sCoinType];
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
    const coinType = this.parseCoinType(coinName, true);
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
  public parseCoinNameFromType<T extends SupportSCoin>(
    coinType: string
  ): T extends SupportSCoin ? T : SupportSCoin;
  public parseCoinNameFromType(coinType: string) {
    coinType = normalizeStructTag(coinType);
    if (sCoinTypeToName[coinType]) {
      return sCoinTypeToName[coinType] as SupportSCoin;
    }

    const coinTypeRegex = new RegExp(`((0x[^:]+::[^:]+::[^<>]+))(?![^<>]*<)`);
    const coinTypeMatch = coinType.match(coinTypeRegex);
    const isMarketCoinType = coinType.includes('reserve::MarketCoin');
    coinType = coinTypeMatch?.[1] ?? coinType;

    const wormholeCoinTypeMap: Record<string, SupportAssetCoins> = {
      [`${
        this.address.get('core.coins.wusdc.id') ?? wormholeCoinIds.wusdc
      }::coin::COIN`]: 'wusdc',
      [`${
        this.address.get('core.coins.wusdt.id') ?? wormholeCoinIds.wusdt
      }::coin::COIN`]: 'wusdt',
      [`${
        this.address.get('core.coins.weth.id') ?? wormholeCoinIds.weth
      }::coin::COIN`]: 'weth',
      [`${
        this.address.get('core.coins.wbtc.id') ?? wormholeCoinIds.wbtc
      }::coin::COIN`]: 'wbtc',
      [`${
        this.address.get('core.coins.wsol.id') ?? wormholeCoinIds.wsol
      }::coin::COIN`]: 'wsol',
      [`${
        this.address.get('core.coins.wapt.id') ?? wormholeCoinIds.wapt
      }::coin::COIN`]: 'wapt',
    };
    const voloCoinTypeMap: Record<string, SupportAssetCoins> = {
      [`${
        this.address.get('core.coins.vsui.id') ?? voloCoinIds.vsui
      }::cert::CERT`]: 'vsui',
    };

    const suiBridgeTypeMap = Object.values<SupportSuiBridgeCoins>(
      suiBridgeCoins
    ).reduce(
      (curr, coinName) => {
        curr[this.parseCoinType(coinName)] = coinName;
        return curr;
      },
      {} as Record<string, SupportSuiBridgeCoins>
    );

    const assetCoinName =
      wormholeCoinTypeMap[coinType] ||
      voloCoinTypeMap[coinType] ||
      suiBridgeTypeMap[coinType] ||
      (coinType.split('::')[2].toLowerCase() as SupportAssetCoins);

    return isMarketCoinType
      ? this.parseMarketCoinName(assetCoinName)
      : assetCoinName;
  }

  /**
   * Convert market coin name to coin name.
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
    if (this.isSuiBridgeAsset(assetCoinName)) {
      return {
        from: 'Sui Bridge',
        type: 'Asset from Sui Bridge',
      };
    } else if (this.isWormholeAsset(assetCoinName)) {
      return {
        from: 'Wormhole',
        type: 'Portal from Ethereum',
      };
    }

    return undefined;
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
    ownerAddress = ownerAddress ?? this.walletAddress;
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
    dest: SuiObjectArg,
    coinType: string,
    sender: string = this.walletAddress
  ): Promise<void> {
    // merge to existing coins if exist
    try {
      const existingCoins = await this.selectCoins(
        Number.MAX_SAFE_INTEGER,
        coinType,
        sender
      );

      if (existingCoins.length > 0) {
        txBlock.mergeCoins(dest, existingCoins.slice(0, 500));
      }
    } catch (_e) {
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
  public async getObligationCoinNames(obligationId: SuiObjectArg) {
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
  public async getCoinPrices(
    _: SupportAssetCoins[] = [
      ...new Set([...SUPPORT_POOLS, ...SUPPORT_COLLATERALS]),
    ] as SupportAssetCoins[]
  ) {
    let coinPrices: CoinPrices = {};

    const endpoints =
      this.params.pythEndpoints ??
      PYTH_ENDPOINTS[this.isTestnet ? 'testnet' : 'mainnet'];

    const failedRequests: Set<SupportAssetCoins> = new Set([
      ...SUPPORT_POOLS,
      ...SUPPORT_COLLATERALS,
    ]);

    for (const endpoint of endpoints) {
      const priceIdPairs = Array.from(failedRequests.values()).reduce(
        (acc, coinName) => {
          const priceId =
            this.address.get(`core.coins.${coinName}.oracle.pyth.feed`) ??
            PYTH_FEED_IDS[coinName];
          acc.push([coinName, priceId]);
          return acc;
        },
        [] as [string, string][]
      );

      const priceIds = priceIdPairs.map(([_, priceId]) => priceId);

      const pythConnection = new SuiPriceServiceConnection(endpoint, {
        timeout: 4000,
      });

      try {
        const feeds = await this.cache.queryClient.fetchQuery({
          queryKey: queryKeys.oracle.getPythLatestPriceFeeds(),
          queryFn: async () => {
            return await pythConnection.getLatestPriceFeeds(priceIds);
          },
          staleTime: 30000,
          gcTime: 30000,
        });
        if (feeds) {
          feeds.forEach((feed, idx) => {
            const coinName = priceIdPairs[idx][0] as SupportAssetCoins;
            const data = parseDataFromPythPriceFeed(feed, this.address);
            coinPrices[coinName as SupportAssetCoins] = data.price;
            failedRequests.delete(coinName as SupportAssetCoins); // remove success price feed to prevent duplicate request on the next endpoint
          });
        }
      } catch (e: any) {
        console.error(e.message);
      }
      if (failedRequests.size === 0) break;
    }

    if (failedRequests.size > 0) {
      coinPrices = {
        ...coinPrices,
        ...(await getPythPrices(this, Array.from(failedRequests.values()))),
      };
      failedRequests.clear();
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
   * Convert apy to apr.
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

  /**
   * Get detailed contract address and price id information for supported pool in Scallop
   * @returns Supported pool informations
   */
  public getSupportedPoolAddresses(): PoolAddressInfo[] {
    return SUPPORT_POOLS.map((poolName) => {
      const sCoinName = this.parseSCoinName(poolName)!;
      return {
        name: this.parseSymbol(poolName),
        coingeckoId: COIN_GECKGO_IDS[poolName],
        decimal: coinDecimals[poolName],
        pythFeedId: PYTH_FEED_IDS[poolName],
        ...POOL_ADDRESSES[poolName],
        sCoinAddress: sCoinIds[sCoinName],
        marketCoinAddress: this.parseMarketCoinType(poolName),
        coinAddress: this.parseCoinType(poolName),
        sCoinName: sCoinName ? this.parseSymbol(sCoinName) : undefined,
      };
    });
  }
}
