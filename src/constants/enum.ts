import type {
  SupportCoinDecimals,
  AssetCoins,
  MarketCoins,
  StakeMarketCoins,
  StakeRewardCoins,
  BorrowIncentiveRewardCoins,
  AssetCoinIds,
  WormholeCoinIds,
  VoloCoinIds,
} from '../types';

export const coinDecimals: SupportCoinDecimals = {
  eth: 8,
  btc: 8,
  usdc: 6,
  usdt: 6,
  sui: 9,
  apt: 8,
  sol: 8,
  cetus: 9,
  afsui: 9,
  hasui: 9,
  vsui: 9,
  seth: 8,
  sbtc: 8,
  susdc: 6,
  susdt: 6,
  ssui: 9,
  sapt: 8,
  ssol: 8,
  scetus: 9,
  safsui: 9,
  shasui: 9,
  svsui: 9,
};

export const assetCoins: AssetCoins = {
  eth: 'eth',
  btc: 'btc',
  usdc: 'usdc',
  usdt: 'usdt',
  sui: 'sui',
  apt: 'apt',
  sol: 'sol',
  cetus: 'cetus',
  afsui: 'afsui',
  hasui: 'hasui',
  vsui: 'vsui',
};

export const marketCoins: MarketCoins = {
  seth: 'seth',
  sbtc: 'sbtc',
  susdc: 'susdc',
  susdt: 'susdt',
  ssui: 'ssui',
  sapt: 'sapt',
  ssol: 'ssol',
  scetus: 'scetus',
  safsui: 'safsui',
  shasui: 'shasui',
  svsui: 'svsui',
};

export const stakeMarketCoins: StakeMarketCoins = {
  seth: 'seth',
  ssui: 'ssui',
  susdc: 'susdc',
  susdt: 'susdt',
  scetus: 'scetus',
  safsui: 'safsui',
  shasui: 'shasui',
  svsui: 'svsui',
};

export const spoolRewardCoins: StakeRewardCoins = {
  seth: 'sui',
  ssui: 'sui',
  susdc: 'sui',
  susdt: 'sui',
  scetus: 'sui',
  safsui: 'sui',
  shasui: 'sui',
  svsui: 'sui',
};

export const borrowIncentiveRewardCoins: BorrowIncentiveRewardCoins = {
  sui: 'sui',
  usdc: 'sui',
  usdt: 'sui',
};

export const coinIds: AssetCoinIds = {
  sui: '0x0000000000000000000000000000000000000000000000000000000000000002',
  eth: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5',
  btc: '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881',
  usdc: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf',
  usdt: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c',
  apt: '0x3a5143bb1196e3bcdfab6203d1683ae29edd26294fc8bfeafe4aaa9d2704df37',
  sol: '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8',
  cetus: '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b',
  afsui: '0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc',
  hasui: '0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d',
  vsui: '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55',
};

export const wormholeCoinIds: WormholeCoinIds = {
  eth: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5',
  btc: '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881',
  usdc: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf',
  usdt: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c',
  apt: '0x3a5143bb1196e3bcdfab6203d1683ae29edd26294fc8bfeafe4aaa9d2704df37',
  sol: '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8',
};

export const voloCoinIds: VoloCoinIds = {
  vsui: '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55',
};
