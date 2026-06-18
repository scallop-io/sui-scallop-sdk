import { BaseContext, BaseRepoParams } from '../types.js';
import { OnChainDataSource } from 'src/datasources/onchain.js';
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
  onchain: OnChainDataSource;
  metadata: XOracleMetadata;
};

export type XOracleRepoParams = BaseRepoParams & {
  onchain: OnChainDataSource;
  metadata: XOracleMetadata;
};

/**
 * Reads update-policy rule VecSets per coin: paginated on-chain dynamic-field
 * scan + coin-name parsing. Needs the oracle rule package addresses.
 */
export type XOracleUpdatePolicyRulesContext = Pick<
  XOracleRepoContext,
  'onchain' | 'fetchWithCache' | 'logger'
> & {
  metadata: Pick<XOracleMetadata, 'addresses' | 'parseCoinNameFromType'>;
};

/**
 * Assembles primary/secondary asset oracles across the lending whitelist.
 * Reads the rule VecSet ids + lending whitelist; delegates per-vecset scans to
 * `queryUpdatePolicyRules` (hence the rule-scan slice on top).
 */
export type XOracleAssetOraclesContext = XOracleUpdatePolicyRulesContext & {
  metadata: Pick<
    XOracleMetadata,
    'addresses' | 'parseCoinNameFromType' | 'whitelist'
  >;
};

/**
 * Reads the price-update-policy dynamic fields. Needs only the policy object
 * ids from `addresses`; the dynamic-field reads go through
 * `getDynamicFieldOrNull` (hence the `onchain`/`fetchWithCache` slice).
 */
export type XOraclePriceUpdatePolicyContext = Pick<
  XOracleRepoContext,
  'onchain' | 'fetchWithCache'
> & {
  metadata: Pick<XOracleMetadata, 'addresses'>;
};

/**
 * Resolves switchboard on-demand aggregator ids for coins. Needs the registry
 * table id + coin-type/aggregator parse helpers, plus the on-chain reads for
 * the registry scan / dynamic-field lookups.
 */
export type XOracleOnDemandAggContext = Pick<
  XOracleRepoContext,
  'onchain' | 'fetchWithCache' | 'logger'
> & {
  metadata: Pick<
    XOracleMetadata,
    'addresses' | 'parseCoinType' | 'getSwitchboardAggAddress'
  >;
};

/** Paginated scan of the switchboard registry table. On-chain reads only. */
export type XOracleSwitchboardRegistryContext = Pick<
  XOracleRepoContext,
  'onchain' | 'fetchWithCache'
>;
