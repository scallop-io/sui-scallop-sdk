import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import BigNumber from 'bignumber.js';
import { PROTOCOL_OBJECT_ID } from '../constants';
import type { ScallopQuery } from '../models';
import {
  MarketInterface,
  MarketDataInterface,
  AssetPoolInterface,
  CollateralPoolInterface,
  SupportCollateralCoins,
  SupportAssetCoins,
  ObligationInterface,
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
    // parse origin data
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

    // calculated  data
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
    // how much accumulated interest since `lastUpdate`
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

    // base data
    const coin = query.utils.parseCoinName(coinType) as SupportAssetCoins;
    const symbol = coin.toUpperCase() as Uppercase<SupportAssetCoins>;
    const marketCoinType = query.utils.parseMarketCoinType(
      query.address.get(`core.coins.${coin}.id`),
      coin
    );
    const wrappedType =
      coin === 'usdc' ||
      coin === 'usdt' ||
      coin === 'eth' ||
      coin === 'btc' ||
      coin === 'apt' ||
      coin === 'sol'
        ? {
            from: 'Wormhole',
            type: 'Portal from Ethereum',
          }
        : undefined;

    assets.push({
      coin: coin,
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
    // parse origin data
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

    // base data
    const coin = query.utils.parseCoinName(coinType) as SupportCollateralCoins;
    const symbol = coin.toUpperCase() as Uppercase<SupportCollateralCoins>;
    const wrappedType =
      coin === 'usdc' ||
      coin === 'usdt' ||
      coin === 'eth' ||
      coin === 'btc' ||
      coin === 'apt' ||
      coin === 'sol'
        ? {
            from: 'Wormhole',
            type: 'Portal from Ethereum',
          }
        : undefined;

    collaterals.push({
      coin: coin,
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
  const keyObjectRefs = await query.suiKit.provider().getOwnedObjects({
    owner,
    filter: {
      StructType: `${PROTOCOL_OBJECT_ID}::obligation::ObligationKey`,
    },
  });
  const keyIds = keyObjectRefs.data
    .map((ref: any) => ref?.data?.objectId)
    .filter((id: any) => id !== undefined) as string[];
  const keyObjects = await query.suiKit.getObjects(keyIds);
  const obligations: { id: string; keyId: string }[] = [];
  for (const keyObject of keyObjects) {
    const keyId = keyObject.objectId;
    const fields = keyObject.objectFields as any;
    const obligationId = fields['ownership']['fields']['of'];
    obligations.push({ id: obligationId, keyId });
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
