import {
  SUPPORT_POOLS,
  SUPPORT_COLLATERALS,
  SUPPORT_ORACLES,
  SUPPORT_PACKAGES,
} from '../../constants';
import type { SupportStakeMarketCoins } from './spool';

export type SupportPoolCoins = (typeof SUPPORT_POOLS)[number];
export type SupportCollateralCoins = (typeof SUPPORT_COLLATERALS)[number];
export type SupportCoins = SupportPoolCoins | SupportCollateralCoins;
export type SupportMarketCoins = ParseMarketCoins<SupportPoolCoins>;
export type SupportOracleType = (typeof SUPPORT_ORACLES)[number];
export type SupportPackageType = (typeof SUPPORT_PACKAGES)[number];
export type SupportCoinDecimals = Record<SupportCoins, number>;
export type SupportStakeCoins = Extract<
  SupportPoolCoins,
  ParseCoins<SupportStakeMarketCoins>
>;

type ParseMarketCoins<T extends string> = `s${T}`;
type ParseCoins<T extends string> = T extends `s${infer R}` ? R : never;

export type CoinWrappedType =
  | {
      from: string;
      type: string;
    }
  | undefined;
