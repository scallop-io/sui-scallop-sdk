export type xOracleRules = {
  primary: string[];
  secondary: string[];
};
export type xOracleRuleType = keyof xOracleRules;

export type xOracleListType = {
  [key in string]: xOracleRules;
};
