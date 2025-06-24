import {
  SUPPORT_ORACLES,
  X_ORACLE_RULES,
  SUPPORT_SUI_LST,
} from 'src/constants/xoracle';

export type SupportOracleType = (typeof SUPPORT_ORACLES)[number];
export type xOracleRuleType = (typeof X_ORACLE_RULES)[number];

export type xOracleRules = Record<xOracleRuleType, SupportOracleType[]>;

export type xOracleListType = {
  [key in string]: xOracleRules;
};
export type SupportedOracleSuiLst = (typeof SUPPORT_SUI_LST)[number];
