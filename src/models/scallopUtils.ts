import {
  SUI_TYPE_ARG,
  normalizeStructTag,
  parseStructTag,
} from '@mysten/sui/utils';
import { SuiKit } from '@scallop-io/sui-kit';
import { SuiPriceServiceConnection } from '@pythnetwork/pyth-sui-js';
import { ScallopAddress } from './scallopAddress';
import { UNLOCK_ROUND_DURATION, MAX_LOCK_DURATION } from '../constants';
import { getPythPrices, queryObligation } from '../queries';
import { parseDataFromPythPriceFeed, findClosestUnlockRound } from '../utils';
import { ScallopCache } from './scallopCache';
import type {
  ScallopUtilsParams,
  CoinPrices,
  CoinWrappedType,
  ScallopUtilsInstanceParams,
  PoolAddress,
} from '../types';
import { queryKeys } from 'src/constants';
import type { SuiObjectArg, SuiTxBlock } from '@scallop-io/sui-kit';
import { newSuiKit } from './suiKit';
import { ScallopConstants } from './scallopConstants';

const PYTH_ENDPOINTS: {
  [k in 'mainnet']: string[];
} = {
  mainnet: ['https://hermes.pyth.network', 'https://scallop.rpc.p2p.world'],
};

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

  public suiKit: SuiKit;
  public address: ScallopAddress;
  public cache: ScallopCache;
  public constants: ScallopConstants;
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
      instance?.suiKit ??
      instance?.constants?.cache.suiKit ??
      newSuiKit(params);

    this.cache =
      instance?.constants?.cache ??
      instance?.cache ??
      new ScallopCache(this.params, {
        suiKit: this.suiKit,
      });

    this.address =
      instance?.constants?.address ??
      new ScallopAddress(this.params, {
        cache: this.cache,
      });

    this.constants =
      instance?.constants ??
      new ScallopConstants(this.params, {
        address: this.address,
      });
  }

  get whitelist() {
    return this.constants.whitelist;
  }

  // -------------- TYPE GUARDS --------------
  public isSuiBridgeAsset(coinName: any) {
    return this.constants.whitelist.suiBridge.has(coinName);
  }

  public isWormholeAsset(coinName: any) {
    return this.constants.whitelist.wormhole.has(coinName);
  }

  public isMarketCoin(coinName: string) {
    const assetCoinName = coinName.slice(1).toLowerCase() as string;
    return (
      coinName.charAt(0).toLowerCase() === 's' &&
      this.whitelist.lending.has(assetCoinName)
    );
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
  }

  /**
   * Convert coin name to symbol.
   *
   * @param coinName - Specific support coin name.
   * @return Symbol string.
   */
  public parseSymbol(coinName: string) {
    return this.isMarketCoin(coinName)
      ? (this.constants.poolAddresses[this.parseCoinName(coinName)]
          ?.sCoinSymbol ?? '')
      : (this.constants.poolAddresses[coinName]?.symbol ?? '');
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
  public parseCoinType(coinName: string, useOldMarketCoin: boolean = false) {
    if (useOldMarketCoin) {
      return this.constants.coinNameToOldMarketCoinTypeMap[coinName] ?? '';
    }
    return this.constants.coinNameToCoinTypeMap[coinName] ?? '';
  }

  /**
   * Convert coin name to sCoin name.
   *
   * @param coinName - Specific support coin name.
   * @return sCoin name.
   */
  public parseSCoinName<T extends string>(coinName: string) {
    // need more check because swapt has no sCoin type
    if (this.isMarketCoin(coinName) && this.whitelist.scoin.has(coinName)) {
      return coinName as T;
    } else {
      const marketCoinName = `s${coinName}`;
      if (this.whitelist.scoin.has(marketCoinName)) {
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
    return this.constants.sCoinRawNameToScoinNameMap[coinName] ?? coinName;
  }

  /**
   * Convert sCoin name into sCoin type
   * @param sCoinName
   * @returns sCoin type
   */
  public parseSCoinType(sCoinName: string) {
    return this.constants.sCoinTypes[sCoinName] ?? '';
  }

  /**
   * Convert sCoinType into sCoin name
   * @param sCoinType
   * @returns sCoin name
   */
  public parseSCoinNameFromType(sCoinType: string) {
    return this.constants.sCoinTypeToSCoinNameMap[sCoinType];
  }

  /**
   * Convert sCoin name into its underlying coin type
   * @param sCoinName
   * @returns coin type
   */
  public parseUnderlyingSCoinType(sCoinName: string) {
    const coinName = this.parseCoinName(sCoinName);
    return this.parseCoinType(coinName);
  }

  /**
   * Get sCoin treasury id from sCoin name
   * @param sCoinName
   * @returns sCoin treasury id
   */
  public getSCoinTreasury(sCoinName: string) {
    return this.address.get(`scoin.coins.${sCoinName}.treasury`);
  }

  /**
   * Convert coin name to market coin type.
   *
   * @param coinPackageId - Package id of coin.
   * @param coinName - Specific support coin name.
   * @return Market coin type.
   */
  public parseMarketCoinType(coinName: string) {
    const coinType = this.parseCoinType(
      this.isMarketCoin(coinName) ? this.parseCoinName(coinName) : coinName,
      true
    );
    return coinType;
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
  public parseCoinNameFromType(coinType: string) {
    coinType = normalizeStructTag(coinType);
    const { address, module, name, typeParams } = parseStructTag(coinType);
    const isMarketCoinType =
      address === this.constants.protocolObjectId &&
      module === 'reserve' &&
      name === 'MarketCoin';

    if (isMarketCoinType) {
      return this.parseMarketCoinName(
        parseStructTag(typeParams as any).name.toLowerCase()
      );
    }
    const assetCoinName =
      this.constants.coinTypeToCoinNameMap[coinType] ||
      this.constants.sCoinTypeToSCoinNameMap[coinType] ||
      parseStructTag(coinType).name.toLowerCase();

    return assetCoinName;
  }

  /**
   * Convert market coin name to coin name.
   *
   * @param marketCoinName - Specific support market coin name.
   * @return Coin Name.
   */
  public parseCoinName<T extends string>(marketCoinName: string) {
    return marketCoinName.slice(1) as T;
  }

  /**
   * Convert coin name to market coin name.
   *
   * @param coinName - Specific support coin name.
   * @return Market coin name.
   */
  public parseMarketCoinName<T extends string>(coinName: string) {
    return `s${coinName}` as T;
  }

  /**
   * Get reward type of spool.
   *
   * @param stakeMarketCoinName - Support stake market coin.
   * @return Spool reward coin name.
   */
  public getSpoolRewardCoinName = () => {
    return 'sui'; // No further plan to incentivize other spools
  };

  /**
   * Get coin decimal.
   *
   * return Coin decimal.
   */
  public getCoinDecimal(coinName: string) {
    return this.constants.coinDecimals[coinName] ?? 0;
  }

  /**
   * Get coin wrapped type.
   *
   * return Coin wrapped type.
   */
  public getCoinWrappedType(assetCoinName: string): CoinWrappedType {
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
    coinNames: string[] = [
      ...new Set([
        ...this.constants.whitelist.lending,
        ...this.constants.whitelist.collateral,
      ]),
    ] as string[]
  ) {
    let coinPrices: CoinPrices = {};

    const endpoints = this.params.pythEndpoints ?? PYTH_ENDPOINTS['mainnet'];

    const failedRequests: Set<string> = new Set(coinNames);

    for (const endpoint of endpoints) {
      const priceIdPairs = Array.from(failedRequests.values()).reduce(
        (acc, coinName) => {
          const priceId =
            this.address.get(`core.coins.${coinName}.oracle.pyth.feed`) ??
            this.constants.poolAddresses[coinName]?.pythFeed;
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
            const coinName = priceIdPairs[idx][0] as string;
            const data = parseDataFromPythPriceFeed(feed, this.constants);
            coinPrices[coinName as string] = data.price;
            failedRequests.delete(coinName as string); // remove success price feed to prevent duplicate request on the next endpoint
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
  public getSupportedPoolAddresses(): PoolAddress[] {
    return this.constants.poolAddresses
      ? Object.values(this.constants.poolAddresses).filter(
          (address): address is PoolAddress => address !== undefined
        )
      : [];
  }
}
