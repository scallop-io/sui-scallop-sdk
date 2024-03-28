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

// export type BorrowIncentivePool = {
//   coinName: SupportBorrowIncentiveCoins;
//   symbol: string;
//   coinType: string;
//   rewardCoinType: string;
//   coinDecimal: number;
//   rewardCoinDecimal: number;
//   coinPrice: number;
//   rewardCoinPrice: number;
// } & Required<
//   Pick<
//     ParsedBorrowIncentivePoolData,
//     'maxPoints' | 'distributedPoint' | 'maxStake'
//   >
// > &
//   CalculatedBorrowIncentivePoolData &
//   BorrowIncentiveRewardPool;

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
  staked: number;
  points: OptionalKeys<
    Record<SupportBorrowIncentiveRewardCoins, BorrowIncentivePoolPoints>
  >;
};

// export type OriginBorrowIncentivePoolData = {
//   created_at: string;
//   distributed_point: string;
//   distributed_point_per_period: string;
//   index: string;
//   last_update: string;
//   max_distributed_point: string;
//   max_stakes: string;
//   point_distribution_time: string;
//   pool_type: {
//     name: string;
//   };
//   stakes: string;
// };

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
};

// export type ParsedBorrowIncentivePoolData = {
//   poolType: string;
//   maxPoint: number;
//   distributedPoint: number;
//   pointPerPeriod: number;
//   period: number;
//   maxStake: number;
//   staked: number;
//   index: number;
//   createdAt: number;
//   lastUpdate: number;
// };
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
  createdAt: number;
};

export type CalculatedBorrowIncentivePoolPointData = {
  stakedAmount: number;
  stakedCoin: number;
  stakedValue: number;
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

// export type BorrowIncentiveRewardPool = CalculatedBorrowIncentiveRewardPoolData;

// export type OriginBorrowIncentiveRewardPoolData = {
//   claimed_rewards: string;
//   exchange_rate_denominator: string;
//   exchange_rate_numerator: string;
//   remaining_reward: string;
//   reward_type: {
//     name: string;
//   };
// };

// export type ParsedBorrowIncentiveRewardPoolData = {
//   rewardType: string;
//   claimedRewards: number;
//   exchangeRateDenominator: number;
//   exchangeRateNumerator: number;
//   remainingRewards: number;
// };

// export type CalculatedBorrowIncentiveRewardPoolData = {
//   rewardApr: number;
//   totalRewardAmount: number;
//   totalRewardCoin: number;
//   totalRewardValue: number;
//   // remaindRewardAmount: number;
//   // remaindRewardCoin: number;
//   // remaindRewardValue: number;
//   // claimedRewardAmount: number;
//   // claimedRewardCoin: number;
//   // claimedRewardValue: number;
//   rewardPerSec: number;
// };

export type BorrowIncentiveAccounts = OptionalKeys<
  Record<SupportBorrowIncentiveCoins, ParsedBorrowIncentiveAccountData>
>;

// export type OriginBorrowIncentiveAccountData = {
//   amount: string;
//   index: string;
//   points: string;
//   pool_type: {
//     name: string;
//   };
//   total_points: string;
// };

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

// export type ParsedBorrowIncentiveAccountData = {
//   poolType: string;
//   amount: number;
//   index: number;
//   points: number;
//   totalPoints: number;
// };

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
// export interface BorrowIncentivePoolsQueryInterface {
//   incentive_pools: OriginBorrowIncentivePoolData[];
//   reward_pool: OriginBorrowIncentiveRewardPoolData;
// }

export interface BorrowIncentivePoolsQueryInterface {
  incentive_pools: OriginBorrowIncentivePoolData[];
}

/**
 * The query interface for `incentive_account_query::incentive_account_data` inspectTxn.
 */
// export interface BorrowIncentiveAccountsQueryInterface {
//   incentive_states: OriginBorrowIncentiveAccountData[];
//   total_points: string;
// }

export interface BorrowIncentiveAccountsQueryInterface {
  pool_records: OriginBorrowIncentiveAccountData[];
}
