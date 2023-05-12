export const API_BASE_URL = 'https://sui.api.scallop.io';

export const ADDRESSES_ID = '645345e36a73c38b35dc485f';

export const SUPPORT_COINS = ['usdc', 'eth', 'btc', 'usdt', 'sui'] as const;

export const SUPPORT_ORACLES = ['supra', 'switchboard', 'pyth'] as const;

export const SUPPORT_PACKAGES = [
  'coinDecimalsRegistry',
  'math',
  'whitelist',
  'x',
  'protocol',
  'query',
  'pyth',
  'switchboard',
  'xOracle',
  'testCoin',
] as const;
