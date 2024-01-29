import type { SupportBorrowIncentiveCoins } from '../constant';

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

export type BorrowIncentivePool = {
  coinName: SupportBorrowIncentiveCoins;
  symbol: string;
  coinType: string;
  rewardCoinType: string;
  coinDecimal: number;
  rewardCoinDecimal: number;
  coinPrice: number;
  rewardCoinPrice: number;
} & Required<
  Pick<
    ParsedBorrowIncentivePoolData,
    'maxPoint' | 'distributedPoint' | 'maxStake'
  >
> &
  CalculatedBorrowIncentivePoolData &
  BorrowIncentiveRewardPool;

export type OriginBorrowIncentivePoolData = {
  created_at: string;
  distributed_point: string;
  distributed_point_per_period: string;
  index: string;
  last_update: string;
  max_distributed_point: string;
  max_stakes: string;
  point_distribution_time: string;
  pool_type: {
    name: string;
  };
  stakes: string;
};

export type ParsedBorrowIncentivePoolData = {
  poolType: string;
  maxPoint: number;
  distributedPoint: number;
  pointPerPeriod: number;
  period: number;
  maxStake: number;
  staked: number;
  index: number;
  createdAt: number;
  lastUpdate: number;
};

export type CalculatedBorrowIncentivePoolData = {
  stakedAmount: number;
  stakedCoin: number;
  stakedValue: number;
  distributedPointPerSec: number;
  accumulatedPoints: number;
  currentPointIndex: number;
  currentTotalDistributedPoint: number;
  startDate: Date;
  endDate: Date;
};

export type BorrowIncentiveRewardPool = Required<
  Pick<
    ParsedBorrowIncentiveRewardPoolData,
    'exchangeRateNumerator' | 'exchangeRateDenominator'
  >
> &
  CalculatedBorrowIncentiveRewardPoolData;

export type OriginBorrowIncentiveRewardPoolData = {
  claimed_rewards: string;
  exchange_rate_denominator: string;
  exchange_rate_numerator: string;
  remaining_reward: string;
  reward_type: {
    name: string;
  };
};

export type ParsedBorrowIncentiveRewardPoolData = {
  rewardType: string;
  claimedRewards: number;
  exchangeRateDenominator: number;
  exchangeRateNumerator: number;
  remainingRewards: number;
};

export type CalculatedBorrowIncentiveRewardPoolData = {
  rewardApr: number;
  totalRewardAmount: number;
  totalRewardCoin: number;
  totalRewardValue: number;
  remaindRewardAmount: number;
  remaindRewardCoin: number;
  remaindRewardValue: number;
  claimedRewardAmount: number;
  claimedRewardCoin: number;
  claimedRewardValue: number;
  rewardPerSec: number;
};

export type BorrowIncentiveAccounts = OptionalKeys<
  Record<SupportBorrowIncentiveCoins, ParsedBorrowIncentiveAccountData>
>;

export type OriginBorrowIncentiveAccountData = {
  amount: string;
  index: string;
  points: string;
  pool_type: {
    name: string;
  };
  total_points: string;
};

export type ParsedBorrowIncentiveAccountData = {
  poolType: string;
  amount: number;
  index: number;
  points: number;
  totalPoints: number;
};

/**
 * The query interface for `incentive_pools_query::incentive_pools_data` inspectTxn.
 */
export interface BorrowIncentivePoolsQueryInterface {
  incentive_pools: OriginBorrowIncentivePoolData[];
  reward_pool: OriginBorrowIncentiveRewardPoolData;
}

/**
 * The query interface for `incentive_account_query::incentive_account_data` inspectTxn.
 */
export interface BorrowIncentiveAccountsQueryInterface {
  incentive_states: OriginBorrowIncentiveAccountData[];
  total_points: string;
}
