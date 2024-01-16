export const API_BASE_URL = 'https://sui.api.scallop.io';
export const SDK_API_BASE_URL = 'https://sdk.api.scallop.io';

export const ADDRESSES_ID = '6462a088a7ace142bb6d7e9b';

export const PROTOCOL_OBJECT_ID =
  '0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf';

export const BORROW_FEE_PROTOCOL_ID =
  '0xc38f849e81cfe46d4e4320f508ea7dda42934a329d5a6571bb4c3cb6ea63f5da';

export const SUPPORT_POOLS = [
  'eth',
  'btc',
  'usdc',
  'usdt',
  'sui',
  'apt',
  'sol',
  'cetus',
  'afsui',
  'hasui',
  'vsui',
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
  'afsui',
  'hasui',
  'vsui',
] as const;

export const SUPPORT_SPOOLS = [
  'ssui',
  'susdc',
  'susdt',
  'shasui',
  'svsui',
  'safsui',
] as const;

export const SUPPORT_SPOOLS_REWARDS = ['sui'] as const;

export const SUPPORT_BORROW_INCENTIVE_POOLS = ['sui', 'usdc', 'usdt'] as const;

export const SUPPORT_BORROW_INCENTIVE_REWARDS = ['sui'] as const;
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
