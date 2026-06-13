import { SuiTxBlock } from '@scallop-io/sui-kit';
import { queryKeys } from 'src/constants/queryKeys.js';
import type { SuiObjectData, SuiObjectResponse } from 'src/types/index.js';
import type { CoinPrices } from 'src/types/utils.js';
import type {
  BalanceSheet,
  BorrowDynamic,
  BorrowFee,
  CollateralStat,
  InterestModel,
  Market,
  MarketCollaterals,
  MarketPools,
  Markets,
  RiskModel,
  IndexerMarket,
  MarketIndexerContext,
  MarketOnChainContext,
  MarketReadArgs,
  MarketQueryInterface,
  RequiredMarketObjects,
} from './types.js';
import { logError } from '../util.js';
import { encodeDynamicFieldNameForV2 } from 'src/utils/dynamicField.js';
import { partitionArray, parseObjectAs } from 'src/utils/index.js';
import { getSharedObjectData } from 'src/utils/object.js';
import { mapMarketEventToMarketData } from './mapper.js';
import {
  BORROW_LIMIT_KEY_TYPE,
  ISOLATED_ASSET_KEY_TYPE,
  SUPPLY_LIMIT_KEY_TYPE,
} from './const.js';
import {
  calculateMarketCollateralData,
  calculateMarketPoolData,
  // checkAssetParams,
  parseOriginMarketCollateralData,
  parseOriginMarketPoolData,
} from './utils.js';

export const getMarketsFromIndexer = async (
  ctx: MarketIndexerContext,
  { coinPrices }: MarketReadArgs
): Promise<Markets> => {
  const { indexer, metadata, fetchWithCache } = ctx;
  const urlPath = 'api/market/migrate';
  const marketIndexer = await fetchWithCache({
    queryFn: () => indexer.get<IndexerMarket>(urlPath),
    queryKey: queryKeys.api.getMarkets(),
  });

  const pools: MarketPools = {};
  const collaterals: MarketCollaterals = {};

  const updatePools = (item: IndexerMarket['pools'][number]) => {
    pools[item.coinName] = {
      ...item,
      coinPrice: coinPrices[item.coinName] ?? item.coinPrice,
      coinWrappedType: metadata.getCoinWrappedType(item.coinName),
    };
  };

  const updateCollaterals = (item: IndexerMarket['collaterals'][number]) => {
    collaterals[item.coinName] = {
      ...item,
      coinPrice: coinPrices[item.coinName] ?? item.coinPrice,
      coinWrappedType: metadata.getCoinWrappedType(item.coinName),
    };
  };

  Object.values(marketIndexer.pools).filter(Boolean).forEach(updatePools);
  Object.values(marketIndexer.collaterals)
    .filter(Boolean)
    .forEach(updateCollaterals);

  return {
    pools,
    collaterals,
  };
};

export const getMarketsFromOnChain = async (
  ctx: MarketOnChainContext,
  { coinPrices }: MarketReadArgs
): Promise<Markets> => {
  const { onchain, addresses, fetchWithCache } = ctx;
  const tx = new SuiTxBlock();
  const packageId = addresses.queryPackageId;
  const marketId = addresses.market;
  const queryTarget = `${packageId}::market_query::market_data`;
  const marketSharedObject = await fetchWithCache({
    queryKey: queryKeys.rpc.getSharedObject({
      objectId: marketId,
      node: onchain.url,
    }),
    queryFn: () =>
      getSharedObjectData(onchain, {
        tx,
        mutable: true,
        objectId: marketId,
      }),
  });

  const args = [marketSharedObject];
  tx.moveCall(queryTarget, args, []);

  const queryResult = await fetchWithCache({
    queryKey: queryKeys.rpc.getInspectTxn({
      queryTarget,
      args: args.map((arg) =>
        typeof arg === 'object' && 'objectId' in arg ? arg.objectId : arg
      ),
      typeArgs: [],
      node: onchain.url,
    }),
    queryFn: () =>
      onchain.client.simulateTransaction({
        transaction: tx.txBlock,
        include: {
          // effects: true,
          events: true,
        },
      }),
  });

  const transaction =
    queryResult?.Transaction ?? queryResult?.FailedTransaction;
  // Check status
  if (!transaction.status.success) {
    throw logError(
      ctx.logger,
      `On-chain market query transaction failed: ${transaction.status.error.message}`
    );
  }
  const marketData = mapMarketEventToMarketData(
    transaction?.events?.[0]?.json as unknown as
      | MarketQueryInterface
      | undefined
  );
  return buildMarketFromOnChainData(ctx, marketData, coinPrices);
};

export const getMarketFromIndexer = async (
  ctx: MarketIndexerContext,
  { coinPrice, coinName }: { coinPrice: number; coinName: string }
): Promise<Market> => {
  const markets = await getMarketsFromIndexer(ctx, {
    coinPrices: { [coinName]: coinPrice },
  });

  if (!markets.pools[coinName]) {
    throw logError(
      ctx.logger,
      `Market pool for ${coinName} not found in indexer data`
    );
  }
  return {
    pool: markets.pools[coinName],
    collateral: markets.collaterals[coinName],
  };
};

export const getMarketFromOnChain = async (
  ctx: MarketOnChainContext,
  { coinPrice, coinName }: { coinPrice: number; coinName: string }
): Promise<Market> => {
  const { metadata } = ctx;
  const requiredObjects = await queryRequiredMarketObjects(ctx, [coinName]);
  const poolObjects = requiredObjects[coinName];

  if (!poolObjects) {
    throw logError(
      ctx.logger,
      `Failed to fetch required market objects for ${coinName}`
    );
  }

  const parsedMarketPoolObjects = await parseMarketPoolObjects(
    ctx,
    poolObjects
  );
  const parsedMarketPoolData = parseOriginMarketPoolData(
    parsedMarketPoolObjects
  );
  const calculatedMarketPoolData = calculateMarketPoolData(
    metadata,
    parsedMarketPoolData
  );
  const parsedMarketCollateralData =
    parsedMarketPoolObjects.parsedOriginMarketCollateral
      ? parseOriginMarketCollateralData(
          parsedMarketPoolObjects.parsedOriginMarketCollateral
        )
      : undefined;

  const basePoolData = <T extends string = string>() => ({
    coinName: coinName as T,
    symbol: metadata.parseSymbol(coinName),
    marketCoinType: metadata.parseMarketCoinType(coinName),
    coinType: metadata.parseCoinType(coinName),
  });

  return {
    pool: {
      ...basePoolData(),
      sCoinType:
        metadata.parseSCoinType(metadata.parseMarketCoinName(coinName)) ?? '',
      coinWrappedType: metadata.getCoinWrappedType(coinName),
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
          coinWrappedType: metadata.getCoinWrappedType(coinName),
          coinPrice,
          collateralFactor: parsedMarketCollateralData.collateralFactor,
          liquidationFactor: parsedMarketCollateralData.liquidationFactor,
          liquidationDiscount: parsedMarketCollateralData.liquidationDiscount,
          liquidationPenalty: parsedMarketCollateralData.liquidationPenalty,
          liquidationReserveFactor:
            parsedMarketCollateralData.liquidationReserveFactor,
          ...calculateMarketCollateralData(
            metadata,
            parsedMarketCollateralData
          ),
        }
      : undefined,
  };
};

// const getScoinSwapRate = async (
//   ctx:MarketRepoContext,
//   {
//     fromSCoin,
//     toSCoin,
//     coinPrices,
//   }: MarketReadArgs & { fromSCoin: string; toSCoin: string },
//   fn: (
//     ctx:MarketRepoContext,
//     { coinPrices }: MarketReadArgs
//   ) => Promise<Markets>
// ) => {
//   const { metadata } = ctx;
//   checkAssetParams(metadata.whitelist, fromSCoin, toSCoin);

//   const coinNames = [fromSCoin, toSCoin].map((sCoinName) =>
//     metadata.parseCoinName(sCoinName)
//   ) as string[];

//   const markets = await fn(ctx, { coinPrices });
//   const marketPools = coinNames.map((coinName) => markets.pools[coinName]);

//   if (marketPools.some((pool) => !pool))
//     throw new Error('Failed to fetch the lendings data');

//   if (marketPools.some((pool) => pool?.conversionRate === 0)) {
//     throw new Error('Conversion rate cannot be zero');
//   }

//   const ScoinAToARate = marketPools[0]!.conversionRate;
//   const BtoSCoinBRate = 1 / marketPools[1]!.conversionRate;
//   const fromCoinPrice = coinPrices[coinNames[0]] ?? 0;
//   const toCoinPrice = coinPrices[coinNames[1]] ?? 0;

//   if (toCoinPrice === 0) {
//     throw new Error(`Coin price cannot be zero for ${coinNames[1]}`);
//   }

//   const AtoBRate = fromCoinPrice / toCoinPrice;
//   return BigNumber(ScoinAToARate)
//     .multipliedBy(AtoBRate)
//     .multipliedBy(BtoSCoinBRate)
//     .toNumber();
// };

// export const getSCoinSwapRateFromIndexer = async (
//   ctx:MarketRepoContext,
//   {
//     fromSCoin,
//     toSCoin,
//     coinPrices,
//   }: MarketReadArgs & { fromSCoin: string; toSCoin: string }
// ) => {
//   return getScoinSwapRate(
//     ctx,
//     { fromSCoin, toSCoin, coinPrices },
//     getMarketsFromIndexer
//   );
// };

// export const getSCoinSwapRateFromOnChain = (
//   ctx:MarketRepoContext,
//   {
//     fromSCoin,
//     toSCoin,
//     coinPrices,
//   }: MarketReadArgs & { fromSCoin: string; toSCoin: string }
// ) => {
//   return getScoinSwapRate(
//     ctx,
//     { fromSCoin, toSCoin, coinPrices },
//     getMarketsFromOnChain
//   );
// };

const buildMarketFromOnChainData = async (
  ctx: MarketOnChainContext,
  marketData: ReturnType<typeof mapMarketEventToMarketData>,
  coinPrices: CoinPrices
): Promise<Markets> => {
  const { metadata } = ctx;
  const pools: MarketPools = {};
  const collaterals: MarketCollaterals = {};

  for (const pool of marketData?.pools ?? []) {
    const coinType = pool.type;
    const poolCoinName = metadata.parseCoinNameFromType(coinType);
    const coinPrice = coinPrices[poolCoinName] ?? 0;

    if (!metadata.whitelist.lending.has(poolCoinName)) {
      continue;
    }

    const [supplyLimit, borrowLimit, isIsolated] = await Promise.all([
      getSupplyLimit(ctx, poolCoinName),
      getBorrowLimit(ctx, poolCoinName),
      getIsolatedAsset(ctx, poolCoinName),
    ]);

    const parsedMarketPoolData = parseOriginMarketPoolData({
      ...pool,
      type: pool.type,
      isIsolated,
      supplyLimit,
      borrowLimit,
    });

    const calculatedMarketPoolData = calculateMarketPoolData(
      metadata,
      parsedMarketPoolData
    );

    pools[poolCoinName] = {
      coinName: poolCoinName,
      symbol: metadata.parseSymbol(poolCoinName),
      marketCoinType: metadata.parseMarketCoinType(poolCoinName),
      sCoinType:
        metadata.parseSCoinType(metadata.parseMarketCoinName(poolCoinName)) ??
        '',
      coinWrappedType: metadata.getCoinWrappedType(poolCoinName),
      coinPrice,
      ...parsedMarketPoolData,
      ...calculatedMarketPoolData,
    };
  }

  for (const collateral of marketData?.collaterals ?? []) {
    const coinType = collateral.type;
    const collateralCoinName = metadata.parseCoinNameFromType(coinType);
    const coinPrice = coinPrices[collateralCoinName] ?? 0;

    if (!metadata.whitelist.collateral.has(collateralCoinName)) {
      continue;
    }

    const parsedMarketCollateralData = parseOriginMarketCollateralData({
      ...collateral,
      type: collateral.type,
      liquidationPenalty: collateral.liquidationPanelty,
      isIsolated: await getIsolatedAsset(ctx, collateralCoinName),
    });

    const calculatedMarketCollateralData = calculateMarketCollateralData(
      metadata,
      parsedMarketCollateralData
    );

    collaterals[collateralCoinName] = {
      coinName: collateralCoinName,
      symbol: metadata.parseSymbol(collateralCoinName),
      marketCoinType: metadata.parseMarketCoinType(collateralCoinName),
      coinWrappedType: metadata.getCoinWrappedType(collateralCoinName),
      coinPrice,
      ...parsedMarketCollateralData,
      ...calculatedMarketCollateralData,
    };
  }

  return {
    pools,
    collaterals,
  };
};

const MARKET_OBJECT_KEYS = [
  'lendingPoolAddress',
  'collateralPoolAddress',
  'borrowDynamic',
  'interestModel',
  'riskModel',
  'borrowFeeKey',
  'supplyLimitKey',
  'borrowLimitKey',
  'isolatedAssetKey',
] as const;

const parseMarketPoolObjects = async (
  ctx: MarketOnChainContext,
  {
    balanceSheet,
    borrowDynamic,
    collateralStat,
    interestModel,
    riskModel,
    borrowFeeKey,
    supplyLimitKey,
    borrowLimitKey,
    isolatedAssetKey,
  }: RequiredMarketObjects[string]
) => {
  if (!balanceSheet || !borrowDynamic || !interestModel) {
    throw logError(ctx.logger, 'Missing required market objects');
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
  const poolCoinName = ctx.metadata.parseCoinNameFromType(
    `0x${_interestModel.type}`
  );
  const isIsolated = isolatedAssetKey?.json
    ? parseObjectAs<boolean>(isolatedAssetKey)
    : await getIsolatedAsset(ctx, poolCoinName);

  const parsedOriginMarketCollateral =
    _riskModel && _collateralStat
      ? {
          type: _interestModel.type,
          collateralFactor: _riskModel.collateral_factor,
          liquidationFactor: _riskModel.liquidation_factor,
          liquidationPenalty: _riskModel.liquidation_penalty,
          liquidationDiscount: _riskModel.liquidation_discount,
          liquidationReserveFactor: _riskModel.liquidation_revenue_factor,
          maxCollateralAmount: _riskModel.max_collateral_amount,
          totalCollateralAmount: _collateralStat.amount,
          isIsolated,
        }
      : undefined;

  return {
    type: _interestModel.type,
    maxBorrowRate: _interestModel.max_borrow_rate,
    interestRate: _borrowDynamic.interest_rate,
    interestRateScale: _borrowDynamic.interest_rate_scale,
    borrowIndex: _borrowDynamic.borrow_index,
    lastUpdated: _borrowDynamic.last_updated,
    cash: _balanceSheet.cash,
    debt: _balanceSheet.debt,
    marketCoinSupply: _balanceSheet.market_coin_supply,
    reserve: _balanceSheet.revenue,
    reserveFactor: _interestModel.revenue_factor,
    borrowWeight: _interestModel.borrow_weight,
    borrowFeeRate: _borrowFee,
    baseBorrowRatePerSec: _interestModel.base_borrow_rate_per_sec,
    borrowRateOnHighKink: _interestModel.borrow_rate_on_high_kink,
    borrowRateOnMidKink: _interestModel.borrow_rate_on_mid_kink,
    highKink: _interestModel.high_kink,
    midKink: _interestModel.mid_kink,
    minBorrowAmount: _interestModel.min_borrow_amount,
    supplyLimit: _supplyLimit,
    borrowLimit: _borrowLimit,
    isIsolated,
    parsedOriginMarketCollateral,
  };
};

const queryRequiredMarketObjects = async (
  { onchain, metadata, fetchWithCache }: MarketOnChainContext,
  poolCoinNames: string[]
): Promise<RequiredMarketObjects> => {
  const allObjectIds: string[] = [];

  for (const poolCoinName of poolCoinNames) {
    const poolData = metadata.poolAddresses[poolCoinName];
    for (const keyType of MARKET_OBJECT_KEYS) {
      const objectId = poolData?.[keyType];
      if (objectId) allObjectIds.push(objectId);
    }
  }

  const objectDatas: SuiObjectData[] = [];
  const batches = partitionArray([...new Set(allObjectIds)], 50);

  for (const batch of batches) {
    const response = await fetchWithCache({
      queryKey: queryKeys.rpc.getObjects({
        objectIds: batch,
        node: onchain.url,
      }),
      queryFn: () =>
        onchain.client.getObjects({
          objectIds: batch,
          include: { json: true },
        }),
    });

    objectDatas.push(
      ...response.objects.filter(
        (object): object is SuiObjectData => !(object instanceof Error)
      )
    );
  }

  const objectDataMap = objectDatas.reduce(
    (acc, obj) => {
      acc[obj.objectId] = obj;
      return acc;
    },
    {} as Record<string, SuiObjectData>
  );

  const results: RequiredMarketObjects = {};

  for (const poolCoinName of poolCoinNames) {
    const poolData = metadata.poolAddresses[poolCoinName];
    results[poolCoinName] = {
      balanceSheet: objectDataMap[poolData?.lendingPoolAddress ?? ''],
      collateralStat: objectDataMap[poolData?.collateralPoolAddress ?? ''],
      borrowDynamic: objectDataMap[poolData?.borrowDynamic ?? ''],
      interestModel: objectDataMap[poolData?.interestModel ?? ''],
      riskModel: objectDataMap[poolData?.riskModel ?? ''],
      borrowFeeKey: objectDataMap[poolData?.borrowFeeKey ?? ''],
      supplyLimitKey: objectDataMap[poolData?.supplyLimitKey ?? ''],
      borrowLimitKey: objectDataMap[poolData?.borrowLimitKey ?? ''],
      isolatedAssetKey: objectDataMap[poolData?.isolatedAssetKey ?? ''],
    };
  }

  return results;
};

const getSupplyLimit = (
  ctx: MarketOnChainContext,
  poolName: string
): Promise<string> =>
  getMarketDynamicFieldString(ctx, SUPPLY_LIMIT_KEY_TYPE, poolName);

const getBorrowLimit = (
  ctx: MarketOnChainContext,
  poolName: string
): Promise<string> =>
  getMarketDynamicFieldString(ctx, BORROW_LIMIT_KEY_TYPE, poolName);

const getIsolatedAsset = async (
  ctx: MarketOnChainContext,
  poolName: string
): Promise<boolean> => {
  const object = await getMarketDynamicFieldObject(
    ctx,
    ISOLATED_ASSET_KEY_TYPE,
    poolName
  );
  if (!object?.object?.json) return false;
  return parseObjectAs<boolean>(object.object);
};

const getMarketDynamicFieldString = async (
  ctx: MarketOnChainContext,
  keyType: string,
  poolName: string
): Promise<string> => {
  const object = await getMarketDynamicFieldObject(ctx, keyType, poolName);
  if (!object?.object?.json) return '0';
  return parseObjectAs<string>(object.object);
};

const getMarketDynamicFieldObject = (
  { onchain, addresses, metadata, fetchWithCache }: MarketOnChainContext,
  keyType: string,
  poolName: string
): Promise<SuiObjectResponse | null> => {
  const poolCoinType = metadata.parseCoinType(poolName).slice(2);
  const name = {
    type: keyType,
    value: poolCoinType,
  };

  return fetchWithCache({
    queryKey: queryKeys.rpc.getDynamicFieldObject({
      parentId: addresses.market,
      name,
      node: onchain.url,
    }),
    queryFn: async () => {
      try {
        const { dynamicField } = await onchain.client.getDynamicField({
          parentId: addresses.market,
          name: encodeDynamicFieldNameForV2(name),
        });

        return await onchain.getObject({
          objectId: dynamicField.fieldId,
          include: { json: true },
        });
      } catch (cause) {
        if (
          cause instanceof Error &&
          cause.message.toLowerCase().includes('not found')
        ) {
          return null;
        }
        throw cause;
      }
    },
  });
};
