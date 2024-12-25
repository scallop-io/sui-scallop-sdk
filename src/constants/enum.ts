import type * as types from '../types';
import { IS_VE_SCA_TEST } from './common';

export const coinDecimals: types.SupportCoinDecimals = {
  usdc: 6,
  sbeth: 8,
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
  susdc: 6,
  sweth: 8,
  ssbeth: 8,
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
};

export const assetCoins: types.AssetCoins = {
  usdc: 'usdc',
  sbeth: 'sbeth',
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
};

export const marketCoins: types.MarketCoins = {
  susdc: 'susdc',
  ssbeth: 'ssbeth',
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
};

export const sCoins: types.SCoins = {
  susdc: 'susdc',
  ssbeth: 'ssbeth',
  sweth: 'sweth',
  swusdc: 'swusdc',
  swusdt: 'swusdt',
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
};

export const coinIds: types.AssetCoinIds = {
  usdc: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7',
  sui: '0x0000000000000000000000000000000000000000000000000000000000000002',
  sbeth: '0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29',
  weth: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5',
  wbtc: '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881',
  wusdc: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf',
  wusdt: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c',
  wapt: '0x3a5143bb1196e3bcdfab6203d1683ae29edd26294fc8bfeafe4aaa9d2704df37',
  wsol: '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8',
  cetus: '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b',
  afsui: '0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc',
  hasui: '0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d',
  vsui: '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55',
  sca: IS_VE_SCA_TEST
    ? '0x6cd813061a3adf3602b76545f076205f0c8e7ec1d3b1eab9a1da7992c18c0524'
    : '0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6',
  fdusd: '0xf16e6b723f242ec745dfd7634ad072c42d5c1d9ac9d62a39c381303eaa57693a',
  // isolated assets
  deep: '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270',
  fud: '0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1',
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

// PROD VERSION
export const sCoinIds: types.SCoinIds = {
  susdc:
    '0x854950aa624b1df59fe64e630b2ba7c550642e9342267a33061d59fb31582da5::scallop_usdc::SCALLOP_USDC',
  ssbeth:
    '0xb14f82d8506d139eacef109688d1b71e7236bcce9b2c0ad526abcd6aa5be7de0::scallop_sb_eth::SCALLOP_SB_ETH',
  ssui: '0xaafc4f740de0dd0dde642a31148fb94517087052f19afb0f7bed1dc41a50c77b::scallop_sui::SCALLOP_SUI',
  swusdc:
    '0xad4d71551d31092230db1fd482008ea42867dbf27b286e9c70a79d2a6191d58d::scallop_wormhole_usdc::SCALLOP_WORMHOLE_USDC',
  swusdt:
    '0xe6e5a012ec20a49a3d1d57bd2b67140b96cd4d3400b9d79e541f7bdbab661f95::scallop_wormhole_usdt::SCALLOP_WORMHOLE_USDT',
  ssca: '0x5ca17430c1d046fae9edeaa8fd76c7b4193a00d764a0ecfa9418d733ad27bc1e::scallop_sca::SCALLOP_SCA',
  scetus:
    '0xea346ce428f91ab007210443efcea5f5cdbbb3aae7e9affc0ca93f9203c31f0c::scallop_cetus::SCALLOP_CETUS',
  sweth:
    '0x67540ceb850d418679e69f1fb6b2093d6df78a2a699ffc733f7646096d552e9b::scallop_wormhole_eth::SCALLOP_WORMHOLE_ETH',
  safsui:
    '0x00671b1fa2a124f5be8bdae8b91ee711462c5d9e31bda232e70fd9607b523c88::scallop_af_sui::SCALLOP_AF_SUI',
  shasui:
    '0x9a2376943f7d22f88087c259c5889925f332ca4347e669dc37d54c2bf651af3c::scallop_ha_sui::SCALLOP_HA_SUI',
  svsui:
    '0xe1a1cc6bcf0001a015eab84bcc6713393ce20535f55b8b6f35c142e057a25fbe::scallop_v_sui::SCALLOP_V_SUI',
  swsol:
    '0x1392650f2eca9e3f6ffae3ff89e42a3590d7102b80e2b430f674730bc30d3259::scallop_wormhole_sol::SCALLOP_WORMHOLE_SOL',
  swbtc:
    '0x2cf76a9cf5d3337961d1154283234f94da2dcff18544dfe5cbdef65f319591b5::scallop_wormhole_btc::SCALLOP_WORMHOLE_BTC',
  sfdusd:
    '0x6711551c1e7652a270d9fbf0eee25d99594c157cde3cb5fbb49035eb59b1b001::scallop_fdusd::SCALLOP_FDUSD',
  sdeep:
    '0xeb7a05a3224837c5e5503575aed0be73c091d1ce5e43aa3c3e716e0ae614608f::scallop_deep::SCALLOP_DEEP',
  sfud: '0xe56d5167f427cbe597da9e8150ef5c337839aaf46891d62468dcf80bdd8e10d1::scallop_fud::SCALLOP_FUD',
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

// TEST VERSION
// export const sCoinIds: types.SCoinIds = {
// ssui: '0xf569919046f19a0c40b519ecfbb6ca0319698cd5908716c29b62ef56541f298b::scallop_sui::SCALLOP_SUI',
// swusdt: '0xac781d9f73058ff5e69f9bf8dde32f2e8c71c66d7fe8497fc83b2d9182254b22::scallop_wormhole_usdt::SCALLOP_WORMHOLE_USDT',
// swusdc: '0xf5447c4305a486d8c8557559887c2c39449ddb5e748f15d33946d02a1663c158::scallop_wormhole_usdc::SCALLOP_WORMHOLE_USDC',
// ssca: '0x958428555e778e55918a59eb1c92c77f32b5c554fa3a5e56cd0815086b5072e7::scallop_sca::SCALLOP_SCA',
// } as const;

// export const sCoinTreasuryCaps: types.SCoinTreasuryCaps = {
//   ssui: '0xd2c65de0495a060114c6ecc45f5573b8a4519e9538b93075aa2116e94209db55',
//   scetus: '0x24ba523450908240698628d554d910ed9aba6ff6c73ad735ee571cebd833fc4c',
//   ssca: '0xda98f336dd1d5827bfaee0fda75c9618d4c730df79623baca7b13037b514643d',
//   swusdc: '0xd74d585df52333ac463746225b2ae1a48d7f6b037ee97dd43f746e0f6b6a4723',
//   swusdt: '0x7bc99da1e37d838c49b018ed061f115d26c364a6b1a25059aebb372dfadba753',
//   sweth: '0xc2a793057fffb91be6cb026cd35e1fc51d5fdd9fae73d2c1cde19ddde0463c2d',
//   safsui: '0x20df47fa386c9948e255072df3f4e79e32921846770a0d2e01eb4336b5581aa9',
//   shasui: '0x5bb658edbd3f905494862e4b69101922fb3bea9ac5b035c32e66ec3ee1f4e685',
//   svsui: '0x3718f9350999e8be4c20064eaf874f470de4f36e3a7ca580fcd94d640a128936',
// };

// PROD VERSION
// export const sCoinConverterTreasury: types.SCoinConverterTreasury = {
//   ssui: '0x5fe57239383098ef93f75912b145e5937a1b3fc78451c78bb1964bc8c4189d5c',
//   scetus: '0x065ab504806e2a013308de3d60940d9550d39ef83c8a3882f5cbc9019388eeee',
//   ssca: '0xa9aa774956ec3ee0cafef4084e16e37aacd15564f6e6eb646a63bd96cb959b27',
//   swusdc: '0x2081a7fe4847aef473729bd6755686a7f232db46a2ff1be187fca961a6767363',
//   swusdt: '0xc19b204eee6306c794d4d8c1b02b6f58862a52d2cdfc2f580131abd967292450',
//   sweth: '0x0517d6380ff1687faf0385ccf758c815f114399e408d8b761fbcac4a3bf32495',
//   safsui: '0x088d0c107a29f250ead75e561a0f5039397da69fffd09392b33939ddc191cd31',
//   shasui: '0xa883cc4c09d51d3c3713124efce616a343a1158d3430cb42147488321db22fcf',
//   svsui: '0x8bd37d8aee69f17c5bb54c77d0d40ff6020b7b4a2c295ed455a79f72fb1c07e7',
// };

// TEST VERSION
// export const sCoinConverterTreasury: types.SCoinConverterTreasury = {
//   ssui: '0x9cb4551b36c17d37e19d700147fa819ea1c487ff8bcf18374de2cceb2e9d4845',
//   scetus: '0xd786f4b2d26278cc7911a3445b1b085eab60f269ef9dbb6b87e803d52f155003',
//   ssca: '0xe818636d1d6c46d6ea1a2dce9d94696d7cbc18ce27451b603eeaa47aba8d75e0',
//   swusdc: '0xfc6971648f867f7fd6928d1b873af71577e2eaf2c7543ef8bc82c431d833ae78',
//   swusdt: '0xb9593e2c3a0ba796ee815012b75ae46468ea78cda0188b9ac6816efe65503521',
//   sweth: '0x032b4c8fac94c038dbe986f7587e9b1e4ef580b5ee06d2ef249d85459b7ef05d',
//   safsui: '0x21450ef0570ef3d224ffa3b873ab802e439ece7b93cc7efad10ae0c1e3b3fcfe',
//   shasui: '0xf822fc1402207e47d2e3ba8ff6e1e594bf1de777dc5ebd2744619cd2726e3b0d',
//   svsui: '0x327114f0bf3559d7e2de10282147ed76a236c7c6775029165c4db09a6062ead6',
// };
