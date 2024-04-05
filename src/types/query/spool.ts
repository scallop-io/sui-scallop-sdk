import type {
  SupportStakeMarketCoins,
  SupportStakeRewardCoins,
} from '../constant';

type OptionalKeys<T> = {
  [K in keyof T]?: T[K];
};

export type Spools = OptionalKeys<Record<SupportStakeMarketCoins, Spool>>;

export type Spool = {
  marketCoinName: SupportStakeMarketCoins;
  symbol: string;
  coinType: string;
  marketCoinType: string;
  coinDecimal: number;
  coinPrice: number;
  marketCoinPrice: number;
  rewards: OptionalKeys<Record<SupportStakeRewardCoins, SpoolRewardData>>;
} & Required<Pick<ParsedSpoolData, 'maxStake' | 'staked'>> &
  CalculatedSpoolData;

export type SpoolRewardData = {
  symbol: string;
  coinName: SupportStakeRewardCoins;
  coinType: string;
  coinDecimal: number;
  coinPrice: number;
} & CalculatedSpoolRewardData;

export type CalculatedSpoolRewardData = {
  rewardApr: number;
  distributedPointPerSec: number;
  accumulatedPoints: number;
  currentPointIndex: number;
  currentTotalDistributedPoint: number;
  stakedAmount: number;
  stakedCoin: number;
  stakedValue: number;
  baseWeight: number;
  weightedStakedAmount: number;
  weightedStakedCoin: number;
  weightedStakedValue: number;
  distributedPoint: number;
  points: number;
};

export type SpoolAccount = {
  rewards: OptionalKeys<
    Record<SupportStakeRewardCoins, CalculatedSpoolAccountRewardData>
  >;
};

export type CalculatedSpoolAccountRewardData = {
  stakedAmount: number;
  stakedCoin: number;
  stakedValue: number;
  boostValue: number;
};

export type OriginSpoolData = {
  id: string;
  stake_type: { fields: { name: string } };
  max_stakes: string;
  stakes: string;
};

export type ParsedSpoolData = {
  spoolId: string;
  stakeType: string;
  maxStake: number;
  staked: number;
  rewards?: Record<SupportStakeRewardCoins, ParsedSpoolRewardData>;
};

export type OriginSpoolRewardData = {
  type: string;
  distributed_point_per_period: string;
  point_distribution_time: string;
  distributed_point: string;
  points: string;
  base_weight: string;
  index: string;
  weighted_amount: string;
  last_update: string;
};

export type ParsedSpoolRewardData = {
  distributedPointPerPeriod: number;
  pointDistributionTime: number;
  distributedPoint: number;
  points: number;
  baseWeight: number;
  index: number;
  weightedAmount: number;
  lastUpdate: number;
};

export type CalculatedSpoolData = {
  stakedAmount: number;
  stakedCoin: number;
  stakedValue: number;
};

// export type OriginStakeRewardPool = {
//   claimed_rewards: string;
//   exchange_rate_denominator: string;
//   exchange_rate_numerator: string;
//   rewards: string;
//   spool_id: string;
// };

export type ParsedStakeRewardPool = {
  claimedRewards: number;
  exchangeRateDenominator: number;
  exchangeRateNumerator: number;
  rewards: number;
  spoolId: string;
};

export type StakePools = OptionalKeys<
  Record<SupportStakeMarketCoins, StakePool>
>;
export type StakeAccounts = Record<SupportStakeMarketCoins, StakeAccount[]>;

export interface StakeAccount {
  id: string;
  keyId: string;
  type: string;
  stakePoolId: string;
  stakeType: string;
  staked: number;
  rewards: OptionalKeys<Record<SupportStakeRewardCoins, StakeAccountReward>>;
  bindedVeScaKey: string | null;
}

export interface OriginOldStakeAccount {
  id: {
    id: string;
  };
  spool_id: string;
  stake_type: {
    fields: {
      name: string;
    };
  };
  stakes: string;
  points: string;
  total_points: string;
  index: string;
}
export interface ParsedOldStakeAccount {
  id: string;
  spoolId: string;
  stakeType: string;
  stakes: number;
  points: number;
  totalPoints: number;
  index: number;
  stakeMarketCoinName: SupportStakeMarketCoins;
}

export interface OriginStakeAccount {
  id: { id: string };
  binded_ve_sca_key: string | null;
  spool_id: { fields: { id: string } };
  stake_type: { fields: { name: string } };
  stakes: string;
  rewards: { fields: { id: { id: string } } };
}

export interface OriginStakeAccountReward {
  weighted_amount: string;
  points: string;
  total_points: string;
  index: string;
}
export interface StakeAccountReward {
  weightedAmount: number;
  points: number;
  totalPoints: number;
  index: number;
}

export interface OriginStakeAccountKey {
  id: { id: string };
  spool_account_id: string;
  spool_stake_type: {
    fields: {
      name: string;
    };
  };
}

export interface StakePool {
  id: string;
  type: string;
  maxStake: number;
  stakeType: string;
  totalStaked: number;
  rewards: OptionalKeys<Record<SupportStakeMarketCoins, ParsedSpoolRewardData>>;
}

export interface StakeAccountIds {
  id: string;
  keyId: string;
  stakeType: string;
}
