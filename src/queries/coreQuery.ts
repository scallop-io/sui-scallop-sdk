import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import BigNumber from 'bignumber.js';
import {
  SUPPORT_POOLS,
  PROTOCOL_OBJECT_ID,
  SUPPORT_COLLATERALS,
} from '../constants';
import {
  parseOriginMarketPoolData,
  calculateMarketPoolData,
  parseOriginMarketCollateralData,
  parseOriginObligationData,
} from '../utils';
import type { SuiObjectResponse, SuiObjectData } from '@mysten/sui.js/client';
import type { ScallopQuery } from '../models';
import {
  Market,
  MarketPools,
  MarketPool,
  MarketCollaterals,
  MarketCollateral,
  MarketQueryInterface,
  SupportPoolCoins,
  SupportCollateralCoins,
  ObligationQueryInterface,
  Obligation,
  InterestModel,
  BorrowIndex,
  BalanceSheet,
  RiskModel,
  CollateralStat,
  Coins,
  MarketCoins,
  SupportMarketCoins,
} from '../types';

/**
 * Query market data.
 *
 * @description
 * Use inspectTxn call to obtain the data provided in the scallop contract query module
 *
 * @param query - The Scallop query instance.
 * @param rateType - How interest rates are calculated.
 * @return Market data.
 */
export const queryMarket = async (query: ScallopQuery) => {
  const packageId = query.address.get('core.packages.query.id');
  const marketId = query.address.get('core.market');
  const txBlock = new SuiKitTxBlock();
  const queryTarget = `${packageId}::market_query::market_data`;
  txBlock.moveCall(queryTarget, [marketId]);
  const queryResult = await query.suiKit.inspectTxn(txBlock);
  const marketData = queryResult.events[0].parsedJson as MarketQueryInterface;

  const pools: MarketPool[] = [];
  const collaterals: MarketCollateral[] = [];

  for (const pool of marketData.pools) {
    const parsedMarketPoolData = parseOriginMarketPoolData({
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

    const coinType = '0x' + pool.type.name;
    const coinName = query.utils.parseCoinName(coinType) as SupportPoolCoins;
    const coinPrice =
      (await query.utils.getCoinPrices([coinName]))?.[coinName] ?? 0;

    pools.push({
      coin: coinName,
      symbol: query.utils.parseSymbol(coinName),
      coinType: coinType,
      marketCoinType: query.utils.parseMarketCoinType(coinName),
      coinWrappedType: query.utils.getCoinWrappedType(coinName),
      coinDecimal: query.utils.getCoinDecimal(coinName),
      coinPrice: coinPrice,
      ...calculatedMarketPoolData,
    });
  }

  for (const collateral of marketData.collaterals) {
    const parsedMarketCollateralData = parseOriginMarketCollateralData({
      collateralFactor: collateral.collateralFactor,
      liquidationFactor: collateral.collateralFactor,
      liquidationDiscount: collateral.liquidationDiscount,
      liquidationPanelty: collateral.liquidationPanelty,
      liquidationReserveFactor: collateral.liquidationReserveFactor,
      maxCollateralAmount: collateral.maxCollateralAmount,
      totalCollateralAmount: collateral.totalCollateralAmount,
    });

    const coinType = '0x' + collateral.type.name;
    const coinName = query.utils.parseCoinName(
      coinType
    ) as SupportCollateralCoins;
    const coinPrice =
      (await query.utils.getCoinPrices([coinName]))?.[coinName] ?? 0;

    collaterals.push({
      coin: coinName,
      symbol: query.utils.parseSymbol(coinName),
      coinType: coinType,
      marketCoinType: query.utils.parseMarketCoinType(coinName),
      coinWrappedType: query.utils.getCoinWrappedType(coinName),
      coinDecimal: query.utils.getCoinDecimal(coinName),
      coinPrice: coinPrice,
      ...parsedMarketCollateralData,
    });
  }

  return {
    pools,
    collaterals,
    data: marketData,
  } as Market;
};

/**
 * Get coin market pools data.
 *
 * @param query - The Scallop query instance.
 * @param coinNames - Specific an array of support coin name.
 * @return Market pools data.
 */
export const getMarketPools = async (
  query: ScallopQuery,
  coinNames?: SupportPoolCoins[]
) => {
  coinNames = coinNames || [...SUPPORT_POOLS];
  const marketId = query.address.get('core.market');
  const marketObjectResponse = await query.suiKit.client().getObject({
    id: marketId,
    options: {
      showContent: true,
    },
  });
  const allCoinPrices = await query.utils.getCoinPrices(coinNames ?? []);

  const marketPools: MarketPools = {};
  for (const coinName of coinNames) {
    const marketPool = await getMarketPool(
      query,
      coinName,
      marketObjectResponse.data,
      allCoinPrices?.[coinName]
    );

    if (marketPool) {
      marketPools[coinName] = marketPool;
    }
  }

  return marketPools;
};

/**
 * Get market pool data.
 *
 * @param query - The Scallop query instance.
 * @param coinName - Suppot coin name.
 * @param marketObject - The market object.
 * @param coinPrice - The coin price.
 * @returns Market pool data.
 */
export const getMarketPool = async (
  query: ScallopQuery,
  coinName: SupportPoolCoins,
  marketObject?: SuiObjectData | null,
  coinPrice?: number
) => {
  const marketId = query.address.get('core.market');
  marketObject =
    marketObject ||
    (
      await query.suiKit.client().getObject({
        id: marketId,
        options: {
          showContent: true,
        },
      })
    ).data;

  let marketPool: MarketPool | undefined;
  let balanceSheet: BalanceSheet | undefined;
  let borrowIndex: BorrowIndex | undefined;
  let interestModel: InterestModel | undefined;
  if (marketObject) {
    if (marketObject.content && 'fields' in marketObject.content) {
      const fields = marketObject.content.fields as any;
      const coinType = query.utils.parseCoinType(coinName);

      // Get balance sheet.
      const balanceSheetParentId =
        fields.vault.fields.balance_sheets.fields.table.fields.id.id;
      const balanceSheetDdynamicFieldObjectResponse = await query.suiKit
        .client()
        .getDynamicFieldObject({
          parentId: balanceSheetParentId,
          name: {
            type: '0x1::type_name::TypeName',
            value: {
              name: coinType.substring(2),
            },
          },
        });
      const balanceSheetDdynamicFieldObject =
        balanceSheetDdynamicFieldObjectResponse.data;
      if (
        balanceSheetDdynamicFieldObject &&
        balanceSheetDdynamicFieldObject.content &&
        'fields' in balanceSheetDdynamicFieldObject.content
      ) {
        const dynamicFields = balanceSheetDdynamicFieldObject.content
          .fields as any;
        balanceSheet = dynamicFields.value.fields;
      }

      // Get borrow index.
      const borrowIndexParentId =
        fields.borrow_dynamics.fields.table.fields.id.id;
      const borrowIndexDynamicFieldObjectResponse = await query.suiKit
        .client()
        .getDynamicFieldObject({
          parentId: borrowIndexParentId,
          name: {
            type: '0x1::type_name::TypeName',
            value: {
              name: coinType.substring(2),
            },
          },
        });
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
      const interestModelDynamicFieldObjectResponse = await query.suiKit
        .client()
        .getDynamicFieldObject({
          parentId: interestModelParentId,
          name: {
            type: '0x1::type_name::TypeName',
            value: {
              name: coinType.substring(2),
            },
          },
        });
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
    }
  }

  if (balanceSheet && borrowIndex && interestModel) {
    const parsedMarketPoolData = parseOriginMarketPoolData({
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

    coinPrice =
      coinPrice || (await query.utils.getCoinPrices([coinName]))?.[coinName];
    marketPool = {
      coin: coinName,
      symbol: query.utils.parseSymbol(coinName),
      coinType: query.utils.parseCoinType(coinName),
      marketCoinType: query.utils.parseMarketCoinType(coinName),
      coinWrappedType: query.utils.getCoinWrappedType(coinName),
      coinDecimal: query.utils.getCoinDecimal(coinName),
      coinPrice: coinPrice ?? 0,
      ...calculatedMarketPoolData,
    };
  }

  return marketPool;
};

/**
 * Get coin market collaterals data.
 *
 * @param query - The Scallop query instance.
 * @param coinNames - Specific an array of support coin name.
 * @return Market collaterals data.
 */
export const getMarketCollaterals = async (
  query: ScallopQuery,
  coinNames?: SupportCollateralCoins[]
) => {
  coinNames = coinNames || [...SUPPORT_COLLATERALS];
  const marketId = query.address.get('core.market');
  const marketObjectResponse = await query.suiKit.client().getObject({
    id: marketId,
    options: {
      showContent: true,
    },
  });
  const allCoinPrices = await query.utils.getCoinPrices(coinNames ?? []);

  const marketCollaterals: MarketCollaterals = {};
  for (const coinName of coinNames) {
    const marketCollateral = await getMarketCollateral(
      query,
      coinName,
      marketObjectResponse.data,
      allCoinPrices?.[coinName]
    );

    if (marketCollateral) {
      marketCollaterals[coinName] = marketCollateral;
    }
  }

  return marketCollaterals;
};

/**
 * Get market collateral data.
 *
 * @param query - The Scallop query instance.
 * @param coinName - Suppot coin name.
 * @param marketObject - The market object.
 * @param coinPrice - The coin price.
 * @returns Market collateral data.
 */
export const getMarketCollateral = async (
  query: ScallopQuery,
  coinName: SupportCollateralCoins,
  marketObject?: SuiObjectData | null,
  coinPrice?: number
) => {
  const marketId = query.address.get('core.market');
  marketObject =
    marketObject ||
    (
      await query.suiKit.client().getObject({
        id: marketId,
        options: {
          showContent: true,
        },
      })
    ).data;

  let marketCollateral: MarketCollateral | undefined;
  let riskModel: RiskModel | undefined;
  let collateralStat: CollateralStat | undefined;
  if (marketObject) {
    if (marketObject.content && 'fields' in marketObject.content) {
      const fields = marketObject.content.fields as any;
      const coinType = query.utils.parseCoinType(coinName);

      // Get risk model.
      const riskModelParentId = fields.risk_models.fields.table.fields.id.id;
      const riskModelDdynamicFieldObjectResponse = await query.suiKit
        .client()
        .getDynamicFieldObject({
          parentId: riskModelParentId,
          name: {
            type: '0x1::type_name::TypeName',
            value: {
              name: coinType.substring(2),
            },
          },
        });
      const riskModelDdynamicFieldObject =
        riskModelDdynamicFieldObjectResponse.data;
      if (
        riskModelDdynamicFieldObject &&
        riskModelDdynamicFieldObject.content &&
        'fields' in riskModelDdynamicFieldObject.content
      ) {
        const dynamicFields = riskModelDdynamicFieldObject.content
          .fields as any;
        riskModel = dynamicFields.value.fields;
      }

      // Get collateral stat.
      const collateralStatParentId =
        fields.collateral_stats.fields.table.fields.id.id;
      const collateralStatDynamicFieldObjectResponse = await query.suiKit
        .client()
        .getDynamicFieldObject({
          parentId: collateralStatParentId,
          name: {
            type: '0x1::type_name::TypeName',
            value: {
              name: coinType.substring(2),
            },
          },
        });
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
      collateralFactor: riskModel.collateral_factor.fields,
      liquidationFactor: riskModel.liquidation_factor.fields,
      liquidationDiscount: riskModel.liquidation_discount.fields,
      liquidationPanelty: riskModel.liquidation_penalty.fields,
      liquidationReserveFactor: riskModel.liquidation_revenue_factor.fields,
      maxCollateralAmount: riskModel.max_collateral_amount,
      totalCollateralAmount: collateralStat.amount,
    });

    coinPrice =
      coinPrice || (await query.utils.getCoinPrices([coinName]))?.[coinName];
    marketCollateral = {
      coin: coinName,
      symbol: query.utils.parseSymbol(coinName),
      coinType: query.utils.parseCoinType(coinName),
      marketCoinType: query.utils.parseMarketCoinType(coinName),
      coinWrappedType: query.utils.getCoinWrappedType(coinName),
      coinDecimal: query.utils.getCoinDecimal(coinName),
      coinPrice: coinPrice ?? 0,
      ...parsedMarketCollateralData,
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
  query: ScallopQuery,
  ownerAddress?: string
) => {
  const owner = ownerAddress || query.suiKit.currentAddress();
  const keyObjectsResponse: SuiObjectResponse[] = [];
  let hasNextPage = false;
  let nextCursor: string | null = null;
  do {
    const paginatedKeyObjectsResponse = await query.suiKit
      .client()
      .getOwnedObjects({
        owner,
        filter: {
          StructType: `${PROTOCOL_OBJECT_ID}::obligation::ObligationKey`,
        },
        cursor: nextCursor,
      });
    keyObjectsResponse.push(...paginatedKeyObjectsResponse.data);
    if (
      paginatedKeyObjectsResponse.hasNextPage &&
      paginatedKeyObjectsResponse.nextCursor
    ) {
      hasNextPage = true;
      nextCursor = paginatedKeyObjectsResponse.nextCursor;
    }
  } while (hasNextPage);

  const keyObjectIds: string[] = keyObjectsResponse
    .map((ref: any) => ref?.data?.objectId)
    .filter((id: any) => id !== undefined);
  const keyObjects = await query.suiKit.getObjects(keyObjectIds);
  const obligations: Obligation[] = [];
  for (const keyObject of keyObjects) {
    const keyId = keyObject.objectId;
    if (keyObject.content && 'fields' in keyObject.content) {
      const fields = keyObject.content.fields as any;
      const obligationId = String(fields.ownership.fields.of);
      obligations.push({ id: obligationId, keyId });
    }
  }
  return obligations;
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
  query: ScallopQuery,
  obligationId: string
) => {
  const packageId = query.address.get('core.packages.query.id');
  const queryTarget = `${packageId}::obligation_query::obligation_data`;
  const txBlock = new SuiKitTxBlock();
  txBlock.moveCall(queryTarget, [obligationId]);
  const queryResult = await query.suiKit.inspectTxn(txBlock);
  return queryResult.events[0].parsedJson as ObligationQueryInterface;
};

/**
 * Get obligation account data.
 *
 * @description
 * This function still uses the query, but converts the return into a more convenient format.
 *
 * @param query - The Scallop query instance.
 * @param obligationId - The obligation id.
 * @return Obligation account data.
 */
export const getObligationAccount = async (
  query: ScallopQuery,
  obligationId: string
) => {
  const obligationQuery = await queryObligation(query, obligationId);
  return parseOriginObligationData(query.utils, obligationQuery);
};

/**
 * Query all owned coin amount.
 *
 * @param query - The Scallop query instance.
 * @param coinNames - Specific an array of support coin name.
 * @param ownerAddress - The owner address.
 * @return All owned coin amounts.
 */
export const getCoinAmounts = async (
  query: ScallopQuery,
  coinNames?: SupportPoolCoins[],
  ownerAddress?: string
) => {
  coinNames = coinNames || [...SUPPORT_POOLS];
  const owner = ownerAddress || query.suiKit.currentAddress();
  const coinObjectsResponse: SuiObjectResponse[] = [];
  let hasNextPage = false;
  let nextCursor: string | null = null;
  do {
    const paginatedCoinObjectsResponse = await query.suiKit
      .client()
      .getOwnedObjects({
        owner,
        filter: {
          MatchAny: coinNames.map((coinName) => {
            const coinType = query.utils.parseCoinType(coinName);
            return { StructType: `0x2::coin::Coin<${coinType}>` };
          }),
        },
        options: {
          showType: true,
          showContent: true,
        },
        cursor: nextCursor,
      });

    coinObjectsResponse.push(...paginatedCoinObjectsResponse.data);
    if (
      paginatedCoinObjectsResponse.hasNextPage &&
      paginatedCoinObjectsResponse.nextCursor
    ) {
      hasNextPage = true;
      nextCursor = paginatedCoinObjectsResponse.nextCursor;
    }
  } while (hasNextPage);

  const coins: Coins = {};
  const coinObjects = coinObjectsResponse
    .map((response) => {
      return response.data;
    })
    .filter(
      (object: any) => object !== undefined && object !== null
    ) as SuiObjectData[];
  for (const coinObject of coinObjects) {
    const type = coinObject.type as string;
    if (coinObject.content && 'fields' in coinObject.content) {
      const fields = coinObject.content.fields as any;
      const coinName = query.utils.parseCoinName(type);
      if (coinName) {
        coins[coinName] = BigNumber(coins[coinName] ?? 0)
          .plus(fields.balance)
          .toNumber();
      }
    }
  }
  return coins;
};

/**
 * Query owned coin amount.
 *
 * @param query - The Scallop query instance.
 * @param coinName - Specific support coin name.
 * @param ownerAddress - The owner address.
 * @return Owned coin amount.
 */
export const getCoinAmount = async (
  query: ScallopQuery,
  coinName: SupportPoolCoins,
  ownerAddress?: string
) => {
  const owner = ownerAddress || query.suiKit.currentAddress();
  const coinType = query.utils.parseCoinType(coinName);
  const coinObjectsResponse: SuiObjectResponse[] = [];
  let hasNextPage = false;
  let nextCursor: string | null = null;
  do {
    const paginatedCoinObjectsResponse = await query.suiKit
      .client()
      .getOwnedObjects({
        owner,
        filter: { StructType: `0x2::coin::Coin<${coinType}>` },
        options: {
          showContent: true,
        },
        cursor: nextCursor,
      });

    coinObjectsResponse.push(...paginatedCoinObjectsResponse.data);
    if (
      paginatedCoinObjectsResponse.hasNextPage &&
      paginatedCoinObjectsResponse.nextCursor
    ) {
      hasNextPage = true;
      nextCursor = paginatedCoinObjectsResponse.nextCursor;
    }
  } while (hasNextPage);

  let coinAmount: number = 0;
  const coinObjects = coinObjectsResponse
    .map((response) => {
      return response.data;
    })
    .filter(
      (object: any) => object !== undefined && object !== null
    ) as SuiObjectData[];
  for (const coinObject of coinObjects) {
    if (coinObject.content && 'fields' in coinObject.content) {
      const fields = coinObject.content.fields as any;
      coinAmount = BigNumber(coinAmount).plus(fields.balance).toNumber();
    }
  }
  return coinAmount;
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
    ([...SUPPORT_POOLS].map(
      (coinName) => `s${coinName}`
    ) as SupportMarketCoins[]);
  const owner = ownerAddress || query.suiKit.currentAddress();
  const marketCoinObjectsResponse: SuiObjectResponse[] = [];
  let hasNextPage = false;
  let nextCursor: string | null = null;
  do {
    const paginatedMarketCoinObjectsResponse = await query.suiKit
      .client()
      .getOwnedObjects({
        owner,
        filter: {
          MatchAny: marketCoinNames.map((marketCoinName) => {
            const coinName = marketCoinName.slice(1) as SupportPoolCoins;
            const marketCoinType = query.utils.parseMarketCoinType(coinName);
            return { StructType: `0x2::coin::Coin<${marketCoinType}>` };
          }),
        },
        options: {
          showType: true,
          showContent: true,
        },
        cursor: nextCursor,
      });

    marketCoinObjectsResponse.push(...paginatedMarketCoinObjectsResponse.data);
    if (
      paginatedMarketCoinObjectsResponse.hasNextPage &&
      paginatedMarketCoinObjectsResponse.nextCursor
    ) {
      hasNextPage = true;
      nextCursor = paginatedMarketCoinObjectsResponse.nextCursor;
    }
  } while (hasNextPage);

  const marketCoins: MarketCoins = {};
  const marketCoinObjects = marketCoinObjectsResponse
    .map((response) => {
      return response.data;
    })
    .filter(
      (object: any) => object !== undefined && object !== null
    ) as SuiObjectData[];
  for (const marketCoinObject of marketCoinObjects) {
    const type = marketCoinObject.type as string;
    if (marketCoinObject.content && 'fields' in marketCoinObject.content) {
      const fields = marketCoinObject.content.fields as any;
      const coinName = query.utils.parseCoinName(type);
      if (coinName) {
        marketCoins[coinName] = BigNumber(marketCoins[coinName] ?? 0)
          .plus(fields.balance)
          .toNumber();
      }
    }
  }
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
  marketCoinNames: SupportMarketCoins,
  ownerAddress?: string
) => {
  const owner = ownerAddress || query.suiKit.currentAddress();
  const coinName = marketCoinNames.slice(1) as SupportPoolCoins;
  const marketCoinType = query.utils.parseMarketCoinType(coinName);
  const marketCoinObjectsResponse: SuiObjectResponse[] = [];
  let hasNextPage = false;
  let nextCursor: string | null = null;
  do {
    const paginatedMarketCoinObjectsResponse = await query.suiKit
      .client()
      .getOwnedObjects({
        owner,
        filter: { StructType: `0x2::coin::Coin<${marketCoinType}>` },
        options: {
          showContent: true,
        },
        cursor: nextCursor,
      });

    marketCoinObjectsResponse.push(...paginatedMarketCoinObjectsResponse.data);
    if (
      paginatedMarketCoinObjectsResponse.hasNextPage &&
      paginatedMarketCoinObjectsResponse.nextCursor
    ) {
      hasNextPage = true;
      nextCursor = paginatedMarketCoinObjectsResponse.nextCursor;
    }
  } while (hasNextPage);

  let marketCoinAmount: number = 0;
  const marketCoinObjects = marketCoinObjectsResponse
    .map((response) => {
      return response.data;
    })
    .filter(
      (object: any) => object !== undefined && object !== null
    ) as SuiObjectData[];
  for (const marketCoinObject of marketCoinObjects) {
    if (marketCoinObject.content && 'fields' in marketCoinObject.content) {
      const fields = marketCoinObject.content.fields as any;
      marketCoinAmount = BigNumber(marketCoinAmount)
        .plus(fields.balance)
        .toNumber();
    }
  }
  return marketCoinAmount;
};
