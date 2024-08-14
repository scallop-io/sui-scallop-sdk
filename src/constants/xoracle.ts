import { xOracleListType } from 'src/types';

export const xOracleList: xOracleListType = {
  sui: {
    primary: ['pyth'],
    secondary: ['supra'],
  },
  eth: {
    primary: ['supra'],
    secondary: ['pyth'],
  },
  usdc: {
    primary: ['supra'],
    secondary: [],
  },
  usdt: {
    primary: ['pyth'],
    secondary: ['supra'],
  }, // fill in
  afsui: {
    primary: ['pyth'],
    secondary: ['supra'],
  },
  apt: {
    primary: ['supra'],
    secondary: ['pyth'],
  },
  btc: {
    primary: ['pyth'],
    secondary: ['supra'],
  },
  cetus: {
    primary: ['pyth'],
    secondary: ['supra'],
  },
  hasui: {
    primary: ['pyth'],
    secondary: ['supra'],
  },
  sca: {
    primary: ['pyth'],
    secondary: ['supra'],
  },
  sol: {
    primary: ['pyth'],
    secondary: ['supra'],
  },
  vsui: {
    primary: ['pyth'],
    secondary: ['supra'],
  },
};
