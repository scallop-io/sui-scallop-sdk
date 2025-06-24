import { SUPPORT_ORACLE_LST, SUPPORT_ORACLES } from 'src/constants/xoracle';
import { SupportOracleType, SupportedOracleSuiLst } from './constant/xOracle';
import { PackageName } from './constant/package';

export type BasePackage = {
  id: string;
  object?: string;
  upgradeCap?: string;
};

export type OracleLstPackage = {
  [K in SupportedOracleSuiLst]: BasePackage;
};

type OraclePackage<T> = BasePackage & T extends SupportOracleLst
  ? BasePackage & {
      lst: OracleLstPackage;
    }
  : BasePackage;

type Packages<
  T extends SupportOracleType | PackageName = SupportOracleType | PackageName,
> = T extends SupportOracleType
  ? Record<T, OraclePackage<T>>
  : T extends PackageName
    ? Record<T, BasePackage>
    : never;

export type SupportOracleLst = (typeof SUPPORT_ORACLE_LST)[number];

export type OracleLstConfig<T extends SupportedOracleSuiLst> = T extends 'afsui'
  ? Record<
      T,
      {
        stakedSuiVaultId: string;
        safeId: string;
        configId: string;
      }
    >
  : never;

export type OracleLst<
  T extends SupportOracleLst,
  U extends SupportedOracleSuiLst = SupportedOracleSuiLst,
> = T extends 'pyth' ? OracleLstConfig<U> : undefined;

type MaybeWithOracleLst<T, U> = T extends SupportOracleLst
  ? U & {
      lst: OracleLst<T>;
    }
  : U;
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
        ? MaybeWithOracleLst<
            K,
            {
              registry: string;
              registryCap: string;
              holder: string;
            }
          >
        : K extends (typeof SUPPORT_ORACLES)[1]
          ? MaybeWithOracleLst<
              K,
              {
                registry: string;
                registryCap: string;
                registryTableId: string;
                state: string;
              }
            >
          : K extends (typeof SUPPORT_ORACLES)[2]
            ? MaybeWithOracleLst<
                K,
                {
                  registry: string;
                  registryCap: string;
                  state: string;
                  wormhole: string;
                  wormholeState: string;
                }
              >
            : never;
    } & {
      xOracle: string;
      xOracleCap: string;
      primaryPriceUpdatePolicyObject: string;
      secondaryPriceUpdatePolicyObject: string;
      primaryPriceUpdatePolicyVecsetId: string;
      secondaryPriceUpdatePolicyVecsetId: string;
    };
    packages: Packages;
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

type Paths<T> = T extends object
  ? {
      [K in Extract<keyof T, string>]: T[K] extends object // if T[K] is itself an object, emit K *and* K.<deep>
        ? K | `${K}.${Paths<T[K]>}`
        : K;
    }[Extract<keyof T, string>]
  : never;

export type AddressStringPath = Paths<AddressesInterface>;
