import { BigNumber } from 'bignumber.js';
import {
  mapTypeNameField,
  parseMoveTypeName,
} from 'src/mappers/moveTypeMapper.js';
import type {
  BorrowIncentiveAccountsQueryInterface,
  BorrowIncentivePoolsQueryInterface,
  CalculatedBorrowIncentivePoolPointData,
  OriginBorrowIncentiveAccountData,
  OriginBorrowIncentiveAccountPoolData,
  OriginBorrowIncentivePoolData,
  OriginBorrowIncentivePoolPointData,
  ParsedBorrowIncentiveAccountData,
  ParsedBorrowIncentiveAccountPoolData,
  ParsedBorrowIncentivePoolData,
  ParsedBorrowIncentivePoolPointData,
} from './types.js';

export const parseOriginBorrowIncentivePoolPointData = (
  originBorrowIncentivePoolPointData: OriginBorrowIncentivePoolPointData
): ParsedBorrowIncentivePoolPointData => {
  return {
    pointType: parseMoveTypeName(originBorrowIncentivePoolPointData.point_type),
    distributedPointPerPeriod: Number(
      originBorrowIncentivePoolPointData.distributed_point_per_period
    ),
    period: Number(originBorrowIncentivePoolPointData.point_distribution_time),
    distributedPoint: Number(
      originBorrowIncentivePoolPointData.distributed_point
    ),
    points: Number(originBorrowIncentivePoolPointData.points),
    index: Number(originBorrowIncentivePoolPointData.index),
    baseWeight: Number(originBorrowIncentivePoolPointData.base_weight),
    weightedAmount: Number(originBorrowIncentivePoolPointData.weighted_amount),
    lastUpdate: Number(originBorrowIncentivePoolPointData.last_update),
    createdAt: Number(originBorrowIncentivePoolPointData.created_at),
  };
};

export const parseOriginBorrowIncentivePoolData = (
  parseCoinNameFromType: (coinType: string) => string,
  originBorrowIncentivePoolData: OriginBorrowIncentivePoolData
): ParsedBorrowIncentivePoolData => {
  return {
    poolType: parseMoveTypeName(originBorrowIncentivePoolData.pool_type),
    minStakes: Number(originBorrowIncentivePoolData.min_stakes),
    maxStakes: Number(originBorrowIncentivePoolData.max_stakes),
    staked: Number(originBorrowIncentivePoolData.stakes),
    poolPoints: originBorrowIncentivePoolData.points.reduce(
      (acc, point) => {
        const parsed = parseOriginBorrowIncentivePoolPointData(point);
        const name = parseCoinNameFromType(parsed.pointType);

        acc[name] = parsed;
        return acc;
      },
      {} as Record<string, ParsedBorrowIncentivePoolPointData>
    ),
  };
};

export const calculateBorrowIncentivePoolPointData = (
  parsedBorrowIncentivePoolPointData: ParsedBorrowIncentivePoolPointData,
  rewardCoinPrice: number,
  rewardCoinDecimal: number,
  poolCoinPrice: number,
  poolCoinDecimal: number
): CalculatedBorrowIncentivePoolPointData => {
  const baseIndexRate = 1_000_000_000;

  const distributedPointPerSec = BigNumber(
    parsedBorrowIncentivePoolPointData.distributedPointPerPeriod
  ).dividedBy(parsedBorrowIncentivePoolPointData.period);

  const timeDelta = BigNumber(
    Math.floor(new Date().getTime() / 1000) -
      parsedBorrowIncentivePoolPointData.lastUpdate
  )
    .dividedBy(parsedBorrowIncentivePoolPointData.period)
    .toFixed(0);
  const accumulatedPoints = BigNumber.minimum(
    BigNumber(timeDelta).multipliedBy(
      parsedBorrowIncentivePoolPointData.distributedPointPerPeriod
    ),
    BigNumber(parsedBorrowIncentivePoolPointData.points)
  );

  const currentPointIndex = BigNumber(
    parsedBorrowIncentivePoolPointData.index
  ).plus(
    accumulatedPoints
      .dividedBy(parsedBorrowIncentivePoolPointData.weightedAmount)
      .isFinite()
      ? BigNumber(baseIndexRate)
          .multipliedBy(accumulatedPoints)
          .dividedBy(parsedBorrowIncentivePoolPointData.weightedAmount)
      : 0
  );
  const currentTotalDistributedPoint = BigNumber(
    parsedBorrowIncentivePoolPointData.distributedPoint
  ).plus(accumulatedPoints);

  const baseWeight = BigNumber(parsedBorrowIncentivePoolPointData.baseWeight);
  const weightedStakedAmount = BigNumber(
    parsedBorrowIncentivePoolPointData.weightedAmount
  );

  const weightedStakedCoin = weightedStakedAmount.shiftedBy(
    -1 * poolCoinDecimal
  );
  const weightedStakedValue = weightedStakedCoin.multipliedBy(poolCoinPrice);

  const rateYearFactor = 365 * 24 * 60 * 60;
  const rewardPerSec = BigNumber(distributedPointPerSec).shiftedBy(
    -1 * rewardCoinDecimal
  );

  const rewardValueForYear = BigNumber(rewardPerSec)
    .multipliedBy(rateYearFactor)
    .multipliedBy(rewardCoinPrice);

  const weightScale = BigNumber(1_000_000_000_000);
  const rewardScale = BigNumber(
    parsedBorrowIncentivePoolPointData.baseWeight
  ).dividedBy(weightScale);

  const rewardRate =
    rewardValueForYear
      .multipliedBy(rewardScale)
      .dividedBy(weightedStakedValue)
      .isFinite() && parsedBorrowIncentivePoolPointData.points > 0
      ? rewardValueForYear
          .multipliedBy(rewardScale)
          .dividedBy(weightedStakedValue)
          .toNumber()
      : Infinity;

  return {
    distributedPointPerSec: distributedPointPerSec.toNumber(),
    accumulatedPoints: accumulatedPoints.toNumber(),
    currentPointIndex: currentPointIndex.toNumber(),
    currentTotalDistributedPoint: currentTotalDistributedPoint.toNumber(),
    baseWeight: baseWeight.toNumber(),
    weightedStakedAmount: weightedStakedAmount.toNumber(),
    weightedStakedCoin: weightedStakedCoin.toNumber(),
    weightedStakedValue: weightedStakedValue.toNumber(),
    rewardApr: rewardRate,
    rewardPerSec: rewardPerSec.toNumber(),
  };
};

export const parseOriginBorrowIncentiveAccountPoolPointData = (
  originBorrowIncentiveAccountPoolPointData: OriginBorrowIncentiveAccountPoolData
): ParsedBorrowIncentiveAccountPoolData => {
  return {
    pointType: parseMoveTypeName(
      originBorrowIncentiveAccountPoolPointData.point_type
    ),
    weightedAmount: Number(
      originBorrowIncentiveAccountPoolPointData.weighted_amount
    ),
    points: Number(originBorrowIncentiveAccountPoolPointData.points),
    totalPoints: Number(originBorrowIncentiveAccountPoolPointData.total_points),
    index: Number(originBorrowIncentiveAccountPoolPointData.index),
  };
};

export const parseOriginBorrowIncentiveAccountData = (
  parseCoinNameFromType: (coinType: string) => string,
  originBorrowIncentiveAccountData: OriginBorrowIncentiveAccountData
): ParsedBorrowIncentiveAccountData => {
  return {
    poolType: parseMoveTypeName(originBorrowIncentiveAccountData.pool_type),
    debtAmount: Number(originBorrowIncentiveAccountData.debt_amount),
    pointList: originBorrowIncentiveAccountData.points_list.reduce(
      (acc, point) => {
        const parsed = parseOriginBorrowIncentiveAccountPoolPointData(point);
        const name = parseCoinNameFromType(parsed.pointType);
        acc[name] = parsed;
        return acc;
      },
      {} as Record<string, ParsedBorrowIncentiveAccountPoolData>
    ),
  };
};

export const mapBorrowIncentivePoolsEvent = (
  raw: BorrowIncentivePoolsQueryInterface | undefined
) => {
  if (!raw) return undefined;

  return {
    ...raw,
    incentive_pools: (raw.incentive_pools ?? []).map((pool, poolIndex) => ({
      ...pool,
      pool_type: mapTypeNameField(
        pool.pool_type,
        `borrowIncentive.incentive_pools[${poolIndex}].pool_type`
      ),
      points: (pool.points ?? []).map((point, pointIndex) => ({
        ...point,
        point_type: mapTypeNameField(
          point.point_type,
          `borrowIncentive.incentive_pools[${poolIndex}].points[${pointIndex}].point_type`
        ),
      })),
    })),
  };
};

export const mapBorrowIncentiveAccountsEvent = (
  raw: BorrowIncentiveAccountsQueryInterface | undefined
) => {
  if (!raw) return undefined;

  return {
    ...raw,
    pool_records: (raw.pool_records ?? []).map((record, recordIndex) => ({
      ...record,
      pool_type: mapTypeNameField(
        record.pool_type,
        `borrowIncentive.pool_records[${recordIndex}].pool_type`
      ),
      points_list: (record.points_list ?? []).map((point, pointIndex) => ({
        ...point,
        point_type: mapTypeNameField(
          point.point_type,
          `borrowIncentive.pool_records[${recordIndex}].points_list[${pointIndex}].point_type`
        ),
      })),
    })),
  };
};
