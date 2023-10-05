export const API_BASE_URL = 'https://sui.api.scallop.io';

export const ADDRESSES_ID = '6462a088a7ace142bb6d7e9b';

export const PROTOCOL_OBJECT_ID =
  '0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf';

export const SUPPORT_POOLS = [
  'eth',
  'btc',
  'usdc',
  'usdt',
  'sui',
  'apt',
  'sol',
  'cetus',
] as const;

export const SUPPORT_COLLATERALS = [
  'eth',
  'btc',
  'usdc',
  'usdt',
  'sui',
  'apt',
  'sol',
  'cetus',
] as const;

export const SUPPORT_SPOOLS = ['ssui', 'susdc', 'susdt'] as const;

export const SUPPORT_REWARD_POOLS = ['sui'] as const;

export const SUPPORT_ORACLES = ['supra', 'switchboard', 'pyth'] as const;

export const SUPPORT_PACKAGES = [
  'coinDecimalsRegistry',
  'math',
  'whitelist',
  'x',
  'protocol',
  'protocolWhitelist',
  'query',
  'supra',
  'pyth',
  'switchboard',
  'xOracle',
  'testCoin',
] as const;
