import type { CoinPrices, OptionalKeys } from 'src/types/utils.js';
import type { AddressesInterface } from 'src/types/address.js';
import type { GrpcDataSource } from 'src/datasources/grpc.js';
import type { BaseContext, BaseRepoParams } from '../types.js';

export interface BorrowIncentiveAccountKey {
  id: string;
  onwerId: string;
}

export type BorrowIncentivePools = OptionalKeys<
  Record<string, BorrowIncentivePool>
>;

export type BorrowIncentivePoolPoints = {
  symbol: string;
  coinName: string;
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
  coinName: string;
  symbol: string;
  coinType: string;
  coinDecimal: number;
  coinPrice: number;
  stakedAmount: number;
  stakedCoin: number;
  stakedValue: number;
  points: OptionalKeys<Record<string, BorrowIncentivePoolPoints>>;
};

export type OriginBorrowIncentivePoolPointData = {
  point_type: string | { name: string };
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
  pool_type: string | { name: string };
  points: OriginBorrowIncentivePoolPointData[];
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
  poolPoints: OptionalKeys<Record<string, ParsedBorrowIncentivePoolPointData>>;
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
  Record<string, ParsedBorrowIncentiveAccountData>
>;

export type OriginBorrowIncentiveAccountPoolData = {
  point_type: string | { name: string };
  weighted_amount: string;
  points: string;
  total_points: string;
  index: string;
};

export type OriginBorrowIncentiveAccountData = {
  points_list: OriginBorrowIncentiveAccountPoolData[];
  pool_type: string | { name: string };
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
  pointList: OptionalKeys<Record<string, ParsedBorrowIncentiveAccountPoolData>>;
  poolType: string;
  debtAmount: number;
};

export interface BorrowIncentivePoolsQueryInterface {
  incentive_pools: OriginBorrowIncentivePoolData[];
}

export interface BorrowIncentiveAccountsQueryInterface {
  pool_records: OriginBorrowIncentiveAccountData[];
}

export type BorrowIncentiveAddresses<
  T extends keyof AddressesInterface['borrowIncentive'] =
    keyof AddressesInterface['borrowIncentive'],
> = {
  borrowIncentive: Pick<AddressesInterface['borrowIncentive'], T>;
};

export type BorrowIncentiveMetadata = {
  whitelist: {
    lending: ReadonlySet<string>;
  };
  addresses: BorrowIncentiveAddresses & {
    core: { object: string };
    vesca: { object: string };
  };
  parseCoinNameFromType: (coinType: string) => string;
  parseSymbol: (coinName: string) => string;
  getCoinDecimal: (coinName: string) => number | undefined;
};

export type BorrowIncentiveReadArgs = {
  coinPrices: CoinPrices;
  coinNames?: string[];
};

export type BorrowIncentiveRepoContext = BaseContext & {
  grpc: GrpcDataSource;
  metadata: BorrowIncentiveMetadata;
};

// On-chain pool/account reads: never touch the indexer (this domain has none).
export type BorrowIncentiveOnChainContext = Pick<
  BorrowIncentiveRepoContext,
  'grpc' | 'metadata' | 'fetchWithCache' | 'logger'
>;

export type GetBindedVeScaKeyContext = BaseContext & {
  grpc: GrpcDataSource;
  metadata: {
    addresses: BorrowIncentiveAddresses<'object' | 'incentiveAccounts'> & {
      core: { object: string };
    };
  };
};

export type GetBindedObligationContext = BaseContext & {
  grpc: GrpcDataSource;
  metadata: {
    addresses: BorrowIncentiveAddresses<'object' | 'incentivePools'> & {
      vesca: { object: string };
    };
  };
};

export type BorrowIncentiveRepoParams = BaseRepoParams & {
  grpc: GrpcDataSource;
  metadata: BorrowIncentiveMetadata;
};
