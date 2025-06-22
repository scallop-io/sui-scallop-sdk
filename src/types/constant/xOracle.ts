export const _SUPPORT_ORACLES = ['supra', 'switchboard', 'pyth'] as const;
export type SupportOracleType = (typeof _SUPPORT_ORACLES)[number];

const _X_ORACLE_RULES = ['primary', 'secondary'] as const;
export type xOracleRuleType = (typeof _X_ORACLE_RULES)[number];

export type xOracleRules = Record<xOracleRuleType, SupportOracleType[]>;

export type xOracleListType = {
  [key in string]: xOracleRules;
};
