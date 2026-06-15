import { BaseContext, BaseRepoArgs } from '../types.js';
import { SUPPORTED_ORACLES } from './const.js';

export type SupportedOracle = (typeof SUPPORTED_ORACLES)[number];

type SupportedOracleAddresses = Record<SupportedOracle, { object: string }>;
type XOracleAddresses = {
  /** `core.packages.xOracle.object` — used to build the policy-rules key type. */
  xOracleObject: string;
  oracles: {
    primaryPriceUpdatePolicyVecsetId: string;
    secondaryPriceUpdatePolicyVecsetId: string;
    primaryPriceUpdatePolicyObject: string;
    secondaryPriceUpdatePolicyObject: string;
    switchboardRegistryTableId: string;
  };
};

export type XOracleMetadata = {
  addresses: SupportedOracleAddresses & XOracleAddresses;
  whitelist: {
    lending: ReadonlySet<string>;
  };
  parseCoinNameFromType: (type: string) => string;
  parseCoinType: (coinName: string) => string;
  /** Pre-registered switchboard aggregator id for a coin, if the address API
   *  carries one (`core.coins.<coin>.oracle.switchboard`). */
  getSwitchboardAggAddress: (coinName: string) => string | undefined;
};

export type XOracleRepoContext = BaseContext & {
  metadata: XOracleMetadata;
};

export type XOracleRepoArgs = BaseRepoArgs & {
  metadata: XOracleMetadata;
};
