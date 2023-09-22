import { SUPPORT_STACK_MARKET_COINS } from '../../constants';
import type { SupportCoins } from './core';

export type SupportStakeMarketCoins =
  (typeof SUPPORT_STACK_MARKET_COINS)[number];

export type RewardType = {
  [key in SupportStakeMarketCoins]: SupportCoins;
};

export interface StakeAccount {
  id: string;
  type: string;
  spoolId: string;
  staked: number;
  index: number;
  points: number;
}

export interface StakePool {
  id: string;
  type: string;
  lastUpdate: number;
  index: number;
  totalStaked: number;
  maxStake: number;
  distributedPoint: number;
  maxPoint: number;
  pointPerPeriod: number;
  period: number;
  createdAt: number;
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
