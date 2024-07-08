import type * as types from '../types';
import { IS_VE_SCA_TEST } from './common';

export const coinDecimals: types.SupportCoinDecimals = {
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
  sca: 9,
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
  ssca: 9,
};

export const assetCoins: types.AssetCoins = {
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
  sca: 'sca',
};

export const marketCoins: types.MarketCoins = {
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
  ssca: 'ssca',
};

export const sCoins: types.SCoins = {
  seth: 'seth',
  susdc: 'susdc',
  susdt: 'susdt',
  ssui: 'ssui',
  scetus: 'scetus',
  safsui: 'safsui',
  shasui: 'shasui',
  svsui: 'svsui',
  ssca: 'ssca',
};

export const stakeMarketCoins: types.StakeMarketCoins = {
  seth: 'seth',
  ssui: 'ssui',
  susdc: 'susdc',
  susdt: 'susdt',
  scetus: 'scetus',
  safsui: 'safsui',
  shasui: 'shasui',
  svsui: 'svsui',
};

export const spoolRewardCoins: types.StakeRewardCoins = {
  seth: 'sui',
  ssui: 'sui',
  susdc: 'sui',
  susdt: 'sui',
  scetus: 'sui',
  safsui: 'sui',
  shasui: 'sui',
  svsui: 'sui',
};

export const borrowIncentiveRewardCoins: types.BorrowIncentiveRewardCoins = {
  sui: ['sui', 'sca'],
  usdc: ['sui', 'sca'],
  usdt: ['sui', 'sca'],
  sca: ['sui', 'sca'],
  afsui: ['sui'],
  hasui: ['sui'],
  vsui: ['sui'],
  eth: ['sui'],
};

export const coinIds: types.AssetCoinIds = {
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
  sca: IS_VE_SCA_TEST
    ? '0x6cd813061a3adf3602b76545f076205f0c8e7ec1d3b1eab9a1da7992c18c0524'
    : '0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6',
};

export const wormholeCoinIds: types.WormholeCoinIds = {
  eth: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5',
  btc: '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881',
  usdc: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf',
  usdt: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c',
  apt: '0x3a5143bb1196e3bcdfab6203d1683ae29edd26294fc8bfeafe4aaa9d2704df37',
  sol: '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8',
};

export const voloCoinIds: types.VoloCoinIds = {
  vsui: '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55',
};

// PROD VERSION
export const sCoinIds: types.SCoinIds = {
  ssui: '0xaafc4f740de0dd0dde642a31148fb94517087052f19afb0f7bed1dc41a50c77b::scallop_sui::SCALLOP_SUI',
  scetus:
    '0xea346ce428f91ab007210443efcea5f5cdbbb3aae7e9affc0ca93f9203c31f0c::scallop_cetus::SCALLOP_CETUS',
  ssca: '0x5ca17430c1d046fae9edeaa8fd76c7b4193a00d764a0ecfa9418d733ad27bc1e::scallop_sca::SCALLOP_SCA',
  susdc:
    '0xad4d71551d31092230db1fd482008ea42867dbf27b286e9c70a79d2a6191d58d::scallop_wormhole_usdc::SCALLOP_WORMHOLE_USDC',
  susdt:
    '0xe6e5a012ec20a49a3d1d57bd2b67140b96cd4d3400b9d79e541f7bdbab661f95::scallop_wormhole_usdt::SCALLOP_WORMHOLE_USDT',
  seth: '0x67540ceb850d418679e69f1fb6b2093d6df78a2a699ffc733f7646096d552e9b::scallop_wormhole_eth::SCALLOP_WORMHOLE_ETH',
  safsui:
    '0x00671b1fa2a124f5be8bdae8b91ee711462c5d9e31bda232e70fd9607b523c88::scallop_af_sui::SCALLOP_AF_SUI',
  shasui:
    '0x9a2376943f7d22f88087c259c5889925f332ca4347e669dc37d54c2bf651af3c::scallop_ha_sui::SCALLOP_HA_SUI',
  svsui:
    '0xe1a1cc6bcf0001a015eab84bcc6713393ce20535f55b8b6f35c142e057a25fbe::scallop_v_sui::SCALLOP_V_SUI',
} as const;

// TEST VERSION
// export const sCoinIds: types.SCoinIds = {
//   ssui: '0xfac769100bccc0caebcf4f4e2d00ac2f8883f07f724be28940df90605f5e7e9a::scallop_sui::SCALLOP_SUI',
//   scetus:
//     '0x8b71e6d323ed78515af2bead13bf3d0da1562ba4a99234eb7c4f14fd39ef0427::scallop_cetus::SCALLOP_CETUS',
//   ssca: '0x0a9d3c6c9af9f6e8def82921541bcbd17f73ed31bed3adcb684f2a4c267e42f0::scallop_sca::SCALLOP_SCA',
//   susdc:
//     '0xaedc3ab75db8680b81a755015fa90124d217be93457b893c05bac033817defaf::scallop_wormhole_usdc::SCALLOP_WORMHOLE_USDC',
//   susdt:
//     '0xbf02fc87ddc104b342ad8414c85ceadf5b0c823c055a06fb0ed776272c01a52a::scallop_wormhole_usdt::SCALLOP_WORMHOLE_USDT',
//   seth: '0x27d54f43e3eda701be56b82e5756e41c84467cd202f5cf713d5f9e45a9f1b6bc::scallop_wormhole_eth::SCALLOP_WORMHOLE_ETH',
//   safsui:
//     '0xb75b46d975d8d80670b53a6bee90baaa8ce2e0b7d397f079447d641eef6b44ad::scallop_af_sui::SCALLOP_AF_SUI',
//   shasui:
//     '0xd973a723874e2c7cde196602a79155a1343a933f8cf87d9b1bb7408bc1acbc58::scallop_ha_sui::SCALLOP_HA_SUI',
//   svsui:
//     '0x97023a317320c4498cc4cd239dd02fd30c28246e5e8f81325d63f2bd8d70f6b3::scallop_v_sui::SCALLOP_V_SUI',
// } as const;

// export const sCoinTreasuryCaps: types.SCoinTreasuryCaps = {
//   ssui: '0xd2c65de0495a060114c6ecc45f5573b8a4519e9538b93075aa2116e94209db55',
//   scetus: '0x24ba523450908240698628d554d910ed9aba6ff6c73ad735ee571cebd833fc4c',
//   ssca: '0xda98f336dd1d5827bfaee0fda75c9618d4c730df79623baca7b13037b514643d',
//   susdc: '0xd74d585df52333ac463746225b2ae1a48d7f6b037ee97dd43f746e0f6b6a4723',
//   susdt: '0x7bc99da1e37d838c49b018ed061f115d26c364a6b1a25059aebb372dfadba753',
//   seth: '0xc2a793057fffb91be6cb026cd35e1fc51d5fdd9fae73d2c1cde19ddde0463c2d',
//   safsui: '0x20df47fa386c9948e255072df3f4e79e32921846770a0d2e01eb4336b5581aa9',
//   shasui: '0x5bb658edbd3f905494862e4b69101922fb3bea9ac5b035c32e66ec3ee1f4e685',
//   svsui: '0x3718f9350999e8be4c20064eaf874f470de4f36e3a7ca580fcd94d640a128936',
// };

// PROD VERSION
// export const sCoinConverterTreasury: types.SCoinConverterTreasury = {
//   ssui: '0x5fe57239383098ef93f75912b145e5937a1b3fc78451c78bb1964bc8c4189d5c',
//   scetus: '0x065ab504806e2a013308de3d60940d9550d39ef83c8a3882f5cbc9019388eeee',
//   ssca: '0xa9aa774956ec3ee0cafef4084e16e37aacd15564f6e6eb646a63bd96cb959b27',
//   susdc: '0x2081a7fe4847aef473729bd6755686a7f232db46a2ff1be187fca961a6767363',
//   susdt: '0xc19b204eee6306c794d4d8c1b02b6f58862a52d2cdfc2f580131abd967292450',
//   seth: '0x0517d6380ff1687faf0385ccf758c815f114399e408d8b761fbcac4a3bf32495',
//   safsui: '0x088d0c107a29f250ead75e561a0f5039397da69fffd09392b33939ddc191cd31',
//   shasui: '0xa883cc4c09d51d3c3713124efce616a343a1158d3430cb42147488321db22fcf',
//   svsui: '0x8bd37d8aee69f17c5bb54c77d0d40ff6020b7b4a2c295ed455a79f72fb1c07e7',
// };

// TEST VERSION
// export const sCoinConverterTreasury: types.SCoinConverterTreasury = {
//   ssui: '0x9cb4551b36c17d37e19d700147fa819ea1c487ff8bcf18374de2cceb2e9d4845',
//   scetus: '0xd786f4b2d26278cc7911a3445b1b085eab60f269ef9dbb6b87e803d52f155003',
//   ssca: '0xe818636d1d6c46d6ea1a2dce9d94696d7cbc18ce27451b603eeaa47aba8d75e0',
//   susdc: '0xfc6971648f867f7fd6928d1b873af71577e2eaf2c7543ef8bc82c431d833ae78',
//   susdt: '0xb9593e2c3a0ba796ee815012b75ae46468ea78cda0188b9ac6816efe65503521',
//   seth: '0x032b4c8fac94c038dbe986f7587e9b1e4ef580b5ee06d2ef249d85459b7ef05d',
//   safsui: '0x21450ef0570ef3d224ffa3b873ab802e439ece7b93cc7efad10ae0c1e3b3fcfe',
//   shasui: '0xf822fc1402207e47d2e3ba8ff6e1e594bf1de777dc5ebd2744619cd2726e3b0d',
//   svsui: '0x327114f0bf3559d7e2de10282147ed76a236c7c6775029165c4db09a6062ead6',
// };
