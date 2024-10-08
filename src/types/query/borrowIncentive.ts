import type {
  SupportBorrowIncentiveCoins,
  SupportBorrowIncentiveRewardCoins,
} from '../constant';

export interface BorrowIncentiveAccountKey {
  id: string;
  onwerId: string;
}

type OptionalKeys<T> = {
  [K in keyof T]?: T[K];
};

export type BorrowIncentivePools = OptionalKeys<
  Record<SupportBorrowIncentiveCoins, BorrowIncentivePool>
>;

export type BorrowIncentivePoolPoints = {
  symbol: string;
  coinName: SupportBorrowIncentiveRewardCoins;
  coinType: string;
  coinDecimal: number;
  coinPrice: number;
} & Required<
  Pick<
    ParsedBorrowIncentivePoolPointData,
    'points' | 'distributedPoint' | 'weightedAmount'
  >
> &
  CalculatedBorrowIncentivePoolPointData;

export type BorrowIncentivePool = {
  coinName: SupportBorrowIncentiveCoins;
  symbol: string;
  coinType: string;
  coinDecimal: number;
  coinPrice: number;
  stakedAmount: number;
  stakedCoin: number;
  stakedValue: number;
  points: OptionalKeys<
    Record<SupportBorrowIncentiveRewardCoins, BorrowIncentivePoolPoints>
  >;
};

export type OriginBorrowIncentivePoolPointData = {
  point_type: {
    name: string;
  };
  distributed_point_per_period: string;
  point_distribution_time: string;
  distributed_point: string;
  points: string;
  index: string;
  base_weight: string;
  weighted_amount: string;
  last_update: string;
  created_at: string;
};

export type OriginBorrowIncentivePoolData = {
  pool_type: {
    name: string;
  };
  points: OriginBorrowIncentivePoolPointData[]; // one borrow pool can have multiple points (e.g. sui and sca)
  min_stakes: string;
  max_stakes: string;
  stakes: string;
  created_at: string;
};

export type ParsedBorrowIncentivePoolPointData = {
  pointType: string;
  distributedPointPerPeriod: number;
  period: number;
  distributedPoint: number;
  points: number;
  index: number;
  baseWeight: number;
  weightedAmount: number;
  lastUpdate: number;
  createdAt: number;
};

export type ParsedBorrowIncentivePoolData = {
  poolType: string;
  poolPoints: OptionalKeys<
    Record<
      SupportBorrowIncentiveRewardCoins,
      ParsedBorrowIncentivePoolPointData
    >
  >;
  minStakes: number;
  maxStakes: number;
  staked: number;
};

export type CalculatedBorrowIncentivePoolPointData = {
  baseWeight: number;
  weightedStakedAmount: number;
  weightedStakedCoin: number;
  weightedStakedValue: number;
  distributedPointPerSec: number;
  accumulatedPoints: number;
  currentPointIndex: number;
  currentTotalDistributedPoint: number;
  rewardApr: number;
  rewardPerSec: number;
};

export type BorrowIncentiveAccounts = OptionalKeys<
  Record<SupportBorrowIncentiveCoins, ParsedBorrowIncentiveAccountData>
>;

export type OriginBorrowIncentiveAccountPoolData = {
  point_type: {
    name: string;
  };
  weighted_amount: string;
  points: string;
  total_points: string;
  index: string;
};

export type OriginBorrowIncentiveAccountData = {
  points_list: OriginBorrowIncentiveAccountPoolData[];
  pool_type: {
    name: string;
  };
  debt_amount: string;
};

export type ParsedBorrowIncentiveAccountPoolData = {
  pointType: string;
  weightedAmount: number;
  points: number;
  totalPoints: number;
  index: number;
};

export type ParsedBorrowIncentiveAccountData = {
  pointList: OptionalKeys<
    Record<
      SupportBorrowIncentiveRewardCoins,
      ParsedBorrowIncentiveAccountPoolData
    >
  >;
  poolType: string;
  debtAmount: number;
};

/**
 * The query interface for `incentive_pools_query::incentive_pools_data` inspectTxn.
 */
export interface BorrowIncentivePoolsQueryInterface {
  incentive_pools: OriginBorrowIncentivePoolData[];
}

/**
 * The query interface for `incentive_account_query::incentive_account_data` inspectTxn.
 */
export interface BorrowIncentiveAccountsQueryInterface {
  pool_records: OriginBorrowIncentiveAccountData[];
}
