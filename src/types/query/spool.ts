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
  rewards: OptionalKeys<
    Record<SupportStakeRewardCoins, CalculatedSpoolRewardData>
  >;
} & Required<Pick<ParsedSpoolData, 'maxStake' | 'staked'>> &
  CalculatedSpoolData;

/**
struct Spool has key, store {
  id: UID,
  stake_type: TypeName,
  rewards: Table<TypeName, SpoolReward>,
  rewards_list: vector<TypeName>,
  ve_sca_bind: Table<ID, ID>, // ve_sca_id -> spool_account_id
  stakes: u64,
  max_stakes: u64,
}
*/
export type OriginSpoolData = {
  id: string;
  stake_type: { fields: { name: string } };
  max_stakes: string;
  stakes: string;
  rewards: Record<SupportStakeMarketCoins, OriginSpoolRewardData>;
};

export type ParsedSpoolData = {
  spoolId: string;
  stakeType: string;
  maxStake: number;
  staked: number;
  rewards: Record<SupportStakeMarketCoins, ParsedSpoolRewardData>;
};

// struct SpoolReward has store {
//   /// points that will be distribute on every period
//   distributed_point_per_period: u64,
//   /// what is the duration before the point distribute for the next time
//   point_distribution_time: u64,
//   /// distributed reward that is already belong to users
//   distributed_point: u64,
//   /// points that can be distributed
//   points: u64,
//   base_weight: u64,
//   index: u64,
//   weighted_amount: u64,
//   last_update: u64,
// }
export type OriginSpoolRewardData = {
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
  // distributedPointPerSec: number;
  // accumulatedPoints: number;
  // currentPointIndex: number;
  // currentTotalDistributedPoint: number;
  // startDate: Date;
  // endDate: Date;
};

export type OriginStakeRewardPool = {
  claimed_rewards: string;
  exchange_rate_denominator: string;
  exchange_rate_numerator: string;
  rewards: string;
  spool_id: string;
};

export type ParsedStakeRewardPool = {
  claimedRewards: number;
  exchangeRateDenominator: number;
  exchangeRateNumerator: number;
  rewards: number;
  spoolId: string;
};

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
};

export type StakePools = OptionalKeys<
  Record<SupportStakeMarketCoins, StakePool>
>;
export type StakeRewardPools = OptionalKeys<
  Record<SupportStakeMarketCoins, StakeRewardPool>
>;
export type StakeAccounts = Record<SupportStakeMarketCoins, StakeAccount[]>;

/**
struct SpoolAccount<phantom StakeType> has key, store {
    id: UID,
    spool_id: ID,
    stake_type: TypeName,
    stakes: Balance<StakeType>,
    rewards: Table<TypeName, SpoolAccountReward>,
    rewards_list: vector<TypeName>,
    binded_ve_sca_key: Option<ID>,
  }
 */
export interface StakeAccount {
  id: string;
  type: string;
  stakePoolId: string;
  stakeType: string;
  staked: number;
  rewards: Record<string, StakeAccountReward>;
  bindedVeScaKey: string;
}

/**
 struct SpoolAccountReward has store {
    weighted_amount: u64,
    /// the current user point
    points: u64,
    /// total points that user already got from the pool
    total_points: u64,
    index: u64,
  }
 */

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

/**
 struct Spool has key, store {
  id: UID,
  stake_type: TypeName,
  rewards: Table<TypeName, SpoolReward>,
  rewards_list: vector<TypeName>,
  ve_sca_bind: Table<ID, ID>, // ve_sca_id -> spool_account_id
  stakes: u64,
  max_stakes: u64,
}
 */
export interface StakePool {
  id: string;
  type: string;
  maxStake: number;
  stakeType: string;
  totalStaked: number;
  rewards: OptionalKeys<Record<SupportStakeMarketCoins, ParsedSpoolRewardData>>;
}

/**
 struct RewardsPool<phantom RewardType> has key, store {
  id: UID,
  spool_id: ID,
  exchange_rate_numerator: u64,
  exchange_rate_denominator: u64,
  rewards: Balance<RewardType>,
  claimed_rewards: u64,
  fee_rate_numerator: u64,
  fee_rate_denominator: u64,
  fee_recipient: Option<address>,
}
 */
export interface StakeRewardPool {
  id: string;
  type: string;
  stakePoolId: string;
  ratioDenominator: number;
  ratioNumerator: number;
  rewards: number;
  claimedRewards: number;
}
