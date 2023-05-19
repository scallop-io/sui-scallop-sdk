export const API_BASE_URL = 'https://sui.api.scallop.io';

export const ADDRESSES_ID = '6462a088a7ace142bb6d7e9b';

export const SUPPORT_ASSET_COINS = [
  'eth',
  'btc',
  'usdc',
  'usdt',
  'sui',
] as const;
export const SUPPORT_COLLATERAL_COINS = [
  'eth',
  'btc',
  'usdc',
  'usdt',
  'sui',
] as const;

export const SUPPORT_ORACLES = ['supra', 'switchboard', 'pyth'] as const;

export const SUPPORT_PACKAGES = [
  'coinDecimalsRegistry',
  'math',
  'whitelist',
  'x',
  'protocol',
  'query',
  'supra',
  'pyth',
  'switchboard',
  'xOracle',
  'testCoin',
] as const;

export const SUI_COIN_TYPE_ARG_REGEX = /^0x(0*)2::sui::SUI$/;
