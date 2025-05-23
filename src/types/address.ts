import { _SUPPORT_ORACLES, SupportOracleType } from './constant/xOracle';

export interface AddressesInterface {
  id?: string;
  core: {
    version: string;
    versionCap: string;
    object: string;
    market: string;
    adminCap: string;
    coinDecimalsRegistry: string;
    obligationAccessStore: string;
    coins: Partial<
      Record<
        string,
        {
          id: string;
          treasury: string;
          metaData: string;
          coinType: string;
          symbol: string;
          decimals: number;
          oracle: {
            [K in SupportOracleType]: K extends (typeof _SUPPORT_ORACLES)[0]
              ? string
              : K extends (typeof _SUPPORT_ORACLES)[1]
                ? string
                : K extends (typeof _SUPPORT_ORACLES)[2]
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
      [K in SupportOracleType]: K extends (typeof _SUPPORT_ORACLES)[0]
        ? {
            registry: string;
            registryCap: string;
            holder: string;
          }
        : K extends (typeof _SUPPORT_ORACLES)[1]
          ? {
              registry: string;
              registryCap: string;
              registryTableId: string;
              state: string;
            }
          : K extends (typeof _SUPPORT_ORACLES)[2]
            ? {
                registry: string;
                registryCap: string;
                state: string;
                wormhole: string;
                wormholeState: string;
              }
            : never;
    } & {
      xOracle: string;
      xOracleCap: string;
      primaryPriceUpdatePolicyObject: string;
      secondaryPriceUpdatePolicyObject: string;
      primaryPriceUpdatePolicyVecsetId: string;
      secondaryPriceUpdatePolicyVecsetId: string;
    };
    packages: Partial<
      Record<
        string,
        {
          id: string;
          object?: string;
          upgradeCap: string;
        }
      >
    >;
  };
  spool: {
    id: string;
    adminCap: string;
    object: string;
    config: string;
    pools: Partial<
      Record<
        string,
        {
          id: string;
          rewardPoolId: string;
        }
      >
    >;
  };
  borrowIncentive: {
    id: string;
    adminCap: string;
    object: string;
    query: string;
    config: string;
    incentivePools: string;
    incentiveAccounts: string;
  };
  vesca: {
    id: string;
    object: string;
    adminCap: string;
    tableId: string;
    table: string;
    treasury: string;
    config: string;
    subsTable: string;
    subsTableId: string;
    subsWhitelist: string;
  };
  referral: {
    id: string;
    version: string;
    object: string;
    adminCap: string;
    referralBindings: string;
    bindingTableId: string;
    referralRevenuePool: string;
    revenueTableId: string;
    referralTiers: string;
    tiersTableId: string;
    authorizedWitnessList: string;
  };
  loyaltyProgram: {
    id: string;
    adminCap?: string;
    object: string;
    rewardPool: string;
    userRewardTableId: string;
  };
  veScaLoyaltyProgram: {
    id: string;
    adminCap?: string;
    object: string;
    veScaRewardPool: string;
    veScaRewardTableId: string;
  };
  scoin: {
    id: string;
    coins: Partial<
      Record<
        string,
        {
          coinType: string;
          symbol: string;
          treasury: string;
          metaData: string;
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
