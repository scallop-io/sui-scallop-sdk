const _PACKAGE_NAMES = [
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

export type PackageName = (typeof _PACKAGE_NAMES)[number];
