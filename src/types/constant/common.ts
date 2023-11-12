import {
  SUPPORT_POOLS,
  SUPPORT_COLLATERALS,
  SUPPORT_ORACLES,
  SUPPORT_PACKAGES,
  SUPPORT_SPOOLS,
  SUPPORT_SPOOLS_REWARDS,
  SUPPORT_BORROW_INCENTIVE_POOLS,
  SUPPORT_BORROW_INCENTIVE_REWARDS,
} from '../../constants';

type ParseMarketCoins<T extends string> = `s${T}`;
type ParseCoins<T extends string> = T extends `s${infer R}` ? R : never;

export type SupportCoins =
  | SupportAssetCoins
  | SupportMarketCoins
  | SupportStakeMarketCoins;
export type SupportAssetCoins =
  | SupportPoolCoins
  | SupportCollateralCoins
  | SupportStakeRewardCoins
  | SupportBorrowIncentiveRewardCoins;
export type SupportPoolCoins = (typeof SUPPORT_POOLS)[number];
export type SupportCollateralCoins = (typeof SUPPORT_COLLATERALS)[number];
export type SupportMarketCoins =
  | ParseMarketCoins<SupportPoolCoins>
  | SupportStakeMarketCoins;
export type SupportStakeMarketCoins = (typeof SUPPORT_SPOOLS)[number];
export type SupportStakeCoins = Extract<
  SupportPoolCoins,
  ParseCoins<SupportStakeMarketCoins>
>;
export type SupportStakeRewardCoins = (typeof SUPPORT_SPOOLS_REWARDS)[number];
export type SupportBorrowIncentiveCoins =
  (typeof SUPPORT_BORROW_INCENTIVE_POOLS)[number];
export type SupportBorrowIncentiveRewardCoins =
  (typeof SUPPORT_BORROW_INCENTIVE_REWARDS)[number];

export type SupportOracleType = (typeof SUPPORT_ORACLES)[number];

export type SupportPackageType = (typeof SUPPORT_PACKAGES)[number];

export type SupportCoinDecimals = Record<SupportCoins, number>;

export type CoinWrappedType =
  | {
      from: string;
      type: string;
    }
  | undefined;
