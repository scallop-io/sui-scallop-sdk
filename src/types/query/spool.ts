import { SupportStakeMarketCoins } from '../constant';

type OptionalKeys<T> = {
  [K in keyof T]?: T[K];
};

export type StakePools = OptionalKeys<
  Record<SupportStakeMarketCoins, StakePool>
>;
export type RewardPools = OptionalKeys<
  Record<SupportStakeMarketCoins, RewardPool>
>;

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

export interface RewardPool {
  id: string;
  type: string;
  stakePoolId: string;
  ratioNumerator: number;
  ratioDenominator: number;
  rewards: number;
  claimedRewards: number;
}
