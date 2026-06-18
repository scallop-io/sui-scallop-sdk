import { BigNumber } from 'bignumber.js';
import { normalizeStructTag } from '@mysten/sui/utils';
import type {
  CalculatedSpoolData,
  CalculatedSpoolRewardPoolData,
  OriginSpoolData,
  OriginSpoolRewardPoolData,
  ParsedSpoolData,
  ParsedSpoolRewardPoolData,
  RequiredSpoolObjects,
  SpoolData,
} from './types.js';
import { parseObjectAs } from 'src/utils/object.js';
import { ScallopParseError } from 'src/errors/index.js';
import { YEAR_IN_SECONDS } from './const.js';
import { parseMoveTypeName } from 'src/mappers/moveTypeMapper.js';

export const parseOriginSpoolData = (
  originSpoolData: OriginSpoolData
): ParsedSpoolData => {
  return {
    stakeType: normalizeStructTag(originSpoolData.stakeType),
    maxPoint: Number(originSpoolData.maxDistributedPoint),
    distributedPoint: Number(originSpoolData.distributedPoint),
    pointPerPeriod: Number(originSpoolData.distributedPointPerPeriod),
    period: Number(originSpoolData.pointDistributionTime),
    maxStake: Number(originSpoolData.maxStake),
    staked: Number(originSpoolData.stakes),
    index: Number(originSpoolData.index),
    createdAt: Number(originSpoolData.createdAt),
    lastUpdate: Number(originSpoolData.lastUpdate),
  };
};

export const parseSpoolObjects = (
  objects: RequiredSpoolObjects[string] = {}
): OriginSpoolData & OriginSpoolRewardPoolData => {
  const { spool, spoolReward } = objects;
  if (!spool || !spoolReward) {
    throw new ScallopParseError('spool or spoolReward is undefined');
  }

  const parsedSpool = parseObjectAs<SpoolData>(spool);
  const parsedSpoolReward =
    parseObjectAs<OriginSpoolRewardPoolData>(spoolReward);

  return {
    stakeType: parsedSpool.stake_type,
    maxDistributedPoint: parsedSpool.max_distributed_point,
    distributedPoint: parsedSpool.distributed_point,
    distributedPointPerPeriod: parsedSpool.distributed_point_per_period,
    pointDistributionTime: parsedSpool.point_distribution_time,
    maxStake: parsedSpool.max_stakes,
    stakes: parsedSpool.stakes,
    index: parsedSpool.index,
    createdAt: parsedSpool.created_at,
    lastUpdate: parsedSpool.last_update,
    ...parsedSpoolReward,
  };
};

export const calculateSpoolData = (
  parsedSpoolData: ParsedSpoolData,
  stakeMarketCoinPrice: number,
  stakeMarketCoinDecimal: number
): CalculatedSpoolData => {
  const baseIndexRate = 1_000_000_000;

  const distributedPointPerSec = BigNumber(
    parsedSpoolData.pointPerPeriod
  ).dividedBy(parsedSpoolData.period);

  const pointPerSec = BigNumber(parsedSpoolData.pointPerPeriod).dividedBy(
    parsedSpoolData.period
  );
  const remainingPeriod = pointPerSec.gt(0)
    ? BigNumber(parsedSpoolData.maxPoint)
        .minus(parsedSpoolData.distributedPoint)
        .dividedBy(pointPerSec)
    : BigNumber(0);
  const startDate = parsedSpoolData.createdAt;
  const endDate = remainingPeriod
    .plus(parsedSpoolData.lastUpdate)
    .integerValue()
    .toNumber();

  const timeDelta = BigNumber(
    Math.floor(new Date().getTime() / 1000) - parsedSpoolData.lastUpdate
  )
    .dividedBy(parsedSpoolData.period)
    .toFixed(0);
  const remainingPoints = BigNumber(parsedSpoolData.maxPoint).minus(
    parsedSpoolData.distributedPoint
  );
  const accumulatedPoints = BigNumber.minimum(
    BigNumber(timeDelta).multipliedBy(parsedSpoolData.pointPerPeriod),
    remainingPoints
  );

  const currentPointIndex = BigNumber(parsedSpoolData.index).plus(
    accumulatedPoints.dividedBy(parsedSpoolData.staked).isFinite()
      ? BigNumber(baseIndexRate)
          .multipliedBy(accumulatedPoints)
          .dividedBy(parsedSpoolData.staked)
      : 0
  );
  const currentTotalDistributedPoint = BigNumber(
    parsedSpoolData.distributedPoint
  ).plus(accumulatedPoints);

  const stakedAmount = BigNumber(parsedSpoolData.staked);
  const stakedCoin = stakedAmount.shiftedBy(-stakeMarketCoinDecimal);
  const stakedValue = stakedCoin.multipliedBy(stakeMarketCoinPrice);

  return {
    distributedPointPerSec: distributedPointPerSec.toNumber(),
    accumulatedPoints: accumulatedPoints.toNumber(),
    currentPointIndex: currentPointIndex.toNumber(),
    currentTotalDistributedPoint: currentTotalDistributedPoint.toNumber(),
    startDate: new Date(startDate * 1000),
    endDate: new Date(endDate * 1000),
    stakedAmount: stakedAmount.toNumber(),
    stakedCoin: stakedCoin.toNumber(),
    stakedValue: stakedValue.toNumber(),
  };
};

export const parseOriginSpoolRewardPoolData = (
  originSpoolRewardPoolData: OriginSpoolRewardPoolData
): ParsedSpoolRewardPoolData => {
  return {
    claimedRewards: Number(originSpoolRewardPoolData.claimed_rewards),
    exchangeRateDenominator: Number(
      originSpoolRewardPoolData.exchange_rate_denominator
    ),
    exchangeRateNumerator: Number(
      originSpoolRewardPoolData.exchange_rate_numerator
    ),
    rewards: Number(originSpoolRewardPoolData.rewards),
    spoolId: String(originSpoolRewardPoolData.spool_id),
  };
};

export const calculateSpoolRewardPoolData = (
  parsedSpoolData: ParsedSpoolData,
  parsedSpoolRewardPoolData: ParsedSpoolRewardPoolData,
  calculatedSpoolData: CalculatedSpoolData,
  rewardCoinPrice: number,
  rewardCoinDecimal: number
): CalculatedSpoolRewardPoolData => {
  const rewardPerSec = BigNumber(calculatedSpoolData.distributedPointPerSec)
    .multipliedBy(parsedSpoolRewardPoolData.exchangeRateNumerator)
    .dividedBy(parsedSpoolRewardPoolData.exchangeRateDenominator);
  const totalRewardAmount = BigNumber(parsedSpoolData.maxPoint)
    .multipliedBy(parsedSpoolRewardPoolData.exchangeRateNumerator)
    .dividedBy(parsedSpoolRewardPoolData.exchangeRateDenominator);
  const totalRewardCoin = totalRewardAmount.shiftedBy(-rewardCoinDecimal);
  const totalRewardValue = totalRewardCoin.multipliedBy(rewardCoinPrice);
  const remaindRewardAmount = BigNumber(parsedSpoolRewardPoolData.rewards);
  const remaindRewardCoin = remaindRewardAmount.shiftedBy(-rewardCoinDecimal);
  const remaindRewardValue = remaindRewardCoin.multipliedBy(rewardCoinPrice);
  const claimedRewardAmount = BigNumber(
    parsedSpoolRewardPoolData.claimedRewards
  );
  const claimedRewardCoin = claimedRewardAmount.shiftedBy(-rewardCoinDecimal);
  const claimedRewardValue = claimedRewardCoin.multipliedBy(rewardCoinPrice);

  const rewardValueForYear = BigNumber(rewardPerSec)
    .shiftedBy(-rewardCoinDecimal)
    .multipliedBy(YEAR_IN_SECONDS)
    .multipliedBy(rewardCoinPrice);

  let rewardRate = rewardValueForYear
    .dividedBy(calculatedSpoolData.stakedValue)
    .isFinite()
    ? rewardValueForYear.dividedBy(calculatedSpoolData.stakedValue).toNumber()
    : Infinity;

  if (
    parsedSpoolData.maxPoint <= parsedSpoolData.distributedPoint ||
    parsedSpoolData.pointPerPeriod === 0
  ) {
    rewardRate = Infinity;
  }

  return {
    rewardApr: rewardRate,
    totalRewardAmount: totalRewardAmount.toNumber(),
    totalRewardCoin: totalRewardCoin.toNumber(),
    totalRewardValue: totalRewardValue.toNumber(),
    remaindRewardAmount: remaindRewardAmount.toNumber(),
    remaindRewardCoin: remaindRewardCoin.toNumber(),
    remaindRewardValue: remaindRewardValue.toNumber(),
    claimedRewardAmount: claimedRewardAmount.toNumber(),
    claimedRewardCoin: claimedRewardCoin.toNumber(),
    claimedRewardValue: claimedRewardValue.toNumber(),
    rewardPerSec: rewardPerSec.toNumber(),
  };
};

export const mapSpoolData = <T extends { stakeType: unknown }>(raw: T) => ({
  ...raw,
  stakeType: parseSpoolStakeType(raw.stakeType),
});

const parseSpoolStakeType = (stakeType: unknown) => {
  try {
    return parseMoveTypeName(stakeType);
  } catch (cause) {
    throw new ScallopParseError('Failed to map Move type at spool.stakeType', {
      cause,
      context: { path: 'spool.stakeType' },
    });
  }
};
