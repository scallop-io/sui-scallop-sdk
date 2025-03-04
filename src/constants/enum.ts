import type * as types from '../types';
import { IS_VE_SCA_TEST } from './common';

export const coinDecimals: types.SupportCoinDecimals = {
  usdc: 6,
  sbeth: 8,
  sbusdt: 6,
  sbwbtc: 8,
  weth: 8,
  wbtc: 8,
  wusdc: 6,
  wusdt: 6,
  sui: 9,
  wapt: 8,
  wsol: 8,
  cetus: 9,
  afsui: 9,
  hasui: 9,
  vsui: 9,
  sca: 9,
  fdusd: 6,
  deep: 6,
  fud: 5,
  blub: 2,
  musd: 9,
  ns: 6,
  usdy: 6,
  susdc: 6,
  sweth: 8,
  ssbeth: 8,
  ssbusdt: 6,
  ssbwbtc: 8,
  swbtc: 8,
  swusdc: 6,
  swusdt: 6,
  ssui: 9,
  swapt: 8,
  swsol: 8,
  scetus: 9,
  safsui: 9,
  shasui: 9,
  svsui: 9,
  ssca: 9,
  sfdusd: 6,
  sdeep: 6,
  sfud: 5,
  sblub: 2,
  smusd: 9,
  sns: 6,
  susdy: 6,
};

export const assetCoins: types.AssetCoins = {
  usdc: 'usdc',
  sbeth: 'sbeth',
  sbusdt: 'sbusdt',
  sbwbtc: 'sbwbtc',
  weth: 'weth',
  wbtc: 'wbtc',
  wusdc: 'wusdc',
  wusdt: 'wusdt',
  sui: 'sui',
  wapt: 'wapt',
  wsol: 'wsol',
  cetus: 'cetus',
  afsui: 'afsui',
  hasui: 'hasui',
  vsui: 'vsui',
  sca: 'sca',
  fdusd: 'fdusd',
  deep: 'deep',
  fud: 'fud',
  blub: 'blub',
  musd: 'musd',
  ns: 'ns',
  usdy: 'usdy',
};

export const marketCoins: types.MarketCoins = {
  susdc: 'susdc',
  ssbeth: 'ssbeth',
  ssbusdt: 'ssbusdt',
  ssbwbtc: 'ssbwbtc',
  sweth: 'sweth',
  swbtc: 'swbtc',
  swusdc: 'swusdc',
  swusdt: 'swusdt',
  ssui: 'ssui',
  swapt: 'swapt',
  swsol: 'swsol',
  scetus: 'scetus',
  safsui: 'safsui',
  shasui: 'shasui',
  svsui: 'svsui',
  ssca: 'ssca',
  sfdusd: 'sfdusd',
  sdeep: 'sdeep',
  sfud: 'sfud',
  sblub: 'sblub',
  smusd: 'smusd',
  sns: 'sns',
  susdy: 'susdy',
};

export const sCoins: types.SCoins = {
  susdc: 'susdc',
  ssbeth: 'ssbeth',
  ssbusdt: 'ssbusdt',
  sweth: 'sweth',
  swusdc: 'swusdc',
  swusdt: 'swusdt',
  ssbwbtc: 'ssbwbtc',
  ssui: 'ssui',
  scetus: 'scetus',
  safsui: 'safsui',
  shasui: 'shasui',
  svsui: 'svsui',
  ssca: 'ssca',
  swsol: 'swsol',
  swbtc: 'swbtc',
  sfdusd: 'sfdusd',
  sfud: 'sfud',
  sdeep: 'sdeep',
  sblub: 'sblub',
  smusd: 'smusd',
  sns: 'sns',
  susdy: 'susdy',
};

export const stakeMarketCoins: types.StakeMarketCoins = {
  susdc: 'susdc',
  sweth: 'sweth',
  ssui: 'ssui',
  swusdc: 'swusdc',
  swusdt: 'swusdt',
  scetus: 'scetus',
  safsui: 'safsui',
  shasui: 'shasui',
  svsui: 'svsui',
};

export const spoolRewardCoins: types.StakeRewardCoins = {
  sweth: 'sui',
  ssui: 'sui',
  swusdc: 'sui',
  swusdt: 'sui',
  scetus: 'sui',
  safsui: 'sui',
  shasui: 'sui',
  svsui: 'sui',
  susdc: 'sui',
};

export const suiBridgeCoins: types.SuiBridgeCoins = {
  sbeth: 'sbeth',
  sbusdt: 'sbusdt',
  sbwbtc: 'sbwbtc',
};

export const coinIds: types.AssetCoinIds = {
  sui: '0x0000000000000000000000000000000000000000000000000000000000000002',
  cetus: '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b',
  sca: IS_VE_SCA_TEST
    ? '0x6cd813061a3adf3602b76545f076205f0c8e7ec1d3b1eab9a1da7992c18c0524'
    : '0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6',
  musd: '0xe44df51c0b21a27ab915fa1fe2ca610cd3eaa6d9666fe5e62b988bf7f0bd8722',
  ns: '0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178',
  // Wormhole assets
  weth: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5',
  wbtc: '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881',
  wapt: '0x3a5143bb1196e3bcdfab6203d1683ae29edd26294fc8bfeafe4aaa9d2704df37',
  wsol: '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8',
  // Sui LST
  afsui: '0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc',
  hasui: '0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d',
  vsui: '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55',
  // stable coins
  usdc: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7',
  wusdc: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf',
  wusdt: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c',
  fdusd: '0xf16e6b723f242ec745dfd7634ad072c42d5c1d9ac9d62a39c381303eaa57693a',
  usdy: '0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb',
  // isolated assets
  deep: '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270',
  fud: '0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1',
  blub: '0xfa7ac3951fdca92c5200d468d31a365eb03b2be9936fde615e69f0c1274ad3a0',
  // Sui bridge assets
  sbeth: '0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29',
  sbusdt: '0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068',
  sbwbtc: '0xaafb102dd0902f5055cadecd687fb5b71ca82ef0e0285d90afde828ec58ca96b',
};

export const wormholeCoinIds: types.WormholeCoinIds = {
  weth: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5',
  wbtc: '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881',
  wusdc: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf',
  wusdt: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c',
  wapt: '0x3a5143bb1196e3bcdfab6203d1683ae29edd26294fc8bfeafe4aaa9d2704df37',
  wsol: '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8',
};

export const voloCoinIds: types.VoloCoinIds = {
  vsui: '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55',
};

export const sCoinIds: types.SCoinIds = {
  ssui: '0xaafc4f740de0dd0dde642a31148fb94517087052f19afb0f7bed1dc41a50c77b::scallop_sui::SCALLOP_SUI',
  ssca: '0x5ca17430c1d046fae9edeaa8fd76c7b4193a00d764a0ecfa9418d733ad27bc1e::scallop_sca::SCALLOP_SCA',
  scetus:
    '0xea346ce428f91ab007210443efcea5f5cdbbb3aae7e9affc0ca93f9203c31f0c::scallop_cetus::SCALLOP_CETUS',
  smusd:
    '0x0a228d1c59071eccf3716076a1f71216846ee256d9fb07ea11fb7c1eb56435a5::scallop_musd::SCALLOP_MUSD',
  sns: '0x6511052d2f1404934e0d877709949bcda7c1d451d1218a4b2643ca2f3fa93991::scallop_ns::SCALLOP_NS',
  // Wormhole assets
  sweth:
    '0x67540ceb850d418679e69f1fb6b2093d6df78a2a699ffc733f7646096d552e9b::scallop_wormhole_eth::SCALLOP_WORMHOLE_ETH',
  swsol:
    '0x1392650f2eca9e3f6ffae3ff89e42a3590d7102b80e2b430f674730bc30d3259::scallop_wormhole_sol::SCALLOP_WORMHOLE_SOL',
  swbtc:
    '0x2cf76a9cf5d3337961d1154283234f94da2dcff18544dfe5cbdef65f319591b5::scallop_wormhole_btc::SCALLOP_WORMHOLE_BTC',
  // Sui LST
  safsui:
    '0x00671b1fa2a124f5be8bdae8b91ee711462c5d9e31bda232e70fd9607b523c88::scallop_af_sui::SCALLOP_AF_SUI',
  shasui:
    '0x9a2376943f7d22f88087c259c5889925f332ca4347e669dc37d54c2bf651af3c::scallop_ha_sui::SCALLOP_HA_SUI',
  svsui:
    '0xe1a1cc6bcf0001a015eab84bcc6713393ce20535f55b8b6f35c142e057a25fbe::scallop_v_sui::SCALLOP_V_SUI',
  // stable coins
  susdc:
    '0x854950aa624b1df59fe64e630b2ba7c550642e9342267a33061d59fb31582da5::scallop_usdc::SCALLOP_USDC',
  swusdc:
    '0xad4d71551d31092230db1fd482008ea42867dbf27b286e9c70a79d2a6191d58d::scallop_wormhole_usdc::SCALLOP_WORMHOLE_USDC',
  swusdt:
    '0xe6e5a012ec20a49a3d1d57bd2b67140b96cd4d3400b9d79e541f7bdbab661f95::scallop_wormhole_usdt::SCALLOP_WORMHOLE_USDT',
  sfdusd:
    '0x6711551c1e7652a270d9fbf0eee25d99594c157cde3cb5fbb49035eb59b1b001::scallop_fdusd::SCALLOP_FDUSD',
  susdy:
    '0xd285cbbf54c87fd93cd15227547467bb3e405da8bbf2ab99f83f323f88ac9a65::scallop_usdy::SCALLOP_USDY',
  // isolated assets
  sdeep:
    '0xeb7a05a3224837c5e5503575aed0be73c091d1ce5e43aa3c3e716e0ae614608f::scallop_deep::SCALLOP_DEEP',
  sfud: '0xe56d5167f427cbe597da9e8150ef5c337839aaf46891d62468dcf80bdd8e10d1::scallop_fud::SCALLOP_FUD',
  sblub:
    '0xe72f65446eabfad2103037af2d49d24599106fb44bf4c046c1e7e9acf6844dd0::scallop_blub::SCALLOP_BLUB',
  // Sui bridge assets
  ssbeth:
    '0xb14f82d8506d139eacef109688d1b71e7236bcce9b2c0ad526abcd6aa5be7de0::scallop_sb_eth::SCALLOP_SB_ETH',
  ssbusdt:
    '0xb1d7df34829d1513b73ba17cb7ad90c88d1e104bb65ab8f62f13e0cc103783d3::scallop_sb_usdt::SCALLOP_SB_USDT',
  ssbwbtc:
    '0x08c0fe357d3a138f4552bee393ce3a28a45bebcca43373d6a90bc44ab76f82e2::scallop_sb_wbtc::SCALLOP_SB_WBTC',
} as const;

export const sCoinTypeToName = Object.entries(sCoinIds).reduce(
  (acc, [coinName, coinType]) => {
    acc[coinType] = coinName as types.SupportSCoin;
    return acc;
  },
  {} as Record<string, types.SupportSCoin>
);

export const sCoinRawNameToName = Object.entries(sCoinIds).reduce(
  (acc, [coinName, coinType]) => {
    acc[coinType.split('::')[2].toLowerCase()] = coinName as types.SupportSCoin;
    return acc;
  },
  {} as Record<string, types.SupportSCoin>
);
