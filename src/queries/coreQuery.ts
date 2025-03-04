import { normalizeStructTag, SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import {
  SUPPORT_POOLS,
  PROTOCOL_OBJECT_ID,
  SUPPORT_COLLATERALS,
  FlashLoanFeeObjectMap,
  POOL_ADDRESSES,
} from '../constants';
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
import type { ScallopAddress, ScallopCache, ScallopQuery } from '../models';
import {
  Market,
  MarketPools,
  MarketPool,
  MarketCollaterals,
  MarketCollateral,
  MarketQueryInterface,
  SupportAssetCoins,
  SupportPoolCoins,
  SupportCollateralCoins,
  ObligationQueryInterface,
  Obligation,
  InterestModel,
  BalanceSheet,
  RiskModel,
  CollateralStat,
  SupportMarketCoins,
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
import { queryMultipleObjects } from './objectsQuery';

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
  query: ScallopQuery,
  indexer: boolean = false,
  coinPrices?: CoinPrices
) => {
  coinPrices = coinPrices ?? (await query.utils.getCoinPrices()) ?? {};

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

    Object.values(marketIndexer.pools).forEach(updatePools);
    Object.values(marketIndexer.collaterals).forEach(updateCollaterals);

    return {
      pools,
      collaterals,
    };
  }

  const packageId = query.address.get('core.packages.query.id');
  const marketId = query.address.get('core.market');
  const queryTarget = `${packageId}::market_query::market_data`;
  const args = [marketId];

  const queryResult = await query.cache.queryInspectTxn(
    { queryTarget, args },
    marketId
  );
  const marketData = queryResult?.events[0]?.parsedJson as
    | MarketQueryInterface
    | undefined;

  for (const pool of marketData?.pools ?? []) {
    const coinType = normalizeStructTag(pool.type.name);
    const poolCoinName =
      query.utils.parseCoinNameFromType<SupportPoolCoins>(coinType);
    const coinPrice = coinPrices[poolCoinName] ?? 0;

    // Filter pools not yet supported by the SDK.
    if (!SUPPORT_POOLS.includes(poolCoinName)) {
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
      isIsolated: await isIsolatedAsset(query.utils, poolCoinName),
      supplyLimit: (await getSupplyLimit(query.utils, poolCoinName)) ?? '0',
      borrowLimit: (await getBorrowLimit(query.utils, poolCoinName)) ?? '0',
    });

    const calculatedMarketPoolData = calculateMarketPoolData(
      query.utils,
      parsedMarketPoolData
    );

    pools[poolCoinName] = {
      coinName: poolCoinName,
      symbol: query.utils.parseSymbol(poolCoinName),
      coinType: coinType,
      marketCoinType: query.utils.parseMarketCoinType(poolCoinName),
      sCoinType: query.utils.parseSCoinType(
        query.utils.parseMarketCoinName(poolCoinName)
      ),
      coinWrappedType: query.utils.getCoinWrappedType(poolCoinName),
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
    const collateralCoinName =
      query.utils.parseCoinNameFromType<SupportCollateralCoins>(coinType);
    const coinPrice = coinPrices[collateralCoinName] ?? 0;

    // Filter collaterals not yet supported by the SDK.
    if (!SUPPORT_COLLATERALS.includes(collateralCoinName)) {
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
      isIsolated: await isIsolatedAsset(query.utils, collateralCoinName),
    });

    const calculatedMarketCollateralData = calculateMarketCollateralData(
      query.utils,
      parsedMarketCollateralData
    );

    collaterals[collateralCoinName] = {
      coinName: collateralCoinName,
      symbol: query.utils.parseSymbol(collateralCoinName),
      coinType: coinType,
      marketCoinType: query.utils.parseMarketCoinType(collateralCoinName),
      coinWrappedType: query.utils.getCoinWrappedType(collateralCoinName),
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
  query: ScallopQuery,
  poolCoinNames: SupportPoolCoins[]
) => {
  // Prepare all tasks for querying each object type
  const tasks = poolCoinNames.map((t) => ({
    poolCoinName: t,
    balanceSheet: POOL_ADDRESSES[t]?.lendingPoolAddress,
    collateralStat: POOL_ADDRESSES[t]?.collateralPoolAddress,
    borrowDynamic: POOL_ADDRESSES[t]?.borrowDynamic,
    interestModel: POOL_ADDRESSES[t]?.interestModel,
    riskModel: POOL_ADDRESSES[t]?.riskModel,
    borrowFeeKey: POOL_ADDRESSES[t]?.borrowFeeKey,
    supplyLimitKey: POOL_ADDRESSES[t]?.supplyLimitKey,
    borrowLimitKey: POOL_ADDRESSES[t]?.borrowLimitKey,
    isolatedAssetKey: POOL_ADDRESSES[t]?.isolatedAssetKey,
  }));

  // Query all objects for each key in parallel
  const [
    balanceSheetObjects,
    collateralStatObjects,
    borrowDynamicObjects,
    interestModelObjects,
    riskModelObjects,
    borrowFeeObjects,
    supplyLimitObjects,
    borrowLimitObjects,
    isolatedAssetObjects,
  ] = await Promise.all([
    queryMultipleObjects(
      query.cache,
      tasks.map((task) => task.balanceSheet).filter((t): t is string => !!t)
    ),
    queryMultipleObjects(
      query.cache,
      tasks.map((task) => task.collateralStat).filter((t): t is string => !!t)
    ),
    queryMultipleObjects(
      query.cache,
      tasks.map((task) => task.borrowDynamic).filter((t): t is string => !!t)
    ),
    queryMultipleObjects(
      query.cache,
      tasks.map((task) => task.interestModel).filter((t): t is string => !!t)
    ),
    queryMultipleObjects(
      query.cache,
      tasks.map((task) => task.riskModel).filter((t): t is string => !!t)
    ),
    queryMultipleObjects(
      query.cache,
      tasks.map((task) => task.borrowFeeKey).filter((t): t is string => !!t)
    ),
    queryMultipleObjects(
      query.cache,
      tasks.map((task) => task.supplyLimitKey).filter((t): t is string => !!t)
    ),
    queryMultipleObjects(
      query.cache,
      tasks.map((task) => task.borrowLimitKey).filter((t): t is string => !!t)
    ),
    queryMultipleObjects(
      query.cache,
      tasks.map((task) => task.isolatedAssetKey).filter((t): t is string => !!t)
    ),
  ]);

  // Map the results back to poolCoinNames
  const mapObjects = (
    tasks: { poolCoinName: string; [key: string]: string | undefined }[],
    fetchedObjects: SuiObjectData[],
    keyValue: string
  ) => {
    const resultMap: Record<string, SuiObjectData> = {};
    const fetchedObjectMap = fetchedObjects.reduce(
      (acc, obj) => {
        acc[obj.objectId] = obj;
        return acc;
      },
      {} as Record<string, SuiObjectData>
    );

    for (const task of tasks) {
      if (task[keyValue]) {
        resultMap[task.poolCoinName] = fetchedObjectMap[task[keyValue]];
      }
    }
    return resultMap;
  };

  const balanceSheetMap = mapObjects(
    tasks,
    balanceSheetObjects,
    'balanceSheet'
  );
  const collateralStatMap = mapObjects(
    tasks,
    collateralStatObjects,
    'collateralStat'
  );
  const borrowDynamicMap = mapObjects(
    tasks,
    borrowDynamicObjects,
    'borrowDynamic'
  );
  const interestModelMap = mapObjects(
    tasks,
    interestModelObjects,
    'interestModel'
  );
  const riskModelMap = mapObjects(tasks, riskModelObjects, 'riskModel');
  const borrowFeeMap = mapObjects(tasks, borrowFeeObjects, 'borrowFeeKey');
  const supplyLimitMap = mapObjects(
    tasks,
    supplyLimitObjects,
    'supplyLimitKey'
  );
  const borrowLimitMap = mapObjects(
    tasks,
    borrowLimitObjects,
    'borrowLimitKey'
  );
  const isolatedAssetMap = mapObjects(
    tasks,
    isolatedAssetObjects,
    'isolatedAssetKey'
  );
  // Construct the final requiredObjects result
  const result = poolCoinNames.reduce(
    (acc, name) => {
      acc[name] = {
        balanceSheet: balanceSheetMap[name],
        collateralStat: collateralStatMap[name],
        borrowDynamic: borrowDynamicMap[name],
        interestModel: interestModelMap[name],
        riskModel: riskModelMap[name],
        borrowFeeKey: borrowFeeMap[name],
        supplyLimitKey: supplyLimitMap[name],
        borrowLimitKey: borrowLimitMap[name],
        isolatedAssetKey: isolatedAssetMap[name],
      };
      return acc;
    },
    {} as Record<
      SupportPoolCoins,
      {
        balanceSheet: SuiObjectData;
        collateralStat?: SuiObjectData;
        riskModel?: SuiObjectData;
        borrowDynamic: SuiObjectData;
        interestModel: SuiObjectData;
        borrowFeeKey: SuiObjectData;
        supplyLimitKey: SuiObjectData;
        borrowLimitKey: SuiObjectData;
        isolatedAssetKey: SuiObjectData;
      }
    >
  );

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
  poolCoinNames: SupportPoolCoins[],
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
    // const marketPoolsIndexer = await query.indexer.getMarketPools();

    // const updateMarketPool = (marketPool: MarketPool) => {
    //   if (!poolCoinNames.includes(marketPool.coinName)) return;
    //   marketPool.coinPrice =
    //     coinPrices[marketPool.coinName] ?? marketPool.coinPrice;
    //   marketPool.coinWrappedType = query.utils.getCoinWrappedType(
    //     marketPool.coinName
    //   );
    //   pools[marketPool.coinName] = marketPool;
    // };

    // Object.values(marketPoolsIndexer).forEach(updateMarketPool);

    // return pools;
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

    Object.values(marketIndexer.pools).forEach(updatePools);
    Object.values(marketIndexer.collaterals).forEach(updateCollaterals);

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
          collaterals[poolCoinName as SupportCollateralCoins] =
            result.collateral;
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
  isolatedAssetKey,
}: {
  balanceSheet: SuiObjectData;
  borrowDynamic: SuiObjectData;
  collateralStat?: SuiObjectData;
  interestModel: SuiObjectData;
  riskModel?: SuiObjectData;
  borrowFeeKey: SuiObjectData;
  supplyLimitKey?: SuiObjectData;
  borrowLimitKey?: SuiObjectData;
  isolatedAssetKey: SuiObjectData;
}): OriginMarketPoolData & {
  parsedOriginMarketCollateral?: OriginMarketCollateralData;
} => {
  const _balanceSheet = parseObjectAs<BalanceSheet>(balanceSheet);
  const _interestModel = parseObjectAs<InterestModel>(interestModel);
  const _borrowDynamic = parseObjectAs<BorrowDynamic>(borrowDynamic);
  const _borrowFee = parseObjectAs<BorrowFee>(borrowFeeKey);
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
          isIsolated: !!isolatedAssetKey,
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
    isIsolated: !!isolatedAssetKey,
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
  poolCoinName: SupportPoolCoins,
  indexer: boolean = false,
  coinPrice: number,
  requiredObjects?: {
    balanceSheet: SuiObjectData;
    borrowDynamic: SuiObjectData;
    interestModel: SuiObjectData;
    borrowFeeKey: SuiObjectData;
    supplyLimitKey: SuiObjectData;
    borrowLimitKey: SuiObjectData;
    isolatedAssetKey: SuiObjectData;
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
    if (SUPPORT_COLLATERALS.includes(poolCoinName as SupportCollateralCoins)) {
      marketCollateralIndexer = await query.indexer.getMarketCollateral(
        poolCoinName as SupportCollateralCoins
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

  const basePoolData = <T extends SupportPoolCoins = SupportPoolCoins>() => ({
    coinName: poolCoinName as T,
    symbol: query.utils.parseSymbol(poolCoinName),
    marketCoinType: query.utils.parseMarketCoinType(poolCoinName),
    coinType: query.utils.parseCoinType(poolCoinName),
  });
  return {
    marketPool: {
      ...basePoolData(),
      sCoinType: query.utils.parseSCoinType(
        query.utils.parseMarketCoinName(poolCoinName)
      ),
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
          ...basePoolData<SupportCollateralCoins>(),
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
  query: ScallopQuery,
  collateralCoinNames: SupportCollateralCoins[] = [...SUPPORT_COLLATERALS],
  indexer: boolean = false
) => {
  const marketId = query.address.get('core.market');
  const coinPrices = (await query.utils.getCoinPrices()) ?? {};
  const marketCollaterals: MarketCollaterals = {};

  if (indexer) {
    const marketCollateralsIndexer = await query.indexer.getMarketCollaterals();
    const updateMarketCollateral = (marketCollateral: MarketCollateral) => {
      if (!collateralCoinNames.includes(marketCollateral.coinName)) return;
      marketCollateral.coinPrice =
        coinPrices[marketCollateral.coinName] ?? marketCollateral.coinPrice;
      marketCollateral.coinWrappedType = query.utils.getCoinWrappedType(
        marketCollateral.coinName
      );
      marketCollaterals[marketCollateral.coinName] = marketCollateral;
    };
    Object.values(marketCollateralsIndexer).forEach(updateMarketCollateral);
    return marketCollaterals;
  }

  const marketObjectResponse = await query.cache.queryGetObject(marketId);
  await Promise.allSettled(
    collateralCoinNames.map(async (collateralCoinName) => {
      const marketCollateral = await getMarketCollateral(
        query,
        collateralCoinName,
        indexer,
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
  query: ScallopQuery,
  collateralCoinName: SupportCollateralCoins,
  indexer: boolean = false,
  marketObject?: SuiObjectData | null,
  coinPrice?: number
): Promise<MarketCollateral | undefined> => {
  coinPrice =
    coinPrice ?? (await query.utils.getCoinPrices())?.[collateralCoinName];

  if (indexer) {
    const marketCollateralIndexer =
      await query.indexer.getMarketCollateral(collateralCoinName);
    marketCollateralIndexer.coinPrice =
      coinPrice ?? marketCollateralIndexer.coinPrice;
    marketCollateralIndexer.coinWrappedType = query.utils.getCoinWrappedType(
      marketCollateralIndexer.coinName
    );

    return marketCollateralIndexer;
  }

  // let marketCollateral: MarketCollateral | undefined;
  // let riskModel: RiskModel | undefined;
  // let collateralStat: CollateralStat | undefined;

  const marketId = query.address.get('core.market');
  marketObject =
    marketObject || (await query.cache.queryGetObject(marketId))?.data;

  if (!(marketObject && marketObject.content?.dataType === 'moveObject'))
    throw new Error(`Failed to fetch marketObject`);

  const fields = marketObject.content.fields as any;
  const coinType = query.utils.parseCoinType(collateralCoinName);

  // Get risk model.
  const riskModelParentId = fields.risk_models.fields.table.fields.id.id;
  const riskModelDynamicFieldObjectResponse =
    await query.cache.queryGetDynamicFieldObject({
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
    await query.cache.queryGetDynamicFieldObject({
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
    isIsolated: await isIsolatedAsset(query.utils, collateralCoinName),
  });

  const calculatedMarketCollateralData = calculateMarketCollateralData(
    query.utils,
    parsedMarketCollateralData
  );

  return {
    coinName: collateralCoinName,
    symbol: query.utils.parseSymbol(collateralCoinName),
    coinType: query.utils.parseCoinType(collateralCoinName),
    marketCoinType: query.utils.parseMarketCoinType(collateralCoinName),
    coinWrappedType: query.utils.getCoinWrappedType(collateralCoinName),
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
    address,
  }: {
    address: ScallopAddress;
  },
  ownerAddress: string
) => {
  const owner = ownerAddress;
  const protocolObjectId = address.get('core.object') || PROTOCOL_OBJECT_ID;
  const keyObjectsResponse: SuiObjectResponse[] = [];
  let hasNextPage = false;
  let nextCursor: string | null | undefined = null;
  do {
    const paginatedKeyObjectsResponse =
      await address.cache.queryGetOwnedObjects({
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
  const obligationsObjects = await queryMultipleObjects(
    address.cache,
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
          address.cache,
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
  cache: ScallopCache,
  obligation: string | SuiObjectData
) => {
  const obligationObjectData =
    typeof obligation === 'string'
      ? (await cache.queryGetObject(obligation))?.data
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
  }: {
    address: ScallopAddress;
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

  const queryResult = await address.cache.queryInspectTxn(
    { queryTarget, args },
    typeof obligationId === 'string'
      ? obligationId
      : 'objectId' in obligationId
        ? obligationId.objectId
        : JSON.stringify(obligationId)
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
  query: ScallopQuery,
  assetCoinNames: SupportAssetCoins[] = [...SUPPORT_POOLS],
  ownerAddress?: string
) => {
  const owner = ownerAddress ?? query.suiKit.currentAddress();
  const assetCoins = {} as OptionalKeys<Record<SupportAssetCoins, number>>;

  await Promise.allSettled(
    assetCoinNames.map(async (assetCoinName) => {
      const marketCoin = await getCoinAmount(query, assetCoinName, owner);
      assetCoins[assetCoinName] = marketCoin;
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
  query: ScallopQuery,
  assetCoinName: SupportAssetCoins,
  ownerAddress?: string
) => {
  const owner = ownerAddress ?? query.suiKit.currentAddress();
  const coinType = query.utils.parseCoinType(assetCoinName);
  const coinBalance = await query.cache.queryGetCoinBalance({
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
  query: ScallopQuery,
  marketCoinNames?: SupportMarketCoins[],
  ownerAddress?: string
) => {
  marketCoinNames =
    marketCoinNames ||
    [...SUPPORT_POOLS].map((poolCoinName) =>
      query.utils.parseMarketCoinName(poolCoinName)
    );
  const owner = ownerAddress ?? query.suiKit.currentAddress();
  const marketCoins = {} as OptionalKeys<Record<SupportMarketCoins, number>>;

  await Promise.allSettled(
    marketCoinNames.map(async (marketCoinName) => {
      const marketCoin = await getMarketCoinAmount(
        query,
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
  query: ScallopQuery,
  marketCoinName: SupportMarketCoins,
  ownerAddress?: string
) => {
  const owner = ownerAddress ?? query.suiKit.currentAddress();
  const marketCoinType = query.utils.parseMarketCoinType(marketCoinName);
  const coinBalance = await query.cache.queryGetCoinBalance({
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
  query: ScallopQuery,
  assetNames: SupportPoolCoins[]
): Promise<Record<SupportPoolCoins, number>> => {
  const FEE_RATE = 1e4;
  const missingAssets: SupportPoolCoins[] = [];

  // create mapping from asset type to asset name
  const assetTypeMap = assetNames.reduce(
    (prev, curr) => {
      const assetType = query.utils.parseCoinType(curr).slice(2);
      prev[assetType] = curr;
      return prev;
    },
    {} as Record<string, SupportPoolCoins>
  );

  // use the mapped object first
  const objIds = assetNames
    .map((assetName) => {
      if (!FlashLoanFeeObjectMap[assetName]) {
        missingAssets.push(assetName);
        return null;
      } else {
        return FlashLoanFeeObjectMap[assetName];
      }
    })
    .filter((t) => !!t) as string[];

  const flashloanFeeObjects = await query.cache.queryGetObjects(objIds);

  if (missingAssets.length > 0) {
    // get market object
    const marketObjectId = query.address.get('core.market');
    const marketObjectRes = await query.cache.queryGetObject(marketObjectId);
    if (marketObjectRes?.data?.content?.dataType !== 'moveObject')
      throw new Error('Failed to get market object');

    // get vault
    const vault = (marketObjectRes.data.content.fields as any).vault;

    // get vault balance sheet object id
    const flashloanFeesTableId = vault.fields.flash_loan_fees.fields.table
      .fields.id.id as string;

    // the balance sheet is a VecSet<0x1::type_name::TypeName
    const balanceSheetDynamicFields = await query.cache.queryGetDynamicFields({
      parentId: flashloanFeesTableId,
      limit: 10,
    });

    // get the dynamic object ids
    const dynamicFieldObjectIds =
      balanceSheetDynamicFields?.data
        .filter((field) => {
          const assetType = (field.name.value as any).name as string;
          return !!assetTypeMap[assetType];
        })
        .map((field) => field.objectId) ?? [];

    flashloanFeeObjects.push(
      ...(await query.cache.queryGetObjects(dynamicFieldObjectIds))
    );
  }

  return flashloanFeeObjects.reduce(
    (prev, curr) => {
      if (curr.content?.dataType === 'moveObject') {
        const objectFields = curr.content.fields as any;
        const assetType = (curr.content.fields as any).name.fields.name;
        const feeNumerator = +objectFields.value;
        prev[assetTypeMap[assetType]] = feeNumerator / FEE_RATE;
      }
      return prev;
    },
    {} as Record<SupportPoolCoins, number>
  );
};
