import { SUPPORT_ORACLES } from '../constants';
import type {
  SupportAssetCoins,
  SupportOracleType,
  SupportPackageType,
  SupportStakeMarketCoins,
} from './constant';

export interface AddressesInterface {
  core: {
    version: string;
    versionCap: string;
    market: string;
    adminCap: string;
    coinDecimalsRegistry: string;
    coins: Partial<
      Record<
        SupportAssetCoins,
        {
          id: string;
          treasury: string;
          metaData: string;
          oracle: {
            [K in SupportOracleType]: K extends (typeof SUPPORT_ORACLES)[0]
              ? string
              : K extends (typeof SUPPORT_ORACLES)[1]
              ? string
              : K extends (typeof SUPPORT_ORACLES)[2]
              ? {
                  feed: string;
                  feedObject: string;
                }
              : never;
          };
        }
      >
    >;
    oracles: {
      [K in SupportOracleType]: K extends (typeof SUPPORT_ORACLES)[0]
        ? {
            registry: string;
            registryCap: string;
            holder: string;
          }
        : K extends (typeof SUPPORT_ORACLES)[1]
        ? {
            registry: string;
            registryCap: string;
          }
        : K extends (typeof SUPPORT_ORACLES)[2]
        ? {
            registry: string;
            registryCap: string;
            state: string;
            wormhole: string;
            wormholeState: string;
          }
        : never;
    } & { xOracle: string; xOracleCap: string };
    packages: Partial<
      Record<
        SupportPackageType,
        {
          id: string;
          upgradeCap: string;
        }
      >
    >;
  };
  spool: {
    id: string;
    adminCap: string;
    pools: Partial<
      Record<
        SupportStakeMarketCoins,
        {
          id: string;
          rewardPoolId: string;
        }
      >
    >;
  };
}

type AddressPathsProps<T> = T extends string
  ? []
  : {
      [K in Extract<keyof T, string>]: [K, ...AddressPathsProps<T[K]>];
    }[Extract<keyof T, string>];

type Join<T extends string[], D extends string> = T extends []
  ? never
  : T extends [infer F]
  ? F
  : T extends [infer F, ...infer R]
  ? F extends string
    ? `${F}${D}${Join<Extract<R, string[]>, D>}`
    : never
  : string;

export type AddressStringPath = Join<
  AddressPathsProps<AddressesInterface>,
  '.'
>;
