import {
  SUPPORT_ASSET_COINS,
  SUPPORT_COLLATERAL_COINS,
  SUPPORT_ORACLES,
  SUPPORT_PACKAGES,
} from '../constants/common';

export type SupportAssetCoinType = (typeof SUPPORT_ASSET_COINS)[number];
export type SupportCollateralCoinType =
  (typeof SUPPORT_COLLATERAL_COINS)[number];
export type SupportCoinType = SupportAssetCoinType | SupportCollateralCoinType;
export type SupportOracleType = (typeof SUPPORT_ORACLES)[number];
export type SupportPackageType = (typeof SUPPORT_PACKAGES)[number];

export interface MarketInterface {
  collaterals: {
    collateralFactor: {
      value: string;
    };
    liquidationDiscount: {
      value: string;
    };
    liquidationFactor: {
      value: string;
    };
    liquidationPanelty: {
      value: string;
    };
    liquidationReserveFactor: {
      value: string;
    };
    maxCollateralAmount: string;
    totalCollateralAmount: string;
    type: {
      name: string;
    };
  }[];
  pools: {
    baseBorrowRatePerSec: {
      value: string;
    };
    borrowIndex: string;
    cash: string;
    debt: string;
    highSlope: {
      value: string;
    };
    interestRate: {
      value: string;
    };
    kink: {
      value: string;
    };
    lastUpdated: string;
    lowSlope: {
      value: string;
    };
    marketCoinSupply: string;
    minBorrowAmount: string;
    reserve: string;
    reserveFactor: {
      value: string;
    };
    borrowWeight: {
      value: string;
    };
    type: {
      name: string;
    };
  }[];
}

export interface ObligationInterface {
  collaterals: {
    type: {
      name: string;
    };
    amount: string;
  }[];
  debts: {
    type: {
      name: string;
    };
    amount: string;
    borrowIndex: string;
  }[];
}

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
