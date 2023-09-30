import BigNumber from 'bignumber.js';
import type {
  OriginMarketPoolData,
  ParsedMarketPoolData,
  CalculatedMarketPoolData,
  OriginMarketCollateralData,
  ParsedMarketCollateralData,
} from '../types';

/**
 *  Parse origin market pool data to a more readable format.
 *
 * @param originMarketPoolData - Origin market pool data
 * @return Parsed market pool data
 */
export const parseOriginMarketPoolData = (
  originMarketPoolData: OriginMarketPoolData
): ParsedMarketPoolData => {
  return {
    // Parse origin data required for basic calculations.
    maxBorrowRate: Number(originMarketPoolData.maxBorrowRate.value) / 2 ** 32,
    borrowRate: Number(originMarketPoolData.interestRate.value) / 2 ** 32,
    borrowRateScale: Number(originMarketPoolData.interestRateScale),
    borrowIndex: Number(originMarketPoolData.borrowIndex),
    lastUpdated: Number(originMarketPoolData.lastUpdated),
    cash: Number(originMarketPoolData.cash),
    debt: Number(originMarketPoolData.debt),
    marketCoinSupply: Number(originMarketPoolData.marketCoinSupply),
    reserve: Number(originMarketPoolData.reserve),
    reserveFactor: Number(originMarketPoolData.reserveFactor.value) / 2 ** 32,
    borrowWeight: Number(originMarketPoolData.borrowWeight.value) / 2 ** 32,
    // Parse origin data required for additional display.
    baseBorrowRate:
      Number(originMarketPoolData.baseBorrowRatePerSec.value) / 2 ** 32,
    borrowRateOnHighKink:
      Number(originMarketPoolData.borrowRateOnHighKink.value) / 2 ** 32,
    borrowRateOnMidKink:
      Number(originMarketPoolData.borrowRateOnMidKink.value) / 2 ** 32,
    highKink: Number(originMarketPoolData.highKink.value) / 2 ** 32,
    midKink: Number(originMarketPoolData.midKink.value) / 2 ** 32,
    minBorrowAmount: Number(originMarketPoolData.minBorrowAmount),
  };
};

export const calculateMarketPoolData = (
  parsedMarketPoolData: ParsedMarketPoolData
): CalculatedMarketPoolData => {
  const borrowYearFactor = 24 * 365 * 3600;

  const baseBorrowApr =
    (parsedMarketPoolData.baseBorrowRate * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;
  const baseBorrowApy =
    (1 +
      parsedMarketPoolData.baseBorrowRate /
        parsedMarketPoolData.borrowRateScale) **
      borrowYearFactor -
    1;
  const borrowAprOnHighKink =
    (parsedMarketPoolData.borrowRateOnHighKink * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;
  const borrowApyOnHighKink =
    (1 +
      parsedMarketPoolData.borrowRateOnHighKink /
        parsedMarketPoolData.borrowRateScale) **
      borrowYearFactor -
    1;
  const borrowAprOnMidKink =
    (parsedMarketPoolData.borrowRateOnMidKink * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;
  const borrowApyOnMidKink =
    (1 +
      parsedMarketPoolData.borrowRateOnMidKink /
        parsedMarketPoolData.borrowRateScale) **
      borrowYearFactor -
    1;
  const maxBorrowApr =
    (parsedMarketPoolData.maxBorrowRate * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;
  const maxBorrowApy =
    (1 +
      parsedMarketPoolData.maxBorrowRate /
        parsedMarketPoolData.borrowRateScale) **
      borrowYearFactor -
    1;
  const borrowApr =
    (parsedMarketPoolData.borrowRate * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;
  const borrowApy =
    (1 +
      parsedMarketPoolData.borrowRate / parsedMarketPoolData.borrowRateScale) **
      borrowYearFactor -
    1;

  const timeDelta =
    Math.floor(new Date().getTime() / 1000) - parsedMarketPoolData.lastUpdated;
  const borrowIndexDelta = BigNumber(parsedMarketPoolData.borrowIndex)
    .multipliedBy(
      BigNumber(timeDelta).multipliedBy(parsedMarketPoolData.borrowRate)
    )
    .dividedBy(parsedMarketPoolData.borrowRateScale);
  const currentBorrowIndex = BigNumber(parsedMarketPoolData.borrowIndex).plus(
    borrowIndexDelta
  );
  // How much accumulated interest since `lastUpdate`.
  const growthInterest = BigNumber(currentBorrowIndex)
    .dividedBy(parsedMarketPoolData.borrowIndex)
    .minus(1);
  const increasedDebt = BigNumber(parsedMarketPoolData.debt).multipliedBy(
    growthInterest
  );
  const currentTotalBorrow = increasedDebt.plus(parsedMarketPoolData.debt);
  const currentTotalReserve = BigNumber(parsedMarketPoolData.reserve).plus(
    increasedDebt.multipliedBy(parsedMarketPoolData.reserveFactor)
  );
  const currentTotalSupply = BigNumber(currentTotalBorrow).plus(
    Math.max(parsedMarketPoolData.cash - currentTotalReserve.toNumber(), 0)
  );
  let utilizationRate =
    BigNumber(currentTotalBorrow).dividedBy(currentTotalSupply);
  utilizationRate = utilizationRate.isFinite() ? utilizationRate : BigNumber(0);
  let supplyApr = BigNumber(borrowApr)
    .multipliedBy(utilizationRate)
    .multipliedBy(1 - parsedMarketPoolData.reserveFactor);
  supplyApr = supplyApr.isFinite() ? supplyApr : BigNumber(0);
  let supplyApy = BigNumber(borrowApy)
    .multipliedBy(utilizationRate)
    .multipliedBy(1 - parsedMarketPoolData.reserveFactor);
  supplyApy = supplyApy.isFinite() ? supplyApy : BigNumber(0);
  let conversionRate = currentTotalSupply.dividedBy(
    parsedMarketPoolData.marketCoinSupply
  );
  conversionRate =
    conversionRate.isFinite() && !conversionRate.isNaN()
      ? conversionRate
      : BigNumber(1);

  return {
    baseBorrowApr,
    baseBorrowApy,
    borrowAprOnHighKink,
    borrowApyOnHighKink,
    borrowAprOnMidKink,
    borrowApyOnMidKink,
    maxBorrowApr,
    maxBorrowApy,
    borrowApr: Math.min(borrowApr, maxBorrowApr),
    borrowApy: Math.min(borrowApy, maxBorrowApy),
    borrowIndex: currentBorrowIndex.toNumber(),
    growthInterest: growthInterest.toNumber(),
    totalSupply: currentTotalSupply.toNumber(),
    totalBorrow: currentTotalBorrow.toNumber(),
    totalReserve: currentTotalReserve.toNumber(),
    utilizationRate: utilizationRate.toNumber(),
    supplyApr: supplyApr.toNumber(),
    supplyApy: supplyApy.toNumber(),
    conversionRate: conversionRate.toNumber(),
  };
};

export const parseOriginMarketCollateralData = (
  originMarketCollateralData: OriginMarketCollateralData
): ParsedMarketCollateralData => {
  return {
    collateralFactor:
      Number(originMarketCollateralData.collateralFactor.value) / 2 ** 32,
    liquidationFactor:
      Number(originMarketCollateralData.liquidationFactor.value) / 2 ** 32,
    liquidationDiscount:
      Number(originMarketCollateralData.liquidationDiscount.value) / 2 ** 32,
    liquidationPanelty:
      Number(originMarketCollateralData.liquidationPanelty.value) / 2 ** 32,
    liquidationReserveFactor:
      Number(originMarketCollateralData.liquidationReserveFactor.value) /
      2 ** 32,
    maxCollateralAmount: Number(originMarketCollateralData.maxCollateralAmount),
    totalCollateralAmount: Number(
      originMarketCollateralData.totalCollateralAmount
    ),
  };
};
