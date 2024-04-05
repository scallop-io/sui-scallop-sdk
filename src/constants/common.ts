export const API_BASE_URL = 'https://sui.api.scallop.io';
export const SDK_API_BASE_URL = 'https://sdk.api.scallop.io';

export const IS_VE_SCA_TEST = true;

export const ADDRESSES_ID = IS_VE_SCA_TEST
  ? ('65fb07c39c845425d71d7b18' as const)
  : ('6601955b8b0024600a917079' as const);
// : ('6462a088a7ace142bb6d7e9b' as const);

export const PROTOCOL_OBJECT_ID = IS_VE_SCA_TEST
  ? ('0xc9f859f98ca352a11b97a038c4b4162bee437b8df8caa047990fe9cb03d4f778' as const)
  : ('0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf' as const);

export const BORROW_FEE_PROTOCOL_ID = IS_VE_SCA_TEST
  ? ('0xc9f859f98ca352a11b97a038c4b4162bee437b8df8caa047990fe9cb03d4f778' as const)
  : ('0xc38f849e81cfe46d4e4320f508ea7dda42934a329d5a6571bb4c3cb6ea63f5da' as const); // test environment

export const SCA_COIN_TYPE = IS_VE_SCA_TEST
  ? (`0x6cd813061a3adf3602b76545f076205f0c8e7ec1d3b1eab9a1da7992c18c0524::sca::SCA` as const)
  : ('0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA' as const);

export const OLD_BORROW_INCENTIVE_PROTOCOL_ID =
  '0xc63072e7f5f4983a2efaf5bdba1480d5e7d74d57948e1c7cc436f8e22cbeb410' as const;

export const OLD_SPOOL_ID =
  '0xec1ac7f4d01c5bf178ff4e62e523e7df7721453d81d4904a42a0ffc2686c843d' as const;

export const OLD_SPOOL_OBJECT =
  '0xe87f1b2d498106a2c61421cec75b7b5c5e348512b0dc263949a0e7a3c256571a' as const;

export const DAPP_DUMP_ADDRESS =
  '0x382828a47d5ad1eb7c5d52dee8ee2a60a4ef98b15af30916140e825ed043b54a' as const;

export const OLD_SPOOL_POOLS = {
  seth: {
    id: '0xeec40beccb07c575bebd842eeaabb835f77cd3dab73add433477e57f583a6787',
    rewardPoolId:
      '0x957de68a18d87817de8309b30c1ec269a4d87ae513abbeed86b5619cb9ce1077',
  },
  ssui: {
    id: '0x4f0ba970d3c11db05c8f40c64a15b6a33322db3702d634ced6536960ab6f3ee4',
    rewardPoolId:
      '0x162250ef72393a4ad3d46294c4e1bdfcb03f04c869d390e7efbfc995353a7ee9',
  },
  susdc: {
    id: '0x4ace6648ddc64e646ba47a957c562c32c9599b3bba8f5ac1aadb2ae23a2f8ca0',
    rewardPoolId:
      '0xf4268cc9b9413b9bfe09e8966b8de650494c9e5784bf0930759cfef4904daff8',
  },
  susdt: {
    id: '0xcb328f7ffa7f9342ed85af3fdb2f22919e1a06dfb2f713c04c73543870d7548f',
    rewardPoolId:
      '0x2c9f934d67a5baa586ceec2cc24163a2f049a6af3d5ba36b84d8ac40f25c4080',
  },
  scetus: {
    id: '0xac1bb13bf4472a637c18c2415fb0e3c1227ea2bcf35242e50563c98215bd298e',
    rewardPoolId:
      '0x6835c1224126a45086fc6406adc249e3f30df18d779ca4f4e570e38716a17f3f',
  },
  safsui: {
    id: '0xeedf438abcaa6ce4d9625ffca110920592d5867e4c5637d84ad9f466c4feb800',
    rewardPoolId:
      '0x89255a2f86ed7fbfef35ab8b7be48cc7667015975be2685dd9a55a9a64baf76e',
  },
  shasui: {
    id: '0xa6148bc1b623e936d39a952ceb5bea79e8b37228a8f595067bf1852efd3c34aa',
    rewardPoolId:
      '0x6f3563644d3e2ef13176dbf9d865bd93479df60ccbe07b7e66db57f6309f5a66',
  },
  svsui: {
    id: '0x69ce8e537e750a95381e6040794afa5ab1758353a1a2e1de7760391b01f91670',
    rewardPoolId:
      '0xbca914adce058ad0902c7f3cfcd698392a475f00dcfdc3f76001d0370b98777a',
  },
};

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
  'seth',
  'ssui',
  'susdc',
  'susdt',
  'scetus',
  'safsui',
  'shasui',
  'svsui',
] as const;

export const SUPPORT_SPOOLS_REWARDS = ['sui', 'sca'] as const;

export const SUPPORT_BORROW_INCENTIVE_POOLS = ['sui', 'usdc', 'usdt'] as const;

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
