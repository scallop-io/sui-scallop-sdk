import type { SupportStakeMarketCoins } from '../constant';

type OptionalKeys<T> = {
  [K in keyof T]?: T[K];
};

export type Spools = OptionalKeys<Record<SupportStakeMarketCoins, Spool>>;

export type Spool = {
  marketCoinName: SupportStakeMarketCoins;
  symbol: string;
  coinType: string;
  marketCoinType: string;
  rewardCoinType: string;
  coinDecimal: number;
  rewardCoinDecimal: number;
  coinPrice: number;
  marketCoinPrice: number;
  rewardCoinPrice: number;
} & CalculatedStakePoolData &
  CalculatedRewardPoolData;

export type OriginStakePoolData = {
  stakeType: { fields: { name: string } };
  maxDistributedPoint: string;
  distributedPoint: string;
  distributedPointPerPeriod: string;
  pointDistributionTime: string;
  maxStake: string;
  stakes: string;
  index: string;
  createdAt: string;
  lastUpdate: string;
};

export type ParsedStakePoolData = {
  stakeType: string;
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

export type CalculatedStakePoolData = {
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

export type OriginRewardPoolData = {
  claimed_rewards: string;
  exchange_rate_denominator: string;
  exchange_rate_numerator: string;
  rewards: string;
  spool_id: string;
};

export type ParsedRewardPoolData = {
  claimedRewards: number;
  exchangeRateNumerator: number;
  exchangeRateDenominator: number;
  rewards: number;
  spoolId: string;
};

export type CalculatedRewardPoolData = {
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
  exchangeRateNumerator: number;
  exchangeRateDenominator: number;
};

export type StakePools = OptionalKeys<
  Record<SupportStakeMarketCoins, StakePool>
>;
export type StakeRewardPools = OptionalKeys<
  Record<SupportStakeMarketCoins, StakeRewardPool>
>;
export type StakeAccounts = Record<SupportStakeMarketCoins, StakeAccount[]>;

export interface StakeAccount {
  id: string;
  type: string;
  stakePoolId: string;
  stakeType: string;
  staked: number;
  index: number;
  points: number;
  totalPoints: number;
}

export interface StakePool {
  id: string;
  type: string;
  maxPoint: number;
  distributedPoint: number;
  pointPerPeriod: number;
  period: number;
  maxStake: number;
  stakeType: string;
  totalStaked: number;
  index: number;
  createdAt: number;
  lastUpdate: number;
}

export interface StakeRewardPool {
  id: string;
  type: string;
  stakePoolId: string;
  ratioNumerator: number;
  ratioDenominator: number;
  rewards: number;
  claimedRewards: number;
}
