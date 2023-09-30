import {
  SUPPORT_POOLS,
  SUPPORT_COLLATERALS,
  SUPPORT_ORACLES,
  SUPPORT_PACKAGES,
} from '../../constants';

export type SupportPools = (typeof SUPPORT_POOLS)[number];
export type SupportCollaterals = (typeof SUPPORT_COLLATERALS)[number];
export type SupportCoins = SupportPools | SupportCollaterals;
export type SupportMarketCoins = `s${SupportPools}`;
export type SupportOracleType = (typeof SUPPORT_ORACLES)[number];
export type SupportPackageType = (typeof SUPPORT_PACKAGES)[number];
export type SupportCoinDecimals = Record<SupportCoins, number>;

export type CoinWrappedType =
  | {
      from: string;
      type: string;
    }
  | undefined;
