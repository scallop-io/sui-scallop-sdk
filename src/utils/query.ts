import BigNumber from 'bignumber.js';
import type {
  OriginMarketPoolData,
  ParsedMarketPoolData,
  CalculatedMarketPoolData,
  OriginMarketCollateralData,
  ParsedMarketCollateralData,
  OriginStakePoolData,
  ParsedStakePoolData,
  CalculatedStakePoolData,
  OriginRewardPoolData,
  ParsedRewardPoolData,
  CalculatedRewardPoolData,
} from '../types';
import { ScallopUtils } from 'src/models';

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
  utils: ScallopUtils,
  parsedMarketPoolData: ParsedMarketPoolData
): CalculatedMarketPoolData => {
  const borrowYearFactor = 24 * 365 * 3600;

  const baseBorrowApr =
    (parsedMarketPoolData.baseBorrowRate * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;
  const borrowAprOnHighKink =
    (parsedMarketPoolData.borrowRateOnHighKink * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;
  const borrowAprOnMidKink =
    (parsedMarketPoolData.borrowRateOnMidKink * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;
  const maxBorrowApr =
    (parsedMarketPoolData.maxBorrowRate * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;
  const borrowApr =
    (parsedMarketPoolData.borrowRate * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;

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
  let conversionRate = currentTotalSupply.dividedBy(
    parsedMarketPoolData.marketCoinSupply
  );
  conversionRate =
    conversionRate.isFinite() && !conversionRate.isNaN()
      ? conversionRate
      : BigNumber(1);

  return {
    baseBorrowApr,
    baseBorrowApy: utils.parseAprToApy(baseBorrowApr),
    borrowAprOnHighKink,
    borrowApyOnHighKink: utils.parseAprToApy(borrowAprOnHighKink),
    borrowAprOnMidKink,
    borrowApyOnMidKink: utils.parseAprToApy(borrowAprOnMidKink),
    maxBorrowApr,
    maxBorrowApy: utils.parseAprToApy(maxBorrowApr),
    borrowApr: Math.min(borrowApr, maxBorrowApr),
    borrowApy: Math.min(
      utils.parseAprToApy(borrowApr),
      utils.parseAprToApy(maxBorrowApr)
    ),
    borrowIndex: currentBorrowIndex.toNumber(),
    growthInterest: growthInterest.toNumber(),
    totalSupply: currentTotalSupply.toNumber(),
    totalBorrow: currentTotalBorrow.toNumber(),
    totalReserve: currentTotalReserve.toNumber(),
    utilizationRate: utilizationRate.toNumber(),
    supplyApr: supplyApr.toNumber(),
    supplyApy: utils.parseAprToApy(supplyApr.toNumber()),
    conversionRate: conversionRate.toNumber(),
  };
};

/**
 *  Parse origin market collateral data to a more readable format.
 *
 * @param originMarketCollateralData - Origin market collateral data
 * @return Parsed market collateral data
 */
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

/**
 *  Parse origin stake pool data to a more readable format.
 *
 * @param originStakePoolData - Origin stake pool data
 * @return Parsed stake pool data
 */
export const parseOriginStakePoolData = (
  originStakePoolData: OriginStakePoolData
): ParsedStakePoolData => {
  return {
    stakeType: originStakePoolData.stakeType.fields.name,
    maxPoint: Number(originStakePoolData.maxDistributedPoint),
    distributedPoint: Number(originStakePoolData.distributedPoint),
    pointPerPeriod: Number(originStakePoolData.distributedPointPerPeriod),
    period: Number(originStakePoolData.pointDistributionTime),
    maxStake: Number(originStakePoolData.maxStake),
    totalStaked: Number(originStakePoolData.stakes),
    index: Number(originStakePoolData.index),
    createdAt: Number(originStakePoolData.createdAt),
    lastUpdate: Number(originStakePoolData.lastUpdate),
  };
};

export const calculateStakePoolData = (
  parsedStakePoolData: ParsedStakePoolData,
  stakeMarketCoinPrice: number,
  stakeMarketCoinDecimal: number
): CalculatedStakePoolData => {
  const baseIndexRate = 1_000_000_000;

  const distributedPointPerSec = BigNumber(
    parsedStakePoolData.pointPerPeriod
  ).dividedBy(parsedStakePoolData.period);

  const pointPerSec = BigNumber(parsedStakePoolData.pointPerPeriod).dividedBy(
    parsedStakePoolData.period
  );
  const remainingPeriod = BigNumber(parsedStakePoolData.maxPoint)
    .minus(parsedStakePoolData.distributedPoint)
    .dividedBy(pointPerSec);
  const startDate = parsedStakePoolData.createdAt;
  const endDate = remainingPeriod
    .plus(parsedStakePoolData.lastUpdate)
    .integerValue()
    .toNumber();

  const timeDelta = BigNumber(
    Math.floor(new Date().getTime() / 1000) - parsedStakePoolData.lastUpdate
  )
    .dividedBy(parsedStakePoolData.period)
    .toFixed(0);
  const remainingPoints = BigNumber(parsedStakePoolData.maxPoint).minus(
    parsedStakePoolData.distributedPoint
  );
  const accumulatedPoints = BigNumber.minimum(
    BigNumber(timeDelta).multipliedBy(parsedStakePoolData.pointPerPeriod),
    remainingPoints
  );

  const currentPointIndex = BigNumber(parsedStakePoolData.index).plus(
    accumulatedPoints.dividedBy(parsedStakePoolData.totalStaked).isFinite()
      ? BigNumber(baseIndexRate)
          .multipliedBy(accumulatedPoints)
          .dividedBy(parsedStakePoolData.totalStaked)
      : 0
  );
  const currentTotalDistributedPoint = BigNumber(
    parsedStakePoolData.distributedPoint
  ).plus(accumulatedPoints);

  const totalStakedValue = BigNumber(parsedStakePoolData.totalStaked)
    .shiftedBy(-1 * stakeMarketCoinDecimal)
    .multipliedBy(stakeMarketCoinPrice);

  return {
    distributedPointPerSec: distributedPointPerSec.toNumber(),
    accumulatedPoints: accumulatedPoints.toNumber(),
    currentPointIndex: currentPointIndex.toNumber(),
    currentTotalDistributedPoint: currentTotalDistributedPoint.toNumber(),
    startDate: new Date(startDate * 1000),
    endDate: new Date(endDate * 1000),
    totalStakedValue: totalStakedValue.toNumber(),
  };
};

/**
 *  Parse origin reward pool data to a more readable format.
 *
 * @param originRewardPoolData - Origin reward pool data
 * @return Parsed reward pool data
 */
export const parseOriginRewardPoolData = (
  originRewardPoolData: OriginRewardPoolData
): ParsedRewardPoolData => {
  return {
    claimedRewards: Number(originRewardPoolData.claimed_rewards),
    exchangeRateNumerator: Number(originRewardPoolData.exchange_rate_numerator),
    exchangeRateDenominator: Number(
      originRewardPoolData.exchange_rate_denominator
    ),
    rewards: Number(originRewardPoolData.rewards),
    spoolId: String(originRewardPoolData.spool_id),
  };
};

export const calculateRewardPoolData = (
  parsedStakePoolData: ParsedStakePoolData,
  parsedRewardPoolData: ParsedRewardPoolData,
  calculatedStakePoolData: CalculatedStakePoolData,
  rewardCoinPrice: number,
  rewardCoinDecimal: number
): CalculatedRewardPoolData => {
  const rateYearFactor = 365 * 24 * 60 * 60;

  const totalReward = BigNumber(parsedStakePoolData.maxPoint)
    .multipliedBy(parsedRewardPoolData.exchangeRateNumerator)
    .dividedBy(parsedRewardPoolData.exchangeRateDenominator);

  const rewardPerSec = BigNumber(calculatedStakePoolData.distributedPointPerSec)
    .multipliedBy(parsedRewardPoolData.exchangeRateNumerator)
    .dividedBy(parsedRewardPoolData.exchangeRateDenominator);

  const totalRewardValue = BigNumber(rewardPerSec)
    .shiftedBy(-1 * rewardCoinDecimal)
    .multipliedBy(rateYearFactor)
    .multipliedBy(rewardCoinPrice);

  const stakeRate = totalRewardValue
    .dividedBy(calculatedStakePoolData.totalStakedValue)
    .isFinite()
    ? totalRewardValue
        .dividedBy(calculatedStakePoolData.totalStakedValue)
        .toNumber()
    : Infinity;

  return {
    stakeApr: stakeRate,
    totalReward: totalReward.toNumber(),
    totalRewardValue: totalRewardValue.toNumber(),
    rewardPerSec: rewardPerSec.toNumber(),
    exchangeRateNumerator: parsedRewardPoolData.exchangeRateNumerator,
    exchangeRateDenominator: parsedRewardPoolData.exchangeRateDenominator,
  };
};
