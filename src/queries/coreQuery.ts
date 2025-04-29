import { normalizeStructTag, SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import {
  parseOriginMarketPoolData,
  calculateMarketPoolData,
  parseOriginMarketCollateralData,
  calculateMarketCollateralData,
  parseObjectAs,
} from '../utils';
import type {
  SuiObjectResponse,
  SuiObjectData,
  SuiParsedData,
} from '@mysten/sui/client';
import type { SuiObjectArg } from '@scallop-io/sui-kit';
// import type { ScallopAddress, ScallopCache, ScallopQuery } from '../models';
import {
  Market,
  MarketPools,
  MarketPool,
  MarketCollaterals,
  MarketCollateral,
  MarketQueryInterface,
  ObligationQueryInterface,
  Obligation,
  InterestModel,
  BalanceSheet,
  RiskModel,
  CollateralStat,
  OptionalKeys,
  CoinPrices,
  OriginMarketPoolData,
  BorrowFee,
  BorrowDynamic,
  OriginMarketCollateralData,
} from '../types';
import BigNumber from 'bignumber.js';
import { getSupplyLimit } from './supplyLimitQuery';
import { isIsolatedAsset } from './isolatedAssetQuery';
import { getBorrowLimit } from './borrowLimitQuery';
import { queryFlashLoanFees } from './flashloanFeeQuery';
import {
  ScallopSuiKit,
  ScallopQuery,
  ScallopUtils,
  ScallopIndexer,
  ScallopAddress,
} from 'src/models';

/**
 * Query market data.
 *
 * @deprecated Use query market pools
 *
 * @description
 * Use inspectTxn call to obtain the data provided in the scallop contract query module.
 *
 * @param query - The Scallop query instance.
 * @param indexer - Whether to use indexer.
 * @return Market data.
 */
export const queryMarket = async (
  {
    utils,
    indexer,
  }: {
    utils: ScallopUtils;
    indexer: ScallopIndexer;
  },
  useIndexer: boolean = false,
  coinPrices?: CoinPrices
) => {
  coinPrices = coinPrices ?? (await utils.getCoinPrices()) ?? {};

  const pools: MarketPools = {};
  const collaterals: MarketCollaterals = {};

  if (useIndexer) {
    const marketIndexer = await indexer.getMarket();

    const updatePools = (item: MarketPool) => {
      item.coinPrice = coinPrices[item.coinName] ?? item.coinPrice;
      item.coinWrappedType = utils.getCoinWrappedType(item.coinName);
      pools[item.coinName] = item;
    };

    const updateCollaterals = (item: MarketCollateral) => {
      item.coinPrice = coinPrices[item.coinName] ?? item.coinPrice;
      item.coinWrappedType = utils.getCoinWrappedType(item.coinName);
      collaterals[item.coinName] = item;
    };

    Object.values(marketIndexer.pools)
      .filter((t) => !!t)
      .forEach(updatePools);
    Object.values(marketIndexer.collaterals)
      .filter((t) => !!t)
      .forEach(updateCollaterals);

    return {
      pools,
      collaterals,
    };
  }

  const packageId = utils.address.get('core.packages.query.id');
  const marketId = utils.address.get('core.market');
  const queryTarget = `${packageId}::market_query::market_data`;
  const args = [marketId];

  const queryResult = await utils.scallopSuiKit.queryInspectTxn({
    queryTarget,
    args,
  });
  const marketData = queryResult?.events[0]?.parsedJson as
    | MarketQueryInterface
    | undefined;

  for (const pool of marketData?.pools ?? []) {
    const coinType = normalizeStructTag(pool.type.name);
    const poolCoinName = utils.parseCoinNameFromType(coinType);
    const coinPrice = coinPrices[poolCoinName] ?? 0;

    // Filter pools not yet supported by the SDK.
    if (!utils.constants.whitelist.lending.has(poolCoinName)) {
      continue;
    }

    const parsedMarketPoolData = parseOriginMarketPoolData({
      type: pool.type,
      maxBorrowRate: pool.maxBorrowRate,
      interestRate: pool.interestRate,
      interestRateScale: pool.interestRateScale,
      borrowIndex: pool.borrowIndex,
      lastUpdated: pool.lastUpdated,
      cash: pool.cash,
      debt: pool.debt,
      marketCoinSupply: pool.marketCoinSupply,
      reserve: pool.reserve,
      reserveFactor: pool.reserveFactor,
      borrowWeight: pool.borrowWeight,
      borrowFeeRate: pool.borrowFeeRate,
      baseBorrowRatePerSec: pool.baseBorrowRatePerSec,
      borrowRateOnHighKink: pool.borrowRateOnHighKink,
      borrowRateOnMidKink: pool.borrowRateOnMidKink,
      highKink: pool.highKink,
      midKink: pool.midKink,
      minBorrowAmount: pool.minBorrowAmount,
      isIsolated: await isIsolatedAsset(utils, poolCoinName),
      supplyLimit: (await getSupplyLimit(utils, poolCoinName)) ?? '0',
      borrowLimit: (await getBorrowLimit(utils, poolCoinName)) ?? '0',
    });

    const calculatedMarketPoolData = calculateMarketPoolData(
      utils,
      parsedMarketPoolData
    );

    pools[poolCoinName] = {
      coinName: poolCoinName,
      symbol: utils.parseSymbol(poolCoinName),
      coinType: coinType,
      marketCoinType: utils.parseMarketCoinType(poolCoinName),
      sCoinType:
        utils.parseSCoinType(utils.parseMarketCoinName(poolCoinName)) ?? '',
      coinWrappedType: utils.getCoinWrappedType(poolCoinName),
      coinPrice: coinPrice,
      highKink: parsedMarketPoolData.highKink,
      midKink: parsedMarketPoolData.midKink,
      reserveFactor: parsedMarketPoolData.reserveFactor,
      borrowWeight: parsedMarketPoolData.borrowWeight,
      borrowFee: parsedMarketPoolData.borrowFee,
      marketCoinSupplyAmount: parsedMarketPoolData.marketCoinSupplyAmount,
      minBorrowAmount: parsedMarketPoolData.minBorrowAmount,
      ...calculatedMarketPoolData,
    };
  }

  for (const collateral of marketData?.collaterals ?? []) {
    const coinType = normalizeStructTag(collateral.type.name);
    const collateralCoinName = utils.parseCoinNameFromType(coinType);
    const coinPrice = coinPrices[collateralCoinName] ?? 0;

    // Filter collaterals not yet supported by the SDK.
    if (!utils.constants.whitelist.collateral.has(collateralCoinName)) {
      continue;
    }

    const parsedMarketCollateralData = parseOriginMarketCollateralData({
      type: collateral.type,
      collateralFactor: collateral.collateralFactor,
      liquidationFactor: collateral.liquidationFactor,
      liquidationDiscount: collateral.liquidationDiscount,
      liquidationPenalty: collateral.liquidationPanelty,
      liquidationReserveFactor: collateral.liquidationReserveFactor,
      maxCollateralAmount: collateral.maxCollateralAmount,
      totalCollateralAmount: collateral.totalCollateralAmount,
      isIsolated: await isIsolatedAsset(utils, collateralCoinName),
    });

    const calculatedMarketCollateralData = calculateMarketCollateralData(
      utils,
      parsedMarketCollateralData
    );

    collaterals[collateralCoinName] = {
      coinName: collateralCoinName,
      symbol: utils.parseSymbol(collateralCoinName),
      coinType: coinType,
      marketCoinType: utils.parseMarketCoinType(collateralCoinName),
      coinWrappedType: utils.getCoinWrappedType(collateralCoinName),
      coinPrice: coinPrice,
      collateralFactor: parsedMarketCollateralData.collateralFactor,
      liquidationFactor: parsedMarketCollateralData.liquidationFactor,
      liquidationDiscount: parsedMarketCollateralData.liquidationDiscount,
      liquidationPenalty: parsedMarketCollateralData.liquidationPenalty,
      liquidationReserveFactor:
        parsedMarketCollateralData.liquidationReserveFactor,

      ...calculatedMarketCollateralData,
    };
  }

  return {
    pools,
    collaterals,
    // data: marketData,
  } as Market;
};

const queryRequiredMarketObjects = async (
  {
    utils,
    scallopSuiKit,
  }: {
    utils: ScallopUtils;
    scallopSuiKit: ScallopSuiKit;
  },
  poolCoinNames: string[]
) => {
  // Phase 1: Single-pass data preparation with proper typing
  type KeyType = {
    balanceSheet?: string;
    collateralStat?: string;
    borrowDynamic?: string;
    interestModel?: string;
    riskModel?: string;
    borrowFeeKey?: string;
    supplyLimitKey?: string;
    borrowLimitKey?: string;
  };

  const keyCollections: Record<keyof KeyType, string[]> = {
    balanceSheet: [],
    collateralStat: [],
    borrowDynamic: [],
    interestModel: [],
    riskModel: [],
    borrowFeeKey: [],
    supplyLimitKey: [],
    borrowLimitKey: [],
  };

  const taskMap = new Map<string, KeyType>();

  // Single iteration to collect all keys and map tasks
  for (const poolCoinName of poolCoinNames) {
    const poolData = utils.constants.poolAddresses[poolCoinName];
    const task: KeyType = {
      balanceSheet: poolData?.lendingPoolAddress,
      collateralStat: poolData?.collateralPoolAddress,
      borrowDynamic: poolData?.borrowDynamic,
      interestModel: poolData?.interestModel,
      riskModel: poolData?.riskModel,
      borrowFeeKey: poolData?.borrowFeeKey,
      supplyLimitKey: poolData?.supplyLimitKey,
      borrowLimitKey: poolData?.borrowLimitKey,
    };

    // Add to key collections
    (Object.entries(task) as [keyof KeyType, string | undefined][]).forEach(
      ([key, value]) => {
        if (value) keyCollections[key].push(value);
      }
    );

    taskMap.set(poolCoinName, task);
  }

  // Phase 2: Parallel queries with pre-collected keys
  const options = {
    showContent: true,
  };
  const queryResults = await Promise.all([
    scallopSuiKit.queryGetObjects(keyCollections.balanceSheet, options),
    scallopSuiKit.queryGetObjects(keyCollections.collateralStat, options),
    scallopSuiKit.queryGetObjects(keyCollections.borrowDynamic, options),
    scallopSuiKit.queryGetObjects(keyCollections.interestModel, options),
    scallopSuiKit.queryGetObjects(keyCollections.riskModel, options),
    scallopSuiKit.queryGetObjects(keyCollections.borrowFeeKey, options),
    scallopSuiKit.queryGetObjects(keyCollections.supplyLimitKey, options),
    scallopSuiKit.queryGetObjects(keyCollections.borrowLimitKey, options),
  ]);

  // Phase 3: Single-pass result mapping
  const resultMaps = {
    balanceSheet: new Map<string, SuiObjectData>(),
    collateralStat: new Map<string, SuiObjectData>(),
    borrowDynamic: new Map<string, SuiObjectData>(),
    interestModel: new Map<string, SuiObjectData>(),
    riskModel: new Map<string, SuiObjectData>(),
    borrowFeeKey: new Map<string, SuiObjectData>(),
    supplyLimitKey: new Map<string, SuiObjectData>(),
    borrowLimitKey: new Map<string, SuiObjectData>(),
    isIsolated: new Map<string, boolean>(),
  } as Record<keyof KeyType, Map<string, SuiObjectData>>;

  queryResults.forEach((objects, index) => {
    const keyType = Object.keys(resultMaps)[index] as keyof KeyType;
    objects.forEach((obj) => {
      resultMaps[keyType].set(obj.objectId, obj);
    });
  });

  // Phase 4: Efficient result construction
  const result: Record<string, any> = {};
  for (const [poolCoinName, task] of taskMap) {
    result[poolCoinName] = {
      balanceSheet: task.balanceSheet
        ? resultMaps.balanceSheet.get(task.balanceSheet)
        : undefined,
      collateralStat: task.collateralStat
        ? resultMaps.collateralStat.get(task.collateralStat)
        : undefined,
      borrowDynamic: task.borrowDynamic
        ? resultMaps.borrowDynamic.get(task.borrowDynamic)
        : undefined,
      interestModel: task.interestModel
        ? resultMaps.interestModel.get(task.interestModel)
        : undefined,
      riskModel: task.riskModel
        ? resultMaps.riskModel.get(task.riskModel)
        : undefined,
      borrowFeeKey: task.borrowFeeKey
        ? resultMaps.borrowFeeKey.get(task.borrowFeeKey)
        : undefined,
      supplyLimitKey: task.supplyLimitKey
        ? resultMaps.supplyLimitKey.get(task.supplyLimitKey)
        : undefined,
      borrowLimitKey: task.borrowLimitKey
        ? resultMaps.borrowLimitKey.get(task.borrowLimitKey)
        : undefined,
      isolatedAssetKey: utils.constants.poolAddresses[poolCoinName]?.isIsolated,
    };
  }

  return result;
};

/**
 * Get coin market pools data.
 *
 * @description
 * To obtain all market pools information at once, it is recommended to use
 * the `queryMarket` method to reduce time consumption.
 *
 * @param query - The Scallop query instance.
 * @param coinNames - Specific an array of support pool coin name.
 * @param indexer - Whether to use indexer.
 * @return Market pools data.
 */
export const getMarketPools = async (
  query: ScallopQuery,
  poolCoinNames: string[],
  indexer: boolean = false,
  coinPrices?: CoinPrices
): Promise<{
  pools: MarketPools;
  collaterals: MarketCollaterals;
}> => {
  coinPrices = coinPrices ?? (await query.utils.getCoinPrices());

  const pools: MarketPools = {};
  const collaterals: MarketCollaterals = {};

  if (indexer) {
    const marketIndexer = await query.indexer.getMarket();

    const updatePools = (item: MarketPool) => {
      item.coinPrice = coinPrices[item.coinName] ?? item.coinPrice;
      item.coinWrappedType = query.utils.getCoinWrappedType(item.coinName);
      pools[item.coinName] = item;
    };

    const updateCollaterals = (item: MarketCollateral) => {
      item.coinPrice = coinPrices[item.coinName] ?? item.coinPrice;
      item.coinWrappedType = query.utils.getCoinWrappedType(item.coinName);
      collaterals[item.coinName] = item;
    };

    Object.values(marketIndexer.pools)
      .filter((t) => !!t)
      .forEach(updatePools);
    Object.values(marketIndexer.collaterals)
      .filter((t) => !!t)
      .forEach(updateCollaterals);

    return {
      pools,
      collaterals,
    };
  }

  const requiredObjects = await queryRequiredMarketObjects(
    query,
    poolCoinNames
  );

  await Promise.allSettled(
    poolCoinNames.map(async (poolCoinName) => {
      try {
        const result = await getMarketPool(
          query,
          poolCoinName,
          indexer,
          coinPrices?.[poolCoinName] ?? 0,
          requiredObjects[poolCoinName]
        );
        if (result?.marketPool) {
          pools[poolCoinName] = result?.marketPool;
        }
        if (result?.collateral) {
          collaterals[poolCoinName as string] = result.collateral;
        }
      } catch (e) {
        console.error(e);
      }
    })
  );

  return {
    pools,
    collaterals,
  };
};

const parseMarketPoolObjects = ({
  balanceSheet,
  borrowDynamic,
  collateralStat,
  interestModel,
  riskModel,
  borrowFeeKey,
  supplyLimitKey,
  borrowLimitKey,
  isIsolated,
}: {
  balanceSheet?: SuiObjectData;
  borrowDynamic?: SuiObjectData;
  collateralStat?: SuiObjectData;
  interestModel?: SuiObjectData;
  riskModel?: SuiObjectData;
  borrowFeeKey?: SuiObjectData;
  supplyLimitKey?: SuiObjectData;
  borrowLimitKey?: SuiObjectData;
  isIsolated: boolean;
}): OriginMarketPoolData & {
  parsedOriginMarketCollateral?: OriginMarketCollateralData;
} => {
  if (!balanceSheet || !borrowDynamic || !interestModel) {
    throw new Error('Missing required market objects');
  }
  const _balanceSheet = parseObjectAs<BalanceSheet>(balanceSheet);
  const _interestModel = parseObjectAs<InterestModel>(interestModel);
  const _borrowDynamic = parseObjectAs<BorrowDynamic>(borrowDynamic);
  const _borrowFee = borrowFeeKey
    ? parseObjectAs<BorrowFee>(borrowFeeKey)
    : { value: '0' };
  const _supplyLimit = supplyLimitKey
    ? parseObjectAs<string>(supplyLimitKey)
    : '0';
  const _borrowLimit = borrowLimitKey
    ? parseObjectAs<string>(borrowLimitKey)
    : '0';
  const _riskModel = riskModel
    ? parseObjectAs<RiskModel>(riskModel)
    : undefined;
  const _collateralStat = collateralStat
    ? parseObjectAs<CollateralStat>(collateralStat)
    : undefined;

  const parsedOriginMarketCollateral =
    _riskModel && _collateralStat
      ? {
          type: _interestModel.type.fields,
          isIsolated: isIsolated,
          collateralFactor: _riskModel.collateral_factor.fields,
          liquidationFactor: _riskModel.liquidation_factor.fields,
          liquidationPenalty: _riskModel.liquidation_penalty.fields,
          liquidationDiscount: _riskModel.liquidation_discount.fields,
          liquidationReserveFactor:
            _riskModel.liquidation_revenue_factor.fields,
          maxCollateralAmount: _riskModel.max_collateral_amount,
          totalCollateralAmount: _collateralStat.amount,
        }
      : undefined;

  return {
    type: _interestModel.type.fields,
    maxBorrowRate: _interestModel.max_borrow_rate.fields,
    interestRate: _borrowDynamic.interest_rate.fields,
    interestRateScale: _borrowDynamic.interest_rate_scale,
    borrowIndex: _borrowDynamic.borrow_index,
    lastUpdated: _borrowDynamic.last_updated,
    cash: _balanceSheet.cash,
    debt: _balanceSheet.debt,
    marketCoinSupply: _balanceSheet.market_coin_supply,
    reserve: _balanceSheet.revenue,
    reserveFactor: _interestModel.revenue_factor.fields,
    borrowWeight: _interestModel.borrow_weight.fields,
    borrowFeeRate: _borrowFee,
    baseBorrowRatePerSec: _interestModel.base_borrow_rate_per_sec.fields,
    borrowRateOnHighKink: _interestModel.borrow_rate_on_high_kink.fields,
    borrowRateOnMidKink: _interestModel.borrow_rate_on_mid_kink.fields,
    highKink: _interestModel.high_kink.fields,
    midKink: _interestModel.mid_kink.fields,
    minBorrowAmount: _interestModel.min_borrow_amount,
    isIsolated,
    supplyLimit: _supplyLimit,
    borrowLimit: _borrowLimit,
    parsedOriginMarketCollateral,
  };
};

/**
 * Get market pool data.
 *
 * @param query - The Scallop query instance.
 * @param poolCoinName - Specific support pool coin name.
 * @param indexer - Whether to use indexer.
 * @param marketObject - The market object.
 * @param coinPrice - The coin price.
 * @returns Market pool data.
 */
export const getMarketPool = async (
  query: ScallopQuery,
  poolCoinName: string,
  indexer: boolean = false,
  coinPrice: number,
  requiredObjects?: {
    balanceSheet: SuiObjectData;
    borrowDynamic: SuiObjectData;
    interestModel: SuiObjectData;
    borrowFeeKey: SuiObjectData;
    supplyLimitKey: SuiObjectData;
    borrowLimitKey: SuiObjectData;
    isIsolated: boolean;
  }
): Promise<
  { marketPool: MarketPool; collateral?: MarketCollateral } | undefined
> => {
  coinPrice = coinPrice ?? (await query.utils.getCoinPrices())?.[poolCoinName];

  if (indexer) {
    const marketPoolIndexer = await query.indexer.getMarketPool(poolCoinName);
    if (!marketPoolIndexer) {
      return undefined;
    }
    marketPoolIndexer.coinPrice = coinPrice ?? marketPoolIndexer.coinPrice;
    marketPoolIndexer.coinWrappedType = query.utils.getCoinWrappedType(
      marketPoolIndexer.coinName
    );

    let marketCollateralIndexer: MarketCollateral | undefined = undefined;
    if (query.constants.whitelist.collateral.has(poolCoinName as string)) {
      marketCollateralIndexer = await query.indexer.getMarketCollateral(
        poolCoinName as string
      );
      marketCollateralIndexer.coinPrice =
        coinPrice ?? marketCollateralIndexer.coinPrice;
      marketCollateralIndexer.coinWrappedType = query.utils.getCoinWrappedType(
        marketCollateralIndexer.coinName
      );
    }

    return {
      marketPool: marketPoolIndexer,
      collateral: marketCollateralIndexer,
    };
  }

  requiredObjects ??= (await queryRequiredMarketObjects(query, [poolCoinName]))[
    poolCoinName
  ];

  if (!requiredObjects)
    throw new Error(
      `Failed to fetch required market objects for ${poolCoinName}`
    );
  const parsedMarketPoolObjects = parseMarketPoolObjects(requiredObjects);
  const parsedMarketPoolData = parseOriginMarketPoolData(
    parsedMarketPoolObjects
  );
  const calculatedMarketPoolData = calculateMarketPoolData(
    query.utils,
    parsedMarketPoolData
  );
  const parsedMarketCollateralData =
    parsedMarketPoolObjects.parsedOriginMarketCollateral
      ? parseOriginMarketCollateralData(
          parsedMarketPoolObjects.parsedOriginMarketCollateral
        )
      : undefined;

  const basePoolData = <T extends string = string>() => ({
    coinName: poolCoinName as T,
    symbol: query.utils.parseSymbol(poolCoinName),
    marketCoinType: query.utils.parseMarketCoinType(poolCoinName),
    coinType: query.utils.parseCoinType(poolCoinName),
  });
  return {
    marketPool: {
      ...basePoolData(),
      sCoinType:
        query.utils.parseSCoinType(
          query.utils.parseMarketCoinName(poolCoinName)
        ) ?? '',
      coinWrappedType: query.utils.getCoinWrappedType(poolCoinName),
      coinPrice: coinPrice ?? 0,
      highKink: parsedMarketPoolData.highKink,
      midKink: parsedMarketPoolData.midKink,
      reserveFactor: parsedMarketPoolData.reserveFactor,
      borrowWeight: parsedMarketPoolData.borrowWeight,
      borrowFee: parsedMarketPoolData.borrowFee,
      marketCoinSupplyAmount: parsedMarketPoolData.marketCoinSupplyAmount,
      minBorrowAmount: parsedMarketPoolData.minBorrowAmount,
      ...calculatedMarketPoolData,
    },
    collateral: parsedMarketCollateralData
      ? {
          ...basePoolData<string>(),
          coinWrappedType: query.utils.getCoinWrappedType(poolCoinName),
          coinPrice: coinPrice,
          collateralFactor: parsedMarketCollateralData.collateralFactor,
          liquidationFactor: parsedMarketCollateralData.liquidationFactor,
          liquidationDiscount: parsedMarketCollateralData.liquidationDiscount,
          liquidationPenalty: parsedMarketCollateralData.liquidationPenalty,
          liquidationReserveFactor:
            parsedMarketCollateralData.liquidationReserveFactor,
          ...calculateMarketCollateralData(
            query.utils,
            parsedMarketCollateralData
          ),
        }
      : undefined,
  };
};

/**
 * Get coin market collaterals data.
 *
 * @description
 * To obtain all market collaterals information at once, it is recommended to use
 * the `queryMarket` method to reduce time consumption.
 *
 * @param query - The Scallop query instance.
 * @param collateralCoinNames - Specific an array of support collateral coin name.
 * @param indexer - Whether to use indexer.
 * @return Market collaterals data.
 */
export const getMarketCollaterals = async (
  {
    utils,
    indexer,
    scallopSuiKit,
  }: {
    utils: ScallopUtils;
    indexer: ScallopIndexer;
    scallopSuiKit: ScallopSuiKit;
  },
  collateralCoinNames: string[] = [...utils.constants.whitelist.collateral],
  useIndexer: boolean = false
) => {
  const marketId = utils.address.get('core.market');
  const coinPrices = (await utils.getCoinPrices()) ?? {};
  const marketCollaterals: MarketCollaterals = {};

  if (useIndexer) {
    const marketCollateralsIndexer = await indexer.getMarketCollaterals();
    const updateMarketCollateral = (marketCollateral: MarketCollateral) => {
      if (!collateralCoinNames.includes(marketCollateral.coinName)) return;
      marketCollateral.coinPrice =
        coinPrices[marketCollateral.coinName] ?? marketCollateral.coinPrice;
      marketCollateral.coinWrappedType = utils.getCoinWrappedType(
        marketCollateral.coinName
      );
      marketCollaterals[marketCollateral.coinName] = marketCollateral;
    };
    Object.values(marketCollateralsIndexer)
      .filter((t) => !!t)
      .forEach(updateMarketCollateral);
    return marketCollaterals;
  }

  const marketObjectResponse = await scallopSuiKit.queryGetObject(marketId);
  await Promise.allSettled(
    collateralCoinNames.map(async (collateralCoinName) => {
      const marketCollateral = await getMarketCollateral(
        {
          utils,
          indexer,
          scallopSuiKit,
        },
        collateralCoinName,
        useIndexer,
        marketObjectResponse?.data,
        coinPrices?.[collateralCoinName]
      );

      if (marketCollateral) {
        marketCollaterals[collateralCoinName] = marketCollateral;
      }
    })
  );

  return marketCollaterals;
};

/**
 * Get market collateral data.
 *
 * @param query - The Scallop query instance.
 * @param collateralCoinName - Specific support collateral coin name.
 * @param indexer - Whether to use indexer.
 * @param marketObject - The market object.
 * @param coinPrice - The coin price.
 * @returns Market collateral data.
 */
export const getMarketCollateral = async (
  {
    utils,
    indexer,
    scallopSuiKit,
  }: {
    utils: ScallopUtils;
    indexer: ScallopIndexer;
    scallopSuiKit: ScallopSuiKit;
  },
  collateralCoinName: string,
  useIndexer: boolean = false,
  marketObject?: SuiObjectData | null,
  coinPrice?: number
): Promise<MarketCollateral | undefined> => {
  coinPrice = coinPrice ?? (await utils.getCoinPrices())?.[collateralCoinName];

  if (useIndexer) {
    const marketCollateralIndexer =
      await indexer.getMarketCollateral(collateralCoinName);
    marketCollateralIndexer.coinPrice =
      coinPrice ?? marketCollateralIndexer.coinPrice;
    marketCollateralIndexer.coinWrappedType = utils.getCoinWrappedType(
      marketCollateralIndexer.coinName
    );

    return marketCollateralIndexer;
  }

  // let marketCollateral: MarketCollateral | undefined;
  // let riskModel: RiskModel | undefined;
  // let collateralStat: CollateralStat | undefined;

  const marketId = utils.address.get('core.market');
  marketObject =
    marketObject || (await scallopSuiKit.queryGetObject(marketId))?.data;

  if (!(marketObject && marketObject.content?.dataType === 'moveObject'))
    throw new Error(`Failed to fetch marketObject`);

  const fields = marketObject.content.fields as any;
  const coinType = utils.parseCoinType(collateralCoinName);

  // Get risk model.
  const riskModelParentId = fields.risk_models.fields.table.fields.id.id;
  const riskModelDynamicFieldObjectResponse =
    await scallopSuiKit.queryGetDynamicFieldObject({
      parentId: riskModelParentId,
      name: {
        type: '0x1::type_name::TypeName',
        value: {
          name: coinType.substring(2),
        },
      },
    });

  const riskModelDynamicFieldObject = riskModelDynamicFieldObjectResponse?.data;
  if (
    !(
      riskModelDynamicFieldObject &&
      riskModelDynamicFieldObject.content &&
      'fields' in riskModelDynamicFieldObject.content
    )
  )
    throw new Error(
      `Failed to fetch riskModelDynamicFieldObject for ${riskModelDynamicFieldObjectResponse?.error?.code.toString()}: `
    );

  const riskModel: RiskModel = (
    riskModelDynamicFieldObject.content.fields as any
  ).value.fields;

  // Get collateral stat.
  const collateralStatParentId =
    fields.collateral_stats.fields.table.fields.id.id;
  const collateralStatDynamicFieldObjectResponse =
    await scallopSuiKit.queryGetDynamicFieldObject({
      parentId: collateralStatParentId,
      name: {
        type: '0x1::type_name::TypeName',
        value: {
          name: coinType.substring(2),
        },
      },
    });

  const collateralStatDynamicFieldObject =
    collateralStatDynamicFieldObjectResponse?.data;

  if (
    !(
      collateralStatDynamicFieldObject &&
      collateralStatDynamicFieldObject.content &&
      'fields' in collateralStatDynamicFieldObject.content
    )
  )
    throw new Error(
      `Failed to fetch collateralStatDynamicFieldObject for ${collateralCoinName}: ${collateralStatDynamicFieldObjectResponse?.error?.code.toString()}`
    );

  const collateralStat: CollateralStat = (
    collateralStatDynamicFieldObject.content.fields as any
  ).value.fields;

  const parsedMarketCollateralData = parseOriginMarketCollateralData({
    type: riskModel.type.fields,
    collateralFactor: riskModel.collateral_factor.fields,
    liquidationFactor: riskModel.liquidation_factor.fields,
    liquidationDiscount: riskModel.liquidation_discount.fields,
    liquidationPenalty: riskModel.liquidation_penalty.fields,
    liquidationReserveFactor: riskModel.liquidation_revenue_factor.fields,
    maxCollateralAmount: riskModel.max_collateral_amount,
    totalCollateralAmount: collateralStat.amount,
    isIsolated: await isIsolatedAsset(utils, collateralCoinName),
  });

  const calculatedMarketCollateralData = calculateMarketCollateralData(
    utils,
    parsedMarketCollateralData
  );

  return {
    coinName: collateralCoinName,
    symbol: utils.parseSymbol(collateralCoinName),
    coinType: utils.parseCoinType(collateralCoinName),
    marketCoinType: utils.parseMarketCoinType(collateralCoinName),
    coinWrappedType: utils.getCoinWrappedType(collateralCoinName),
    coinPrice: coinPrice ?? 0,
    collateralFactor: parsedMarketCollateralData.collateralFactor,
    liquidationFactor: parsedMarketCollateralData.liquidationFactor,
    liquidationDiscount: parsedMarketCollateralData.liquidationDiscount,
    liquidationPenalty: parsedMarketCollateralData.liquidationPenalty,
    liquidationReserveFactor:
      parsedMarketCollateralData.liquidationReserveFactor,
    ...calculatedMarketCollateralData,
  };
};

/**
 * Query all owned obligations.
 *
 * @param query - The Scallop query instance.
 * @param ownerAddress - The owner address.
 * @return Owned obligations.
 */
export const getObligations = async (
  {
    utils,
  }: {
    utils: ScallopUtils;
  },
  ownerAddress: string
) => {
  const owner = ownerAddress;
  const protocolObjectId = utils.constants.protocolObjectId;
  const keyObjectsResponse: SuiObjectResponse[] = [];
  let hasNextPage = false;
  let nextCursor: string | null | undefined = null;
  do {
    const paginatedKeyObjectsResponse =
      await utils.scallopSuiKit.queryGetOwnedObjects({
        owner,
        filter: {
          StructType: `${protocolObjectId}::obligation::ObligationKey`,
        },
        options: {
          showContent: true,
        },
        cursor: nextCursor,
        limit: 10,
      });

    if (!paginatedKeyObjectsResponse) break;

    keyObjectsResponse.push(...paginatedKeyObjectsResponse.data);
    if (
      paginatedKeyObjectsResponse.hasNextPage &&
      paginatedKeyObjectsResponse.nextCursor
    ) {
      hasNextPage = true;
      nextCursor = paginatedKeyObjectsResponse.nextCursor;
    } else {
      hasNextPage = false;
    }
  } while (hasNextPage);

  const keyObjects = keyObjectsResponse.filter((ref) => !!ref.data);

  const obligations: Obligation[] = [];
  // fetch all obligations with multi get objects
  const obligationsObjects = await utils.scallopSuiKit.queryGetObjects(
    keyObjects
      .map((ref) => ref.data?.content)
      .filter(
        (content): content is SuiParsedData & { dataType: 'moveObject' } =>
          content?.dataType === 'moveObject'
      )
      .map((content) => (content.fields as any).ownership.fields.of)
  );

  await Promise.allSettled(
    keyObjects.map(async ({ data }, idx) => {
      const keyId = data?.objectId;
      const content = data?.content;
      if (keyId && content && 'fields' in content) {
        const fields = content.fields as any;
        const obligationId = String(fields.ownership.fields.of);
        const locked = await getObligationLocked(
          utils,
          obligationsObjects[idx]
        );
        obligations.push({ id: obligationId, keyId, locked });
      }
    })
  );

  return obligations;
};

/**
 * Query obligation locked status.
 *
 * @param query - The Scallop query instance.
 * @param obligation - The obligation id or the obligation object.
 * @return Obligation locked status.
 */
export const getObligationLocked = async (
  { scallopSuiKit }: { scallopSuiKit: ScallopSuiKit },
  obligation: string | SuiObjectData
) => {
  const obligationObjectData =
    typeof obligation === 'string'
      ? (await scallopSuiKit.queryGetObject(obligation))?.data
      : obligation;
  let obligationLocked = false;
  if (
    obligationObjectData &&
    obligationObjectData?.content?.dataType === 'moveObject' &&
    'lock_key' in obligationObjectData.content.fields
  ) {
    obligationLocked = Boolean(obligationObjectData.content.fields.lock_key);
  }

  return obligationLocked;
};

/**
 * Query obligation data.
 *
 * @description
 * Use inspectTxn call to obtain the data provided in the scallop contract query module.
 *
 * @param query - The Scallop query instance.
 * @param obligationId - The obligation id.
 * @return Obligation data.
 */
export const queryObligation = async (
  {
    address,
    scallopSuiKit,
  }: {
    address: ScallopAddress;
    scallopSuiKit: ScallopSuiKit;
  },
  obligationId: SuiObjectArg
) => {
  const packageId = address.get('core.packages.query.id');
  const version = address.get('core.version');
  const market = address.get('core.market');
  const queryTarget = `${packageId}::obligation_query::obligation_data`;

  const args = [
    version,
    market,
    obligationId,
    {
      objectId: SUI_CLOCK_OBJECT_ID,
      mutable: false,
      initialSharedVersion: '1',
    },
  ];

  const queryResult = await scallopSuiKit.queryInspectTxn(
    { queryTarget, args }
    // txBlock
  );
  return queryResult?.events[0]?.parsedJson as
    | ObligationQueryInterface
    | undefined;
};

/**
 * Query all owned coin amount.
 *
 * @param query - The Scallop query instance.
 * @param assetCoinNames - Specific an array of support asset coin name.
 * @param ownerAddress - The owner address.
 * @return All owned coin amounts.
 */
export const getCoinAmounts = async (
  { utils }: { utils: ScallopUtils },
  assetCoinNames: string[] = [...utils.constants.whitelist.lending],
  ownerAddress?: string
) => {
  const owner = ownerAddress ?? utils.walletAddress;
  const assetCoins = {} as OptionalKeys<Record<string, number>>;

  await Promise.allSettled(
    assetCoinNames.map(async (assetCoinName) => {
      const coinAmount = await getCoinAmount({ utils }, assetCoinName, owner);
      assetCoins[assetCoinName] = coinAmount;
    })
  );

  return assetCoins;
};

/**
 * Query owned coin amount.
 *
 * @param query - The Scallop query instance.
 * @param assetCoinName - Specific support asset coin name.
 * @param ownerAddress - The owner address.
 * @return Owned coin amount.
 */
export const getCoinAmount = async (
  { utils }: { utils: ScallopUtils },
  assetCoinName: string,
  ownerAddress?: string
) => {
  const owner = ownerAddress ?? utils.walletAddress;
  const coinType = utils.parseCoinType(assetCoinName);
  const coinBalance = await utils.scallopSuiKit.queryGetCoinBalance({
    owner,
    coinType: coinType,
  });
  return BigNumber(coinBalance?.totalBalance ?? '0').toNumber();
};

/**
 * Query all owned market coins (sCoin) amount.
 *
 * @param query - The Scallop query instance.
 * @param marketCoinNames - Specific an array of support market coin name.
 * @param ownerAddress - The owner address.
 * @return All owned market coins amount.
 */
export const getMarketCoinAmounts = async (
  { utils }: { utils: ScallopUtils },
  marketCoinNames?: string[],
  ownerAddress?: string
) => {
  marketCoinNames =
    marketCoinNames ||
    [...utils.constants.whitelist.lending].map((poolCoinName) =>
      utils.parseMarketCoinName(poolCoinName)
    );
  const owner = ownerAddress ?? utils.walletAddress;
  const marketCoins = {} as OptionalKeys<Record<string, number>>;

  await Promise.allSettled(
    marketCoinNames.map(async (marketCoinName) => {
      const marketCoin = await getMarketCoinAmount(
        { utils },
        marketCoinName,
        owner
      );
      marketCoins[marketCoinName] = marketCoin;
    })
  );

  return marketCoins;
};

/**
 * Query owned market coin (sCoin) amount.
 *
 * @param query - The Scallop query instance.
 * @param marketCoinNames - Specific support market coin name.
 * @param ownerAddress - The owner address.
 * @return Owned market coin amount.
 */
export const getMarketCoinAmount = async (
  { utils }: { utils: ScallopUtils },
  marketCoinName: string,
  ownerAddress?: string
) => {
  const owner = ownerAddress ?? utils.walletAddress;
  const marketCoinType = utils.parseMarketCoinType(marketCoinName);
  const coinBalance = await utils.scallopSuiKit.queryGetCoinBalance({
    owner,
    coinType: marketCoinType,
  });
  return BigNumber(coinBalance?.totalBalance ?? '0').toNumber();
};

/**
 * Get flashloan fee for specific asset
 * @param query - The Scallop query instance.
 * @param assetNames - Specific an array of support pool coin name.
 * @returns Record of asset name to flashloan fee in decimal
 */

export const getFlashLoanFees = async (
  { utils }: { utils: ScallopUtils },
  assetNames: string[],
  feeRate = 1e4
): Promise<Record<string, number>> => {
  const missingAssets: string[] = [];
  let results: Record<string, number> = {};

  // create mapping from asset type to asset name
  const assetTypeMap = assetNames.reduce(
    (prev, curr) => {
      const assetType = utils.parseCoinType(curr).slice(2);
      prev[assetType] = curr;
      return prev;
    },
    {} as Record<string, string>
  );

  // use the mapped object first
  const objIds = assetNames
    .map((assetName) => {
      const mappedFlashloanFeeObject =
        utils.constants.poolAddresses[assetName]?.flashloanFeeObject;
      if (!mappedFlashloanFeeObject) {
        missingAssets.push(assetName);
        return null;
      } else {
        return mappedFlashloanFeeObject;
      }
    })
    .filter((t) => !!t) as string[];

  const flashloanFeeObjects = await utils.scallopSuiKit.queryGetObjects(objIds);

  if (missingAssets.length > 0) {
    const missingDatas = await queryFlashLoanFees(
      utils,
      missingAssets,
      feeRate
    );
    results = { ...results, ...missingDatas };
  }

  results = {
    ...results,
    ...flashloanFeeObjects.reduce(
      (prev, curr) => {
        if (curr.content?.dataType === 'moveObject') {
          const objectFields = curr.content.fields as any;
          const assetType = (curr.content.fields as any).name.fields.name;
          const feeNumerator = +objectFields.value;
          prev[assetTypeMap[assetType]] = feeNumerator / feeRate;
        }
        return prev;
      },
      {} as Record<string, number>
    ),
  };
  return results;
};
