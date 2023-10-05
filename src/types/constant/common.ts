import {
  SUPPORT_POOLS,
  SUPPORT_COLLATERALS,
  SUPPORT_ORACLES,
  SUPPORT_PACKAGES,
  SUPPORT_SPOOLS,
  SUPPORT_REWARD_POOLS,
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
  | SupportRewardCoins;
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
export type SupportRewardCoins = (typeof SUPPORT_REWARD_POOLS)[number];

export type SupportOracleType = (typeof SUPPORT_ORACLES)[number];

export type SupportPackageType = (typeof SUPPORT_PACKAGES)[number];

export type SupportCoinDecimals = Record<SupportCoins, number>;

export type CoinWrappedType =
  | {
      from: string;
      type: string;
    }
  | undefined;
