export const API_BASE_URL = 'https://sui.api.scallop.io';
export const SDK_API_BASE_URL = 'https://sdk.api.scallop.io';

export const IS_VE_SCA_TEST = true;

// export const ADDRESSES_ID = '';
export const ADDRESSES_ID = IS_VE_SCA_TEST
  ? // ? ('65fb07c39c845425d71d7b18' as const)
    ('65fb07c39c845425d71d7b18' as const)
  : ('664dfe22898c36c159e28bc8' as const);
// : ('6601955b8b0024600a917079' as const);
// : ('6462a088a7ace142bb6d7e9b' as const);

export const PROTOCOL_OBJECT_ID = IS_VE_SCA_TEST
  ? ('0xc9f859f98ca352a11b97a038c4b4162bee437b8df8caa047990fe9cb03d4f778' as const)
  : ('0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf' as const);
// export const PROTOCOL_OBJECT_ID =
//   '0x87ddec2984645dbbe2403a509cc6edf393a43acdba9b77d45da2bcbefcf733c1' as const;

export const BORROW_FEE_PROTOCOL_ID = IS_VE_SCA_TEST
  ? ('0xc9f859f98ca352a11b97a038c4b4162bee437b8df8caa047990fe9cb03d4f778' as const) // test environment
  : ('0xc38f849e81cfe46d4e4320f508ea7dda42934a329d5a6571bb4c3cb6ea63f5da' as const);
// export const BORROW_FEE_PROTOCOL_ID =
//   '0x87ddec2984645dbbe2403a509cc6edf393a43acdba9b77d45da2bcbefcf733c1' as const;

export const SCA_COIN_TYPE = IS_VE_SCA_TEST
  ? (`0x6cd813061a3adf3602b76545f076205f0c8e7ec1d3b1eab9a1da7992c18c0524::sca::SCA` as const)
  : ('0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA' as const);

export const OLD_BORROW_INCENTIVE_PROTOCOL_ID =
  '0xc63072e7f5f4983a2efaf5bdba1480d5e7d74d57948e1c7cc436f8e22cbeb410' as const;

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
  'sca',
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
  'sca',
] as const;

export const SUPPORT_SPOOLS = [
  'seth',
  'ssui',
  'susdc',
  'susdt',
  'scetus',
  'safsui',
  'shasui',
  'svsui',
] as const;

export const SUPPORT_SPOOLS_REWARDS = ['sui'] as const;

export const SUPPORT_BORROW_INCENTIVE_POOLS = [
  'sui',
  'usdc',
  'usdt',
  'afsui',
  'hasui',
  'vsui',
  'eth',
  'sca',
] as const;

export const SUPPORT_BORROW_INCENTIVE_REWARDS = ['sui', 'sca'] as const;
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
