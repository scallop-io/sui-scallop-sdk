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
} & Required<
  Pick<ParsedSpoolData, 'maxPoint' | 'distributedPoint' | 'maxStake'>
> &
  CalculatedSpoolData &
  SpoolRewardPool;

export type OriginSpoolData = {
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

export type ParsedSpoolData = {
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

export type CalculatedSpoolData = {
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

export type SpoolRewardPool = Required<
  Pick<
    ParsedSpoolRewardPoolData,
    'exchangeRateNumerator' | 'exchangeRateDenominator'
  >
> &
  CalculatedSpoolRewardPoolData;

export type OriginSpoolRewardPoolData = {
  claimed_rewards: string;
  exchange_rate_denominator: string;
  exchange_rate_numerator: string;
  rewards: string;
  spool_id: string;
};

export type ParsedSpoolRewardPoolData = {
  claimedRewards: number;
  exchangeRateDenominator: number;
  exchangeRateNumerator: number;
  rewards: number;
  spoolId: string;
};

export type CalculatedSpoolRewardPoolData = {
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
  ratioDenominator: number;
  ratioNumerator: number;
  rewards: number;
  claimedRewards: number;
}
