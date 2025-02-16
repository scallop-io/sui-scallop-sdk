import { SupportAssetCoins, SupportOracleType } from './common';

export type xOracleRules = {
  primary: SupportOracleType[];
  secondary: SupportOracleType[];
};
export type xOracleRuleType = keyof xOracleRules;

export type xOracleListType = {
  [key in SupportAssetCoins]: xOracleRules;
};
