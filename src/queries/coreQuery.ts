import { normalizeStructTag } from '@mysten/sui/utils';
import {
  SUPPORT_POOLS,
  PROTOCOL_OBJECT_ID,
  SUPPORT_COLLATERALS,
  BORROW_FEE_PROTOCOL_ID,
  USE_TEST_ADDRESS,
  FlashLoanFeeObjectMap,
} from '../constants';
import {
  parseOriginMarketPoolData,
  calculateMarketPoolData,
  parseOriginMarketCollateralData,
  calculateMarketCollateralData,
} from '../utils';
import type { SuiObjectResponse, SuiObjectData } from '@mysten/sui/client';
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
  BorrowIndex,
  BalanceSheet,
  RiskModel,
  CollateralStat,
  SupportMarketCoins,
  OptionalKeys,
} from '../types';
import BigNumber from 'bignumber.js';
import { getSupplyLimit } from './supplyLimit';

/**
 * Query market data.
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
  indexer: boolean = false
) => {
  const coinPrices = await query.utils.getCoinPrices();

  const pools: MarketPools = {};
  const collaterals: MarketCollaterals = {};

  if (indexer) {
    const marketIndexer = await query.indexer.getMarket();

    const updatePools = (item: MarketPool) => {
      item.coinPrice = coinPrices[item.coinName] || item.coinPrice;
      item.coinWrappedType = query.utils.getCoinWrappedType(item.coinName);
      pools[item.coinName] = item;
    };

    const updateCollaterals = (item: MarketCollateral) => {
      item.coinPrice = coinPrices[item.coinName] || item.coinPrice;
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

  const queryResult = await query.cache.queryInspectTxn({ queryTarget, args });
  const marketData = queryResult?.events[0].parsedJson as
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
    });

    const calculatedMarketPoolData = calculateMarketPoolData(
      query.utils,
      parsedMarketPoolData
    );

    const coinDecimal = query.utils.getCoinDecimal(poolCoinName);
    const maxSupplyCoin = BigNumber(
      (await getSupplyLimit(query.utils, poolCoinName)) ?? '0'
    )
      .shiftedBy(-coinDecimal)
      .toNumber();

    pools[poolCoinName] = {
      coinName: poolCoinName,
      symbol: query.utils.parseSymbol(poolCoinName),
      coinType: coinType,
      marketCoinType: query.utils.parseMarketCoinType(poolCoinName),
      sCoinType: query.utils.parseSCoinType(
        query.utils.parseMarketCoinName(poolCoinName)
      ),
      coinWrappedType: query.utils.getCoinWrappedType(poolCoinName),
      coinDecimal,
      coinPrice: coinPrice,
      highKink: parsedMarketPoolData.highKink,
      midKink: parsedMarketPoolData.midKink,
      reserveFactor: parsedMarketPoolData.reserveFactor,
      borrowWeight: parsedMarketPoolData.borrowWeight,
      borrowFee: parsedMarketPoolData.borrowFee,
      marketCoinSupplyAmount: parsedMarketPoolData.marketCoinSupplyAmount,
      minBorrowAmount: parsedMarketPoolData.minBorrowAmount,
      maxSupplyCoin,
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
      liquidationPanelty: collateral.liquidationPanelty,
      liquidationReserveFactor: collateral.liquidationReserveFactor,
      maxCollateralAmount: collateral.maxCollateralAmount,
      totalCollateralAmount: collateral.totalCollateralAmount,
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
      coinDecimal: query.utils.getCoinDecimal(collateralCoinName),
      coinPrice: coinPrice,
      collateralFactor: parsedMarketCollateralData.collateralFactor,
      liquidationFactor: parsedMarketCollateralData.liquidationFactor,
      liquidationDiscount: parsedMarketCollateralData.liquidationDiscount,
      liquidationPanelty: parsedMarketCollateralData.liquidationPanelty,
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
  poolCoinNames: SupportPoolCoins[] = [...SUPPORT_POOLS],
  indexer: boolean = false
) => {
  const marketId = query.address.get('core.market');
  const marketObjectResponse = await query.cache.queryGetObject(marketId, {
    showContent: true,
  });
  const coinPrices = (await query.utils.getCoinPrices(poolCoinNames)) ?? {};

  const marketPools: MarketPools = {};

  if (indexer) {
    const marketPoolsIndexer = await query.indexer.getMarketPools();

    const updateMarketPool = (marketPool: MarketPool) => {
      if (!poolCoinNames.includes(marketPool.coinName)) return;
      marketPool.coinPrice =
        coinPrices[marketPool.coinName] || marketPool.coinPrice;
      marketPool.coinWrappedType = query.utils.getCoinWrappedType(
        marketPool.coinName
      );
      marketPools[marketPool.coinName] = marketPool;
    };

    Object.values(marketPoolsIndexer).forEach(updateMarketPool);

    return marketPools;
  }

  await Promise.allSettled(
    poolCoinNames.map(async (poolCoinName) => {
      const marketPool = await getMarketPool(
        query,
        poolCoinName,
        indexer,
        marketObjectResponse?.data,
        coinPrices?.[poolCoinName]
      );

      if (marketPool) {
        marketPools[poolCoinName] = marketPool;
      }
    })
  );

  return marketPools;
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
  marketObject?: SuiObjectData | null,
  coinPrice?: number
) => {
  let marketPool: MarketPool | undefined;
  let balanceSheet: BalanceSheet | undefined;
  let borrowIndex: BorrowIndex | undefined;
  let interestModel: InterestModel | undefined;
  let borrowFeeRate: { value: string } | undefined;

  coinPrice =
    coinPrice ||
    (await query.utils.getCoinPrices([poolCoinName]))?.[poolCoinName];

  if (indexer) {
    const marketPoolIndexer = await query.indexer.getMarketPool(poolCoinName);
    marketPoolIndexer.coinPrice = coinPrice || marketPoolIndexer.coinPrice;
    marketPoolIndexer.coinWrappedType = query.utils.getCoinWrappedType(
      marketPoolIndexer.coinName
    );

    return marketPoolIndexer;
  }

  const marketId = query.address.get('core.market');
  marketObject =
    marketObject ||
    (
      await query.cache.queryGetObject(marketId, {
        showContent: true,
      })
    )?.data;

  if (marketObject) {
    if (marketObject.content && 'fields' in marketObject.content) {
      const fields = marketObject.content.fields as any;
      const coinType = query.utils.parseCoinType(poolCoinName);
      // Get balance sheet.
      const balanceSheetParentId =
        fields.vault.fields.balance_sheets.fields.table.fields.id.id;
      const balanceSheetDynamicFieldObjectResponse =
        await query.cache.queryGetDynamicFieldObject({
          parentId: balanceSheetParentId,
          name: {
            type: '0x1::type_name::TypeName',
            value: {
              name: coinType.substring(2),
            },
          },
        });
      if (!balanceSheetDynamicFieldObjectResponse) return undefined;

      const balanceSheetDynamicFieldObject =
        balanceSheetDynamicFieldObjectResponse.data;
      if (
        balanceSheetDynamicFieldObject &&
        balanceSheetDynamicFieldObject.content &&
        'fields' in balanceSheetDynamicFieldObject.content
      ) {
        const dynamicFields = balanceSheetDynamicFieldObject.content
          .fields as any;
        balanceSheet = dynamicFields.value.fields;
      }

      // Get borrow index.
      const borrowIndexParentId =
        fields.borrow_dynamics.fields.table.fields.id.id;
      const borrowIndexDynamicFieldObjectResponse =
        await query.cache.queryGetDynamicFieldObject({
          parentId: borrowIndexParentId,
          name: {
            type: '0x1::type_name::TypeName',
            value: {
              name: coinType.substring(2),
            },
          },
        });
      if (!borrowIndexDynamicFieldObjectResponse) return undefined;

      const borrowIndexDynamicFieldObject =
        borrowIndexDynamicFieldObjectResponse.data;
      if (
        borrowIndexDynamicFieldObject &&
        borrowIndexDynamicFieldObject.content &&
        'fields' in borrowIndexDynamicFieldObject.content
      ) {
        const dynamicFields = borrowIndexDynamicFieldObject.content
          .fields as any;
        borrowIndex = dynamicFields.value.fields;
      }

      // Get interest models.
      const interestModelParentId =
        fields.interest_models.fields.table.fields.id.id;
      const interestModelDynamicFieldObjectResponse =
        await query.cache.queryGetDynamicFieldObject({
          parentId: interestModelParentId,
          name: {
            type: '0x1::type_name::TypeName',
            value: {
              name: coinType.substring(2),
            },
          },
        });

      if (!interestModelDynamicFieldObjectResponse) return undefined;
      const interestModelDynamicFieldObject =
        interestModelDynamicFieldObjectResponse.data;
      if (
        interestModelDynamicFieldObject &&
        interestModelDynamicFieldObject.content &&
        'fields' in interestModelDynamicFieldObject.content
      ) {
        const dynamicFields = interestModelDynamicFieldObject.content
          .fields as any;
        interestModel = dynamicFields.value.fields;
      }

      // Get borrow fee.
      const borrowFeeDynamicFieldObjectResponse =
        await query.cache.queryGetDynamicFieldObject({
          parentId: marketId,
          name: {
            type: `${BORROW_FEE_PROTOCOL_ID}::market_dynamic_keys::BorrowFeeKey`,
            value: {
              type: {
                name: coinType.substring(2),
              },
            },
          },
        });

      if (!borrowFeeDynamicFieldObjectResponse) return undefined;
      const borrowFeeDynamicFieldObject =
        borrowFeeDynamicFieldObjectResponse.data;
      if (
        borrowFeeDynamicFieldObject &&
        borrowFeeDynamicFieldObject.content &&
        'fields' in borrowFeeDynamicFieldObject.content
      ) {
        const dynamicFields = borrowFeeDynamicFieldObject.content.fields as any;
        borrowFeeRate = dynamicFields.value.fields;
      }
    }
  }

  if (
    balanceSheet &&
    borrowIndex &&
    interestModel &&
    (USE_TEST_ADDRESS || borrowFeeRate)
  ) {
    const parsedMarketPoolData = parseOriginMarketPoolData({
      type: interestModel.type.fields,
      maxBorrowRate: interestModel.max_borrow_rate.fields,
      interestRate: borrowIndex.interest_rate.fields,
      interestRateScale: borrowIndex.interest_rate_scale,
      borrowIndex: borrowIndex.borrow_index,
      lastUpdated: borrowIndex.last_updated,
      cash: balanceSheet.cash,
      debt: balanceSheet.debt,
      marketCoinSupply: balanceSheet.market_coin_supply,
      reserve: balanceSheet.revenue,
      reserveFactor: interestModel.revenue_factor.fields,
      borrowWeight: interestModel.borrow_weight.fields,
      borrowFeeRate: borrowFeeRate || { value: '0' },
      baseBorrowRatePerSec: interestModel.base_borrow_rate_per_sec.fields,
      borrowRateOnHighKink: interestModel.borrow_rate_on_high_kink.fields,
      borrowRateOnMidKink: interestModel.borrow_rate_on_mid_kink.fields,
      highKink: interestModel.high_kink.fields,
      midKink: interestModel.mid_kink.fields,
      minBorrowAmount: interestModel.min_borrow_amount,
    });

    const calculatedMarketPoolData = calculateMarketPoolData(
      query.utils,
      parsedMarketPoolData
    );

    const coinDecimal = query.utils.getCoinDecimal(poolCoinName);
    const maxSupplyCoin = BigNumber(
      (await getSupplyLimit(query.utils, poolCoinName)) ?? '0'
    )
      .shiftedBy(-coinDecimal)
      .toNumber();

    marketPool = {
      coinName: poolCoinName,
      symbol: query.utils.parseSymbol(poolCoinName),
      coinType: query.utils.parseCoinType(poolCoinName),
      marketCoinType: query.utils.parseMarketCoinType(poolCoinName),
      sCoinType: query.utils.parseSCoinType(
        query.utils.parseMarketCoinName(poolCoinName)
      ),
      coinWrappedType: query.utils.getCoinWrappedType(poolCoinName),
      coinDecimal,
      coinPrice: coinPrice ?? 0,
      highKink: parsedMarketPoolData.highKink,
      midKink: parsedMarketPoolData.midKink,
      reserveFactor: parsedMarketPoolData.reserveFactor,
      borrowWeight: parsedMarketPoolData.borrowWeight,
      borrowFee: parsedMarketPoolData.borrowFee,
      marketCoinSupplyAmount: parsedMarketPoolData.marketCoinSupplyAmount,
      minBorrowAmount: parsedMarketPoolData.minBorrowAmount,
      maxSupplyCoin,
      ...calculatedMarketPoolData,
    };
  }

  return marketPool;
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
  const coinPrices =
    (await query.utils.getCoinPrices(collateralCoinNames)) ?? {};
  const marketCollaterals: MarketCollaterals = {};

  if (indexer) {
    const marketCollateralsIndexer = await query.indexer.getMarketCollaterals();
    const updateMarketCollateral = (marketCollateral: MarketCollateral) => {
      if (!collateralCoinNames.includes(marketCollateral.coinName)) return;
      marketCollateral.coinPrice =
        coinPrices[marketCollateral.coinName] || marketCollateral.coinPrice;
      marketCollateral.coinWrappedType = query.utils.getCoinWrappedType(
        marketCollateral.coinName
      );
      marketCollaterals[marketCollateral.coinName] = marketCollateral;
    };
    Object.values(marketCollateralsIndexer).forEach(updateMarketCollateral);
    return marketCollaterals;
  }

  const marketObjectResponse = await query.cache.queryGetObject(marketId, {
    showContent: true,
  });
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
) => {
  coinPrice =
    coinPrice ||
    (await query.utils.getCoinPrices([collateralCoinName]))?.[
      collateralCoinName
    ];

  if (indexer) {
    const marketCollateralIndexer =
      await query.indexer.getMarketCollateral(collateralCoinName);
    marketCollateralIndexer.coinPrice =
      coinPrice || marketCollateralIndexer.coinPrice;
    marketCollateralIndexer.coinWrappedType = query.utils.getCoinWrappedType(
      marketCollateralIndexer.coinName
    );

    return marketCollateralIndexer;
  }

  let marketCollateral: MarketCollateral | undefined;
  let riskModel: RiskModel | undefined;
  let collateralStat: CollateralStat | undefined;

  const marketId = query.address.get('core.market');
  marketObject =
    marketObject ||
    (
      await query.cache.queryGetObject(marketId, {
        showContent: true,
      })
    )?.data;

  if (marketObject) {
    if (marketObject.content && 'fields' in marketObject.content) {
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

      if (!riskModelDynamicFieldObjectResponse) return undefined;
      const riskModelDynamicFieldObject =
        riskModelDynamicFieldObjectResponse.data;
      if (
        riskModelDynamicFieldObject &&
        riskModelDynamicFieldObject.content &&
        'fields' in riskModelDynamicFieldObject.content
      ) {
        const dynamicFields = riskModelDynamicFieldObject.content.fields as any;
        riskModel = dynamicFields.value.fields;
      }

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

      if (!collateralStatDynamicFieldObjectResponse) return undefined;
      const collateralStatDynamicFieldObject =
        collateralStatDynamicFieldObjectResponse.data;
      if (
        collateralStatDynamicFieldObject &&
        collateralStatDynamicFieldObject.content &&
        'fields' in collateralStatDynamicFieldObject.content
      ) {
        const dynamicFields = collateralStatDynamicFieldObject.content
          .fields as any;
        collateralStat = dynamicFields.value.fields;
      }
    }
  }

  if (riskModel && collateralStat) {
    const parsedMarketCollateralData = parseOriginMarketCollateralData({
      type: riskModel.type.fields,
      collateralFactor: riskModel.collateral_factor.fields,
      liquidationFactor: riskModel.liquidation_factor.fields,
      liquidationDiscount: riskModel.liquidation_discount.fields,
      liquidationPanelty: riskModel.liquidation_penalty.fields,
      liquidationReserveFactor: riskModel.liquidation_revenue_factor.fields,
      maxCollateralAmount: riskModel.max_collateral_amount,
      totalCollateralAmount: collateralStat.amount,
    });

    const calculatedMarketCollateralData = calculateMarketCollateralData(
      query.utils,
      parsedMarketCollateralData
    );

    marketCollateral = {
      coinName: collateralCoinName,
      symbol: query.utils.parseSymbol(collateralCoinName),
      coinType: query.utils.parseCoinType(collateralCoinName),
      marketCoinType: query.utils.parseMarketCoinType(collateralCoinName),
      coinWrappedType: query.utils.getCoinWrappedType(collateralCoinName),
      coinDecimal: query.utils.getCoinDecimal(collateralCoinName),
      coinPrice: coinPrice ?? 0,
      collateralFactor: parsedMarketCollateralData.collateralFactor,
      liquidationFactor: parsedMarketCollateralData.liquidationFactor,
      liquidationDiscount: parsedMarketCollateralData.liquidationDiscount,
      liquidationPanelty: parsedMarketCollateralData.liquidationPanelty,
      liquidationReserveFactor:
        parsedMarketCollateralData.liquidationReserveFactor,
      ...calculatedMarketCollateralData,
    };
  }

  return marketCollateral;
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

  const keyObjectIds: string[] = keyObjectsResponse
    .map((ref: any) => ref?.data?.objectId)
    .filter((id: any) => id !== undefined);
  const keyObjects = await address.cache.queryGetObjects(keyObjectIds);

  const obligations: Obligation[] = [];
  await Promise.allSettled(
    keyObjects.map(async (keyObject) => {
      const keyId = keyObject.objectId;
      if (keyObject.content && 'fields' in keyObject.content) {
        const fields = keyObject.content.fields as any;
        const obligationId = String(fields.ownership.fields.of);
        const locked = await getObligationLocked(address.cache, obligationId);
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
  const obligationObjectResponse =
    typeof obligation === 'string'
      ? (
          await cache.queryGetObject(obligation, {
            showContent: true,
          })
        )?.data
      : obligation;
  let obligationLocked = false;
  if (
    obligationObjectResponse &&
    obligationObjectResponse?.content?.dataType === 'moveObject' &&
    'lock_key' in obligationObjectResponse.content.fields
  ) {
    obligationLocked = Boolean(
      obligationObjectResponse.content.fields.lock_key
    );
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
  const queryTarget = `${packageId}::obligation_query::obligation_data`;
  const args = [obligationId];

  // const txBlock = new SuiKitTxBlock();
  // txBlock.moveCall(queryTarget, args);
  const queryResult = await address.cache.queryInspectTxn(
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
  query: ScallopQuery,
  assetCoinNames: SupportAssetCoins[] = [...SUPPORT_POOLS],
  ownerAddress?: string
) => {
  const owner = ownerAddress || query.suiKit.currentAddress();
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
  const owner = ownerAddress || query.suiKit.currentAddress();
  const coinType = query.utils.parseCoinType(assetCoinName);
  const amount = await query.cache.queryGetCoinBalance({
    owner,
    coinType: coinType,
  });
  return BigNumber(amount).toNumber();
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
  const owner = ownerAddress || query.suiKit.currentAddress();
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
  const owner = ownerAddress || query.suiKit.currentAddress();
  const marketCoinType = query.utils.parseMarketCoinType(marketCoinName);
  const amount = await query.cache.queryGetCoinBalance({
    owner,
    coinType: marketCoinType,
  });
  return BigNumber(amount).toNumber();
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

  const flashloanFeeObjects = await query.cache.queryGetObjects(objIds, {
    showContent: true,
  });

  if (missingAssets.length > 0) {
    // get market object
    const marketObjectId = query.address.get('core.market');
    const marketObjectRes = await query.cache.queryGetObject(marketObjectId, {
      showContent: true,
    });
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
      ...(await query.cache.queryGetObjects(dynamicFieldObjectIds, {
        showContent: true,
      }))
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
