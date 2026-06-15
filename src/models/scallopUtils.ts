import {
  normalizeStructTag,
  parseStructTag,
  SUI_TYPE_ARG,
  SuiObjectArg,
  SuiTxBlock,
  Transaction,
} from '@scallop-io/sui-kit';
import ScallopConstants, {
  ScallopConstantsParams,
} from './scallopConstants.js';
import { CoinPrices, CoinWrappedType, PoolAddress } from 'src/types/index.js';
import { findClosestUnlockRound, parseObjectAs } from 'src/utils/index.js';
import {
  MAX_LOCK_DURATION,
  queryKeys,
  UNLOCK_ROUND_DURATION,
} from 'src/constants/index.js';
import { PriceFeed, SuiPriceServiceConnection } from '@pythnetwork/pyth-sui-js';
import ScallopSuiKit, { ScallopSuiKitParams } from './scallopSuiKit.js';
import {
  SuiKitTransactionExecutor,
  type TransactionExecutor,
} from './transactionExecutor.js';
import {
  createRepositories,
  type Repositories,
} from 'src/repositories/wiring/registry.js';
import { ScallopParseError } from 'src/errors/index.js';
import { ScallopUtilsInterface } from './interface.js';
import type { SuiObjectData } from 'src/types/index.js';
import { noopLogger, type Logger } from 'src/logger/index.js';

export type ScallopUtilsParams = {
  pythEndpoints?: string[];
  scallopSuiKit?: ScallopSuiKit;
  scallopConstants?: ScallopConstants;
  logger?: Logger;
} & ScallopSuiKitParams &
  ScallopConstantsParams;

class ScallopUtils implements ScallopUtilsInterface {
  public pythEndpoints: string[];
  public readonly scallopSuiKit: ScallopSuiKit;
  public readonly constants: ScallopConstants;
  public readonly timeout: number;
  public readonly logger: Logger;

  /**
   * Lazily-built, memoised repositories used by utils' own onchain reads (e.g.
   * `getObligationCoinNames`). Built from `this` — the registry imports
   * `ScallopUtils` type-only, so there is no runtime cycle, and the getter only
   * constructs repos on first use.
   */
  private _repos?: Repositories;
  private get repos(): Repositories {
    return (this._repos ??= createRepositories({ utils: this }));
  }

  constructor(params: ScallopUtilsParams = {}) {
    this.constants = params.scallopConstants ?? new ScallopConstants(params);
    this.scallopSuiKit =
      params.scallopSuiKit ??
      new ScallopSuiKit({
        queryClient: this.constants.queryClient,
        ...params,
      });

    this.pythEndpoints = params.pythEndpoints ?? [
      'https://hermes.pyth.network',
    ];

    this.timeout = params.axiosTimeout ?? 4000;
    this.logger = params.logger ?? noopLogger;
  }

  get walletAddress() {
    return this.scallopSuiKit.walletAddress;
  }

  get suiKit() {
    return this.scallopSuiKit.suiKit;
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

  get queryClient() {
    return this.constants.queryClient;
  }

  // For backward compatibility with older sdk version
  get address() {
    return this.constants.address;
  }

  // -------------- TYPE GUARDS --------------
  isSuiBridgeAsset(coinName: string) {
    return this.constants.whitelist.suiBridge.has(coinName);
  }

  isWormholeAsset(coinName: string) {
    return this.constants.whitelist.wormhole.has(coinName);
  }

  isLayerZeroAsset(coinName: string) {
    return this.constants.whitelist.layerZero.has(coinName);
  }

  isMarketCoin(coinName: string) {
    const assetCoinName = coinName.slice(1).toLowerCase() as string;
    return (
      coinName.charAt(0).toLowerCase() === 's' &&
      this.constants.whitelist.lending.has(assetCoinName)
    );
  }

  async init({ force = false }: { force?: boolean } = {}) {
    await this.constants.init({ force });
  }

  /**
   * Convert market coin name to coin name.
   *
   * @param marketCoinName - Specific support market coin name.
   * @return Coin Name.
   */
  parseCoinName<T extends string>(marketCoinName: string) {
    return marketCoinName.slice(1) as T;
  }

  /**
   * Convert coin name to symbol.
   *
   * @param coinName - Specific support coin name.
   * @return Symbol string.
   */
  parseSymbol(coinName: string) {
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
  parseCoinType(coinName: string, useOldMarketCoin: boolean = false) {
    if (useOldMarketCoin) {
      return this.constants.coinNameToOldMarketCoinTypeMap[coinName] ?? '';
    }
    return this.constants.coinTypes[coinName] ?? '';
  }

  /**
   * Convert coin name to sCoin name.
   *
   * @param coinName - Specific support coin name.
   * @return sCoin name.
   */
  parseSCoinName<T extends string>(coinName: string) {
    // need more check because swapt has no sCoin type
    if (
      this.isMarketCoin(coinName) &&
      this.constants.whitelist.scoin.has(coinName)
    ) {
      return coinName as T;
    } else {
      const marketCoinName = `s${coinName}`;
      if (this.constants.whitelist.scoin.has(marketCoinName)) {
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
  parseSCoinTypeNameToMarketCoinName(coinName: string) {
    return this.constants.scoinRawNameToSCoinNameMap[coinName] ?? coinName;
  }

  /**
   * Convert sCoin name into sCoin type
   * @param sCoinName
   * @returns sCoin type
   */
  parseSCoinType(sCoinName: string) {
    return this.constants.sCoinTypes[sCoinName] ?? '';
  }

  /**
   * Convert sCoinType into sCoin name
   * @param sCoinType
   * @returns sCoin name
   */
  parseSCoinNameFromType(sCoinType: string) {
    return this.constants.scoinTypeToSCoinNameMap[sCoinType];
  }

  /**
   * Convert sCoin name into its underlying coin type
   * @param sCoinName
   * @returns coin type
   */
  parseUnderlyingSCoinType(sCoinName: string) {
    const coinName = this.parseCoinName(sCoinName);
    return this.parseCoinType(coinName);
  }

  /**
   * Get sCoin treasury id from sCoin name
   * @param sCoinName
   * @returns sCoin treasury id
   */
  getSCoinTreasury(sCoinName: string) {
    return this.address.get(`scoin.coins.${sCoinName}.treasury`);
  }

  /**
   * Convert coin name to market coin type.
   *
   * @param coinPackageId - Package id of coin.
   * @param coinName - Specific support coin name.
   * @return Market coin type.
   */
  parseMarketCoinType(coinName: string) {
    const coinType = this.parseCoinType(
      this.isMarketCoin(coinName) ? this.parseCoinName(coinName) : coinName,
      true
    );
    return coinType;
  }

  /**
   * Convert coin name to market coin name.
   *
   * @param coinName - Specific support coin name.
   * @return Market coin name.
   */
  parseMarketCoinName<T extends string>(coinName: string) {
    return `s${coinName}` as T;
  }

  /**
   * Get reward type of spool.
   *
   * @param stakeMarketCoinName - Support stake market coin.
   * @return Spool reward coin name.
   */
  getSpoolRewardCoinName = () => {
    return 'sui'; // No further plan to incentivize other spools
  };

  /**
   * Get coin decimal.
   *
   * return Coin decimal.
   */
  getCoinDecimal(coinName: string) {
    return this.constants.coinDecimals[coinName] ?? 0;
  }

  /**
   * Get coin wrapped type.
   *
   * return Coin wrapped type.
   */
  getCoinWrappedType(assetCoinName: string): CoinWrappedType {
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
    } else if (this.isLayerZeroAsset(assetCoinName)) {
      return {
        from: 'LayerZero',
        type: 'Ominchain Fungible Token from LayerZero',
      };
    }

    return undefined;
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
        (typeof typeParams[0] === 'string'
          ? parseStructTag(typeParams[0])
          : typeParams[0]
        ).name.toLowerCase()
      );
    }
    const assetCoinName =
      this.constants.coinTypeToCoinNameMap[coinType] ||
      this.constants.scoinTypeToSCoinNameMap[coinType] ||
      parseStructTag(coinType).name.toLowerCase();

    return assetCoinName;
  }

  /**
   * Select coin id  that add up to the given amount as transaction arguments.
   *
   * @param ownerAddress - The address of the owner.
   * @param amount - The amount that including coin decimals.
   * @param coinType - The coin type, default is 0x2::SUI::SUI.
   * @return The selected transaction coin arguments.
   */
  async selectCoins(
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
  async mergeSimilarCoins(
    txBlock: SuiTxBlock | Transaction,
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
        txBlock.mergeCoins(
          dest as any,
          existingCoins.slice(0, 500).map(txBlock.objectRef) as any
        );
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
  async getObligationCoinNames(obligationId: SuiObjectArg) {
    const id =
      typeof obligationId === 'string'
        ? obligationId
        : 'objectId' in obligationId
          ? obligationId.objectId
          : undefined;
    if (id === undefined) {
      throw new ScallopParseError(
        'getObligationCoinNames expects an object id (string) or an object reference'
      );
    }
    const obligation = await this.repos.obligation.getObligationData(id);
    if (!obligation) return undefined;

    const collateralCoinTypes = obligation.collaterals.map((collateral) => {
      return collateral.type;
    });
    const debtCoinTypes = obligation.debts.map((debt) => {
      return debt.type;
    });
    const obligationCoinTypes = [
      ...new Set([...collateralCoinTypes, ...debtCoinTypes]),
    ];
    const obligationCoinNames = obligationCoinTypes.map((coinType) => {
      return this.parseCoinNameFromType(coinType);
    });
    return obligationCoinNames;
  }

  private parseDataFromPythPriceFeed(feed: PriceFeed) {
    const assetCoinNames = [...this.constants.whitelist.lending] as string[];
    const assetCoinName = assetCoinNames.find((assetCoinName) => {
      return (
        this.address.get(`core.coins.${assetCoinName}.oracle.pyth.feed`) ===
        feed.id
      );
    });

    if (assetCoinName) {
      const parsedPrice = feed.getPriceUnchecked();
      return {
        coinName: assetCoinName,
        price: parsedPrice.getPriceAsNumberUnchecked(),
        publishTime: Number(parsedPrice.publishTime) * 10 ** 3,
      };
    } else {
      throw new Error(`Invalid feed id: ${feed.id}`);
    }
  }

  async getPythPrice(
    assetCoinName: string,
    priceFeedObject?: SuiObjectData | null
  ) {
    const pythFeedObjectId = this.address.get(
      `core.coins.${assetCoinName}.oracle.pyth.feedObject`
    );
    const priceFeedId = this.address.get(
      `core.coins.${assetCoinName}.oracle.pyth.feed`
    );
    priceFeedObject ??=
      await this.repos.price.getPythFeedObject(pythFeedObjectId);

    if (priceFeedObject?.json) {
      const parsed = parseObjectAs<{
        id: string;
        price_info: {
          arrival_time: number;
          attestation_time: number;
          price_feed: {
            ema_price: {
              conf: string;
              expo: { magnitude: string; negative: boolean };
              price: { magnitude: string; negative: boolean };
              timestamp: string;
            };
            price: {
              conf: string;
              expo: { magnitude: string; negative: boolean };
              price: { magnitude: string; negative: boolean };
              timestamp: string;
            };
            price_identifier: {
              bytes: string;
            };
          };
        };
      }>(priceFeedObject);

      const priceFields = parsed.price_info.price_feed.price;
      const expoMagnitude = Number(priceFields?.expo?.magnitude);
      const expoNegative = Number(priceFields?.expo?.negative);
      const priceMagnitude = Number(priceFields?.price?.magnitude);
      const priceNegative = Number(priceFields?.price?.negative);

      if (!Number.isNaN(expoMagnitude) && !Number.isNaN(priceMagnitude)) {
        const price =
          priceMagnitude *
          10 ** ((expoNegative ? -1 : 1) * expoMagnitude) *
          (priceNegative ? -1 : 1);
        if (price > 0) return price;
      }
    }

    if (priceFeedId) {
      try {
        const pythConnection = new SuiPriceServiceConnection(
          this.pythEndpoints[0],
          { timeout: this.timeout, httpRetries: 0 }
        );
        const feeds = await pythConnection.getLatestPriceFeeds([priceFeedId]);
        if (feeds?.[0]) {
          const parsed = feeds[0].getPriceUnchecked();
          return parsed.getPriceAsNumberUnchecked();
        }
      } catch {
        // ignore
      }
    }

    return 0;
  }

  async getPythPrices(assetCoinNames: string[]) {
    const pythPriceFeedIds = assetCoinNames.reduce(
      (prev, assetCoinName) => {
        const pythPriceFeed = this.address.get(
          `core.coins.${assetCoinName}.oracle.pyth.feedObject`
        );
        if (pythPriceFeed) {
          if (!prev[pythPriceFeed]) {
            prev[pythPriceFeed] = [assetCoinName];
          } else {
            prev[pythPriceFeed].push(assetCoinName);
          }
        }
        return prev;
      },
      {} as Record<string, string[]>
    );

    // Fetch multiple objects at once to save rpc calls
    const priceFeedObjects = await this.repos.price.getPythFeedObjects(
      Object.keys(pythPriceFeedIds)
    );

    const assetToPriceFeedMapping = priceFeedObjects.reduce(
      (prev, priceFeedObject) => {
        pythPriceFeedIds[priceFeedObject.objectId].forEach((assetCoinName) => {
          prev[assetCoinName] = priceFeedObject;
        });
        return prev;
      },
      {} as Record<string, SuiObjectData>
    );

    return (
      await Promise.all(
        Object.entries(assetToPriceFeedMapping).map(
          async ([coinName, feed]) => {
            try {
              const price = await this.getPythPrice(coinName, feed);
              return { coinName, price };
            } catch (e) {
              this.logger.error(`pyth price failed for ${coinName}`, {
                message: (e as Error)?.message,
              });
              return { coinName, price: 0 };
            }
          }
        )
      )
    ).reduce(
      (prev, curr) => {
        prev[curr.coinName as string] = curr.price;
        return prev;
      },
      {} as Record<string, number>
    );
  }

  /**
   * Get asset coin price.
   *
   * @description
   * The strategy for obtaining the price is to get it through pyth API first,
   * and then on-chain data if API cannot be retrieved.
   * Currently, we only support obtaining from pyth protocol, other
   * oracles will be supported in the future.
   *
   * @param assetCoinNames - Specific an array of support asset coin name.
   * @return  Asset coin price.
   */
  async getCoinPrices(
    coinNames: string[] = [
      ...new Set([
        ...this.constants.whitelist.lending,
        ...this.constants.whitelist.collateral,
      ]),
    ] as string[],
    useOnChainObjects: boolean = false
  ) {
    const priceIdsMap = new Map(
      coinNames
        .map((coinName) => {
          const priceId = this.address.get(
            `core.coins.${coinName}.oracle.pyth.feed`
          );
          return priceId
            ? ([coinName, priceId] as [string, string])
            : undefined;
        })
        .filter((entry): entry is [string, string] => !!entry)
    );

    const priceIds = Array.from(priceIdsMap.values());
    const coinNamesMapped = Array.from(priceIdsMap.keys());
    const state = this.queryClient.getQueryState(
      queryKeys.oracle.getCoinPrices(priceIds)
    );

    if (state && state && Date.now() - (state.dataUpdatedAt ?? 0) < 30_000) {
      return state.data as CoinPrices;
    }

    let coinPrices: CoinPrices = {};

    if (!useOnChainObjects) {
      for (const endpoint of this.pythEndpoints) {
        const pythConnection = new SuiPriceServiceConnection(endpoint, {
          timeout: this.timeout,
          httpRetries: 0,
        });

        try {
          const feeds = await this.queryClient.fetchQuery({
            queryKey: queryKeys.oracle.getPythLatestPriceFeeds(
              endpoint,
              priceIds
            ),
            queryFn: async () => {
              return await pythConnection.getLatestPriceFeeds(priceIds);
            },
            retry: false,
            staleTime: 30_000,
            gcTime: 30_000,
          });
          if (!feeds) throw new Error('No feeds returned from pyth');

          if (feeds.length !== priceIds.length)
            throw new Error('Incomplete feeds returned from pyth');

          feeds.forEach((feed, idx) => {
            const coinName = coinNamesMapped[idx] as string;
            const data = this.parseDataFromPythPriceFeed(feed);
            coinPrices[coinName as string] = data.price;
          });
          this.queryClient.setQueryData(
            queryKeys.oracle.getCoinPrices(priceIds),
            coinPrices
          );
        } catch (e: any) {
          if ('status' in e && e.status === 403) {
            this.logger.info('trying next pyth endpoint', { endpoint });
            continue; // try next endpoint
          }
          this.logger.error('pyth endpoint request failed', {
            endpoint,
            message: e?.message,
          });
        }
      }
    }

    if (Object.keys(coinPrices).length === 0) {
      coinPrices = {
        ...coinPrices,
        ...(await this.getPythPrices(Array.from(coinNames))),
      };
      this.queryClient.setQueryData(
        queryKeys.oracle.getCoinPrices(priceIds),
        coinPrices
      );
    }

    return coinNames.reduce((prev, coinName) => {
      const price = coinPrices[coinName as string];
      if (typeof price === 'number' && price > 0) {
        prev[coinName as string] = price;
      }
      return prev;
    }, {} as CoinPrices);
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
          (poolAddress): poolAddress is PoolAddress =>
            poolAddress !== undefined &&
            this.constants.whitelist.lending.has(poolAddress.coinName)
        )
      : [];
  }
}

export default ScallopUtils;
