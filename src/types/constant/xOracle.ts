import { SupportAssetCoins, SupportOracleType } from './common';

export type xOracleType = {
  primary: SupportOracleType[];
  secondary: SupportOracleType[];
};
export type xOracleCategoryType = keyof xOracleType;

export type xOracleListType = {
  [key in SupportAssetCoins]: xOracleType;
};
