export const SUPPORTED_ORACLES = [
  'supra',
  'switchboard',
  'pyth',
  'custom',
] as const;
export type SupportedOracleType = (typeof SUPPORTED_ORACLES)[number];

/** @deprecated Renamed to {@link SupportedOracleType}. Kept for back-compat; removed in the next major. */
export type SupportOracleType = SupportedOracleType;

export type xOracleRules = {
  primary: SupportedOracleType[];
  secondary: SupportedOracleType[];
};
export type xOracleRuleType = keyof xOracleRules;

export type xOracleListType = {
  [key in string]: xOracleRules;
};
