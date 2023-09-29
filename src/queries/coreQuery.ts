import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import BigNumber from 'bignumber.js';
import { PROTOCOL_OBJECT_ID } from '../constants';
import type { SuiObjectResponse } from '@mysten/sui.js/client';
import type { ScallopQuery } from '../models';
import {
  MarketInterface,
  MarketDataInterface,
  AssetPoolInterface,
  CollateralPoolInterface,
  SupportCollaterals,
  SupportPools,
  ObligationInterface,
  Obligation,
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
export const queryMarket = async (
  query: ScallopQuery,
  rateType: 'apy' | 'apr'
) => {
  const packageId = query.address.get('core.packages.query.id');
  const marketId = query.address.get('core.market');
  const txBlock = new SuiKitTxBlock();
  const queryTarget = `${packageId}::market_query::market_data`;
  txBlock.moveCall(queryTarget, [marketId]);
  const queryResult = await query.suiKit.inspectTxn(txBlock);
  const marketData = queryResult.events[0].parsedJson as MarketDataInterface;

  const assets: AssetPoolInterface[] = [];
  const collaterals: CollateralPoolInterface[] = [];

  for (const asset of marketData.pools) {
    // Parse origin data.
    const coinType = '0x' + asset.type.name;
    const borrowYearFactor = 24 * 365 * 3600;
    const baseBorrowRate = Number(asset.baseBorrowRatePerSec.value) / 2 ** 32;
    const borrowRateOnHighKink =
      Number(asset.borrowRateOnHighKink.value) / 2 ** 32;
    const borrowRateOnMidKink =
      Number(asset.borrowRateOnMidKink.value) / 2 ** 32;
    const maxBorrowRate = Number(asset.maxBorrowRate.value) / 2 ** 32;
    const highKink = Number(asset.highKink.value) / 2 ** 32;
    const midKink = Number(asset.midKink.value) / 2 ** 32;
    const borrowRate = Number(asset.interestRate.value) / 2 ** 32;
    const borrowRateScale = Number(asset.interestRateScale);
    const borrowIndex = Number(asset.borrowIndex);
    const lastUpdated = Number(asset.lastUpdated);
    const cash = Number(asset.cash);
    const debt = Number(asset.debt);
    const marketCoinSupply = Number(asset.marketCoinSupply);
    const minBorrowAmount = Number(asset.minBorrowAmount);
    const reserve = Number(asset.reserve);
    const reserveFactor = Number(asset.reserveFactor.value) / 2 ** 32;
    const borrowWeight = Number(asset.borrowWeight.value) / 2 ** 32;

    // Calculated  data.
    const calculatedBaseBorrowRate =
      rateType === 'apr'
        ? (baseBorrowRate * borrowYearFactor) / borrowRateScale
        : (1 + baseBorrowRate / borrowRateScale) ** borrowYearFactor - 1;
    const calculatedBorrowRateOnHighKink =
      rateType === 'apr'
        ? (borrowRateOnHighKink * borrowYearFactor) / borrowRateScale
        : (1 + borrowRateOnHighKink / borrowRateScale) ** borrowYearFactor - 1;
    const calculatedBorrowRateOnMidKink =
      rateType === 'apr'
        ? (borrowRateOnMidKink * borrowYearFactor) / borrowRateScale
        : (1 + borrowRateOnMidKink / borrowRateScale) ** borrowYearFactor - 1;
    const calculatedMaxBorrowRate =
      rateType === 'apr'
        ? (maxBorrowRate * borrowYearFactor) / borrowRateScale
        : (1 + maxBorrowRate / borrowRateScale) ** borrowYearFactor - 1;
    const calculatedBorrowRate =
      rateType === 'apr'
        ? (borrowRate * borrowYearFactor) / borrowRateScale
        : (1 + borrowRate / borrowRateScale) ** borrowYearFactor - 1;

    const timeDelta = Math.floor(new Date().getTime() / 1000) - lastUpdated;
    const borrowIndexDelta = BigNumber(borrowIndex)
      .multipliedBy(BigNumber(timeDelta).multipliedBy(borrowRate))
      .dividedBy(borrowRateScale);
    const currentBorrowIndex = BigNumber(borrowIndex).plus(borrowIndexDelta);
    // How much accumulated interest since `lastUpdate`.
    const growthInterest = BigNumber(currentBorrowIndex)
      .dividedBy(borrowIndex)
      .minus(1);
    const increasedDebt = BigNumber(debt).multipliedBy(growthInterest);
    const currentTotalDebt = increasedDebt.plus(debt);
    const currentTotalReserve = BigNumber(reserve).plus(
      increasedDebt.multipliedBy(reserveFactor)
    );
    const currentTotalSupply = BigNumber(currentTotalDebt).plus(
      Math.max(cash - currentTotalReserve.toNumber(), 0)
    );
    let utilizationRate =
      BigNumber(currentTotalDebt).dividedBy(currentTotalSupply);
    utilizationRate = utilizationRate.isFinite()
      ? utilizationRate
      : BigNumber(0);
    let supplyRate = BigNumber(calculatedBorrowRate)
      .multipliedBy(utilizationRate)
      .multipliedBy(1 - reserveFactor);
    supplyRate = supplyRate.isFinite() ? supplyRate : BigNumber(0);

    // Base data.
    const coinName = query.utils.parseCoinName(coinType) as SupportPools;
    const symbol = coinName.toUpperCase() as Uppercase<SupportPools>;
    const marketCoinType = query.utils.parseMarketCoinType(coinName);
    const wrappedType =
      coinName === 'usdc' ||
      coinName === 'usdt' ||
      coinName === 'eth' ||
      coinName === 'btc' ||
      coinName === 'apt' ||
      coinName === 'sol'
        ? {
            from: 'Wormhole',
            type: 'Portal from Ethereum',
          }
        : undefined;

    assets.push({
      coin: coinName,
      symbol: symbol,
      coinType: coinType,
      wrappedType: wrappedType,
      marketCoinType: marketCoinType,
      calculated: {
        utilizationRate: utilizationRate.toNumber(),
        baseBorrowRate: calculatedBaseBorrowRate,
        borrowInterestRate: Math.min(
          calculatedBorrowRate,
          calculatedMaxBorrowRate
        ),
        supplyInterestRate: supplyRate.toNumber(),
        currentGrowthInterest: growthInterest.toNumber(),
        currentBorrowIndex: currentBorrowIndex.toNumber(),
        currentTotalSupply: currentTotalSupply.toNumber(),
        currentTotalDebt: currentTotalDebt.toNumber(),
        currentTotalReserve: currentTotalReserve.toNumber(),
      },
      origin: {
        highKink,
        midKink,
        baseBorrowRate: calculatedBaseBorrowRate,
        borrowRateOnHighKink: calculatedBorrowRateOnHighKink,
        borrowRateOnMidKink: calculatedBorrowRateOnMidKink,
        borrowRate: calculatedBorrowRate,
        maxBorrowRate: calculatedMaxBorrowRate,
        reserveFactor,
        borrowWeight,
        borrowIndex,
        lastUpdated,
        debt,
        cash,
        marketCoinSupply,
        minBorrowAmount,
        reserve,
      },
    });
  }

  for (const collateral of marketData.collaterals) {
    // Parse origin data.
    const coinType = '0x' + collateral.type.name;
    const collateralFactor =
      Number(collateral.collateralFactor.value) / 2 ** 32;
    const liquidationFactor =
      Number(collateral.liquidationFactor.value) / 2 ** 32;
    const liquidationDiscount =
      Number(collateral.liquidationDiscount.value) / 2 ** 32;
    const liquidationPanelty =
      Number(collateral.liquidationPanelty.value) / 2 ** 32;
    const liquidationReserveFactor =
      Number(collateral.liquidationReserveFactor.value) / 2 ** 32;
    const maxCollateralAmount = Number(collateral.maxCollateralAmount);
    const totalCollateralAmount = Number(collateral.totalCollateralAmount);

    // Base data.
    const coinName = query.utils.parseCoinName(coinType) as SupportCollaterals;
    const symbol = coinName.toUpperCase() as Uppercase<SupportCollaterals>;
    const wrappedType =
      coinName === 'usdc' ||
      coinName === 'usdt' ||
      coinName === 'eth' ||
      coinName === 'btc' ||
      coinName === 'apt' ||
      coinName === 'sol'
        ? {
            from: 'Wormhole',
            type: 'Portal from Ethereum',
          }
        : undefined;

    collaterals.push({
      coin: coinName,
      symbol: symbol,
      coinType: coinType,
      wrappedType: wrappedType,
      origin: {
        collateralFactor,
        liquidationFactor,
        liquidationDiscount,
        liquidationPanelty,
        liquidationReserveFactor,
        maxCollateralAmount,
        totalCollateralAmount,
      },
    });
  }

  return {
    assets: assets,
    collaterals: collaterals,
    data: marketData,
  } as MarketInterface;
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
 * Use inspectTxn call to obtain the data provided in the scallop contract query module
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
  return queryResult.events[0].parsedJson as ObligationInterface;
};
