import { ApiDataSource } from 'src/datasources/api.js';
import { BaseContext, BaseRepoParams } from '../types.js';
import { SupportedOracleType } from 'src/types/constant/xOracle.js';

export type AddressApiRepoContext = BaseContext & {
  api: ApiDataSource;
};
export type AddressApiRepoParams = BaseRepoParams & {
  api: ApiDataSource;
};

export type AddressApiFetchResponse = AddressesInterface & {
  memo: string;
  createdAt: string;
  updatedAt: string;
  version: number;
};

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
          // `custom` carries no per-coin feed metadata (the rule reads one global
          // registry), so it is optional-undefined rather than a required key.
          oracle: {
            [K in Exclude<SupportedOracleType, 'custom'>]: K extends 'supra'
              ? string
              : K extends 'switchboard'
                ? string
                : K extends 'pyth'
                  ? {
                      feed: string;
                      feedObject: string;
                    }
                  : never;
          } & {
            custom?: undefined;
          };
        }
      >
    >;
    oracles: {
      [K in SupportedOracleType]: K extends 'supra'
        ? {
            registry: string;
            registryCap: string;
            holder: string;
          }
        : K extends 'switchboard'
          ? {
              registry: string;
              registryCap: string;
              registryTableId: string;
              state: string;
            }
          : K extends 'pyth'
            ? {
                registry: string;
                registryCap: string;
                state: string;
                wormhole: string;
                wormholeState: string;
              }
            : K extends 'custom'
              ? {
                  registry: string;
                  registryCap: string;
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
    incentiveAccountsTableId: string;
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
  obligationNaming: {
    id: string;
    namingRegistry: string;
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
