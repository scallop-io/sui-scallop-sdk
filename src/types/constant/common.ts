import {
  SUPPORT_POOLS,
  SUPPORT_COLLATERALS,
  SUPPORT_ORACLES,
  SUPPORT_PACKAGES,
  SUPPORT_SPOOLS,
  SUPPORT_SPOOLS_REWARDS,
  SUPPORT_BORROW_INCENTIVE_POOLS,
  SUPPORT_BORROW_INCENTIVE_REWARDS,
  SUPPORT_SCOIN,
  SUPPORT_SUI_BRIDGE,
  SUPPORT_WORMHOLE,
} from '../../constants';

type ParseMarketCoins<T extends string> = `s${T}`;
type ParseCoins<T extends string> = T extends `s${infer R}` ? R : never;

export type SupportCoins =
  | SupportAssetCoins
  | SupportMarketCoins
  | SupportStakeMarketCoins
  | SupportSCoin;
export type SupportAssetCoins =
  | SupportPoolCoins
  | SupportCollateralCoins
  | SupportStakeRewardCoins;
export type SupportPoolCoins = (typeof SUPPORT_POOLS)[number];
export type SupportCollateralCoins = (typeof SUPPORT_COLLATERALS)[number];
export type SupportMarketCoins =
  | ParseMarketCoins<SupportPoolCoins>
  | SupportStakeMarketCoins;
export type SupportStakeMarketCoins = (typeof SUPPORT_SPOOLS)[number];
export type SupportSuiBridgeCoins = (typeof SUPPORT_SUI_BRIDGE)[number];
export type SupportWormholeCoins = (typeof SUPPORT_WORMHOLE)[number];
export type SupportStakeCoins = Extract<
  SupportPoolCoins,
  ParseCoins<SupportStakeMarketCoins>
>;
export type SupportStakeRewardCoins = (typeof SUPPORT_SPOOLS_REWARDS)[number];
export type SupportBorrowIncentiveCoins =
  (typeof SUPPORT_BORROW_INCENTIVE_POOLS)[number];
export type SupportBorrowIncentiveRewardCoins =
  (typeof SUPPORT_BORROW_INCENTIVE_REWARDS)[number];
export type SupportSCoin = (typeof SUPPORT_SCOIN)[number];

export type SupportOracleType = (typeof SUPPORT_ORACLES)[number];

export type SupportPackageType = (typeof SUPPORT_PACKAGES)[number];

export type SupportCoinDecimals = Record<SupportCoins, number>;

export type CoinWrappedType =
  | {
      from: string;
      type: string;
    }
  | undefined;
