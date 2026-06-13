import { BaseContext, BaseRepoArgs } from '../type.js';
import { SUPPORTED_ORACLES } from './const.js';

export type SupportedOracle = (typeof SUPPORTED_ORACLES)[number];

type SupportedOracleAddresses = Record<SupportedOracle, { object: string }>;
type XOracleAddresses = {
  oracles: {
    primaryPriceUpdatePolicyVecsetId: string;
    secondaryPriceUpdatePolicyVecsetId: string;
  };
};

export type XOracleMetadata = {
  addresses: SupportedOracleAddresses & XOracleAddresses;
  whitelist: {
    lending: ReadonlySet<string>;
  };
  parseCoinNameFromType: (type: string) => string;
};

export type XOracleRepoContext = BaseContext & {
  metadata: XOracleMetadata;
};

export type XOracleRepoArgs = BaseRepoArgs & {
  metadata: XOracleMetadata;
};
