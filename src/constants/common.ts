export const API_BASE_URL = 'https://sui.apis.scallop.io' as const;
export const SDK_API_BASE_URL = 'https://sdk.api.scallop.io' as const;

export const IS_VE_SCA_TEST: boolean = false;
export const USE_TEST_ADDRESS: boolean = false;

// export const ADDRESS_ID =
//   IS_VE_SCA_TEST || USE_TEST_ADDRESS
//     ? ('65fb07c39c845425d71d7b18' as const)
//     : ('67c44a103fe1b8c454eb9699' as const);
// : ('66f8e7ed9bb9e07fdfb86bbb' as const);

export const SCA_COIN_TYPE = IS_VE_SCA_TEST
  ? (`0x6cd813061a3adf3602b76545f076205f0c8e7ec1d3b1eab9a1da7992c18c0524::sca::SCA` as const)
  : ('0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA' as const);

export const OLD_BORROW_INCENTIVE_PROTOCOL_ID =
  '0xc63072e7f5f4983a2efaf5bdba1480d5e7d74d57948e1c7cc436f8e22cbeb410' as const;

// export const SUPPORT_POOLS = [
//   'usdc', // native USDC
//   'sbeth', // sui bridge ETH
//   'sbusdt', // sui bridge USDT
//   'sbwbtc', // sui bridge WBTC
//   'weth',
//   'wbtc',
//   'wusdc',
//   'wusdt',
//   'sui',
//   'wapt',
//   'wsol',
//   'cetus',
//   'afsui',
//   'hasui',
//   'vsui',
//   'sca',
//   'fud',
//   'deep',
//   'fdusd',
//   'blub',
//   'musd',
//   'ns',
//   'usdy',
// ] as const;

// export const SUPPORT_COLLATERALS = [
//   'usdc', // native USDC
//   'sbeth', // sui bridge ETH
//   'sbusdt', // sui bridge USDT
//   'sbwbtc', // sui bridge WBTC
//   'weth',
//   'wbtc',
//   'wusdc',
//   'wusdt',
//   'sui',
//   'wapt',
//   'wsol',
//   'cetus',
//   'afsui',
//   'hasui',
//   'vsui',
//   'sca',
//   'fdusd',
//   'usdy',
// ] as const;

// export const SUPPORT_SPOOLS = [
//   'susdc',
//   'sweth',
//   'ssui',
//   'swusdc',
//   'swusdt',
//   'scetus',
//   'safsui',
//   'shasui',
//   'svsui',
// ] as const;

// export const SUPPORT_SCOIN = [
//   'susdc',
//   'ssbeth',
//   'ssbusdt',
//   'ssbwbtc',
//   'ssui',
//   'swusdc',
//   'swusdt',
//   'safsui',
//   'shasui',
//   'svsui',
//   'sweth',
//   'ssca',
//   'scetus',
//   'swsol',
//   'swbtc',
//   'sdeep',
//   'sfud',
//   'sfdusd',
//   'sblub',
//   'smusd',
//   'sns',
//   'susdy',
// ] as const;

// export const SUPPORT_SUI_BRIDGE = ['sbeth', 'sbusdt', 'sbwbtc'] as const;
// export const SUPPORT_WORMHOLE = [
//   'wusdc',
//   'wusdt',
//   'weth',
//   'wbtc',
//   'wapt',
//   'wsol',
// ] as const;

// export const SUPPORT_SPOOLS_REWARDS = ['sui'] as const;

// export const SUPPORT_BORROW_INCENTIVE_POOLS = [...SUPPORT_POOLS] as const;

// export const SUPPORT_BORROW_INCENTIVE_REWARDS = [
//   ...SUPPORT_POOLS,
//   ...SUPPORT_SCOIN,
// ] as const;
// export const SUPPORT_ORACLES = ['supra', 'switchboard', 'pyth'] as const;

// export const SUPPORT_PACKAGES = [
//   'coinDecimalsRegistry',
//   'math',
//   'whitelist',
//   'x',
//   'protocol',
//   'protocolWhitelist',
//   'query',
//   'supra',
//   'pyth',
//   'switchboard',
//   'xOracle',
//   'testCoin',
// ] as const;
