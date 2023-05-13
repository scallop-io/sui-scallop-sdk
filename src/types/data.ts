import {
  SUPPORT_COINS,
  SUPPORT_ORACLES,
  SUPPORT_PACKAGES,
} from '../constants/common';

export type SupportCoinType = (typeof SUPPORT_COINS)[number];
export type SupportOracleType = (typeof SUPPORT_ORACLES)[number];
export type SupportPackageType = (typeof SUPPORT_PACKAGES)[number];

export interface AddressesInterface {
  core: {
    market: string;
    adminCap: string;
    coinDecimalsRegistry: string;
    coins: Partial<
      Record<
        SupportCoinType,
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
        ? {}
        : K extends (typeof SUPPORT_ORACLES)[1]
        ? {
            registry: string;
            registryCap: string;
          }
        : K extends (typeof SUPPORT_ORACLES)[2]
        ? {
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

export type TestnetAddressStringPath = Join<
  AddressPathsProps<AddressesInterface>,
  '.'
>;
