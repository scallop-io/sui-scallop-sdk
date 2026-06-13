import type { IndexerDataSource } from 'src/datasources/indexer.js';
import type { PoolAddress } from 'src/types/constant/index.js';
import type { SuiObjectData } from 'src/types/index.js';
import type { CoinPrices } from 'src/types/utils.js';
import type { BaseContext, BaseRepoArgs } from '../type.js';

export type SpoolMetadata = {
  whitelist: {
    spool: ReadonlySet<string>;
  };
  addresses: {
    spoolObjectId: string;
    spools: Record<
      string,
      {
        id: string;
        rewardPoolId: string;
      }
    >;
  };
  poolAddresses: Readonly<Record<string, PoolAddress | undefined>>;
  parseCoinName: (marketCoinName: string) => string;
  parseSymbol: (coinName: string) => string;
  parseCoinType: (coinName: string) => string;
  parseMarketCoinType: (coinName: string) => string;
  parseSCoinType: (sCoinName: string) => string | undefined;
  isMarketCoin: (coinName: string) => boolean;
  getCoinDecimal: (coinName: string) => number;
  getSpoolRewardCoinName: () => string;
};

export type SpoolRepoContext = BaseContext & {
  indexer: IndexerDataSource;
  metadata: SpoolMetadata;
};

export type SpoolRepoArgs = BaseRepoArgs & {
  indexer: IndexerDataSource;
  metadata: SpoolMetadata;
};

/** Minimal context for indexer-sourced spool reads (no on-chain client). */
export type SpoolIndexerContext = Pick<
  SpoolRepoContext,
  'indexer' | 'fetchWithCache' | 'metadata'
>;

/** Minimal context for on-chain spool reads (no indexer). */
export type SpoolOnChainContext = Pick<
  SpoolRepoContext,
  'onchain' | 'fetchWithCache' | 'metadata'
>;

export type SpoolReadArgs = {
  coinPrices?: CoinPrices;
  stakeCoinNames?: readonly string[];
};

export type RequiredSpoolObjects = Record<
  string,
  {
    spool?: SuiObjectData;
    spoolReward?: SuiObjectData;
  }
>;

type OptionalKeys<T> = {
  [K in keyof T]?: T[K];
};

export type Spools = OptionalKeys<Record<string, Spool>>;

export type Spool = {
  marketCoinName: string;
  symbol: string;
  coinType: string;
  marketCoinType: string;
  rewardCoinType: string;
  sCoinType: string;
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
  stakeType: string;
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

export type SpoolData = {
  created_at: string;
  distributed_point: string;
  distributed_point_per_period: string;
  id: {
    id: string;
  };
  index: string;
  last_update: string;
  max_distributed_point: string;
  max_stakes: string;
  point_distribution_time: string;
  stake_type: string;
  stakes: string;
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

export type StakePools = OptionalKeys<Record<string, StakePool>>;
export type StakeRewardPools = OptionalKeys<Record<string, StakeRewardPool>>;
export type StakeAccounts = Record<string, StakeAccount[]>;

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
