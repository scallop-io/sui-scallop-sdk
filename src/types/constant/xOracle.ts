export const _SUPPORT_ORACLES = ['supra', 'switchboard', 'pyth'] as const;
export type SupportOracleType = (typeof _SUPPORT_ORACLES)[number];

export type xOracleRules = {
  primary: SupportOracleType[];
  secondary: SupportOracleType[];
};
export type xOracleRuleType = keyof xOracleRules;

export type xOracleListType = {
  [key in string]: xOracleRules;
};
