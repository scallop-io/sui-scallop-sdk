import { AddressesInterface } from 'src/types';

export const TEST_ADDRESSES: AddressesInterface = {
  core: {
    version:
      '0xee15d07800e2ad4852505c57cd86afea774af02c17388f8bd907de75f915b4f4',
    versionCap:
      '0x590a4011cb649b3878f3ea14b3a78674642a9548d79b7e091ef679574b158a07',
    object:
      '0xb03fa00e2d9f17d78a9d48bd94d8852abec68c19d55e819096b1e062e69bfad1',
    market:
      '0xa7f41efe3b551c20ad6d6cea6ccd0fd68d2e2eaaacdca5e62d956209f6a51312',
    adminCap:
      '0x09689d018e71c337d9db6d67cbca06b74ed92196103624028ccc3ecea411777c',
    coinDecimalsRegistry:
      '0x200abe9bf19751cc566ae35aa58e2b7e4ff688fc1130f8d8909ea09bc137d668',
    obligationAccessStore:
      '0xb7d7e1464936fbdcdd4913308b40335e662401029635289bdb317c7dde9d6c68',
    coins: {
      usdc: {
        id: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7',
        metaData:
          '0x69b7a7c3c200439c1b5f3b19d7d495d5966d5f08de66c69276152f8db3992ec6',
        treasury: '',
        coinType:
          '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
        symbol: 'USDC',
        decimals: 6,
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: 'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
            feedObject:
              '0x5dec622733a204ca27f5a90d8c2fad453cc6665186fd5dff13a83d0b6c9027ab',
          },
        },
      },
      sui: {
        id: '0x0000000000000000000000000000000000000000000000000000000000000002',
        metaData:
          '0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3',
        treasury: '',
        coinType:
          '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
        symbol: 'SUI',
        decimals: 9,
        oracle: {
          supra: '',
          switchboard:
            // '0xbca474133638352ba83ccf7b5c931d50f764b09550e16612c9f70f1e21f3f594',
            '0xaebdb50e0a95c5aa20c60bde5f574dac90aef83b508d64146cf29b5f63c35d4f',
          pyth: {
            feed: '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
            feedObject:
              '0x801dbc2f0053d34734814b2d6df491ce7807a725fe9a01ad74a07e9c51396c37',
          },
        },
      },
      sca: {
        id: '0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6',
        metaData:
          '0x5d26a1e9a55c88147ac870bfa31b729d7f49f8804b8b3adfdf3582d301cca844',
        treasury: '',
        coinType:
          '0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA',
        symbol: 'SCA',
        decimals: 9,
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: '7e17f0ac105abe9214deb9944c30264f5986bf292869c6bd8e8da3ccd92d79bc',
            feedObject:
              '0xf6de1d3279a269a597d813cbaca59aa906543ab9a8c64e84a4722f1a20863985',
          },
        },
      },
      deep: {
        id: '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270',
        metaData:
          '0x6e60b051a08fa836f5a7acd7c464c8d9825bc29c44657fe170fe9b8e1e4770c0',
        treasury: '',
        coinType:
          '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP',
        symbol: 'DEEP',
        decimals: 6,
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: '29bdd5248234e33bd93d3b81100b5fa32eaa5997843847e2c2cb16d7c6d9f7ff',
            feedObject:
              '0x8c7f3a322b94cc69db2a2ac575cbd94bf5766113324c3a3eceac91e3e88a51ed',
          },
        },
      },
      fud: {
        id: '0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1',
        metaData:
          '0x01087411ef48aaac1eb6e24803213e3a60a03b147dac930e5e341f17a85e524e',
        treasury: '',
        coinType:
          '0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1::fud::FUD',
        symbol: 'FUD',
        decimals: 5,
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: '6a4090703da959247727f2b490eb21aea95c8684ecfac675f432008830890c75',
            feedObject:
              '0x4531c3ed0d22f21f5fce882905372006c9aafa30f01db03b789e95a6c50de7b2',
          },
        },
      },
    },
    oracles: {
      xOracle:
        '0x0c09daac413e834f2fe69601c41e836022fa9a185df6b56a80f6bcd8a3ecb8a2',
      xOracleCap:
        '0x1edeae568fde99e090dbdec4bcdbd33a15f53a1ce1f87aeef1a560dedf4b4a90',
      primaryPriceUpdatePolicyObject:
        '0xbcd908d0ee6d63d726e61676f3feeec3d19817f4849bbecf372dd3399f247f6b',
      // '0x56e48a141f20a3a6a6d3fc43e58b01fc63f756c08224870e7890c80ec9d2afee' // prod
      secondaryPriceUpdatePolicyObject:
        '0x624a6f120777bb30e718b86e836c205ef4229448052377dc3d78272a6662b2c0',
      // '0xef4d9430ae42c1b24199ac55e87ddd7262622447ee3c7de8868efe839b3d8705' // prod
      primaryPriceUpdatePolicyVecsetId:
        '0xfb1330aa028ed6a159b742c71b5a79b3b6824cf71efa40ea82b52486ad209264',
      // '0xc22c9d691ee4c780de09db91d8b487d863211ebf08720772144bcf716318826c', // prod
      secondaryPriceUpdatePolicyVecsetId:
        '0x4b827acc73f3f53f808dd73a7ee0a60ae61e84322176bece72b26467030b467c',
      // '0x3b184ff859f5de30eeaf186898e5224925be6bb6d2baa74347ef471a8cd1c0d3' // prod
      supra: {
        registry: '',
        registryCap: '',
        holder: '',
      },
      switchboard: {
        registry:
          '0x9b1b415f384af6af0ff31c22decdc88b3b83d0188cf63ef9c58fd122bca77219',
        registryTableId:
          '0x9f75c071b0db2e80da3f5c98686ffdedf3a633684290499501595277a5350b8c',
        state: '',
        registryCap: '',
      },
      pyth: {
        registry:
          '0xdcf813893649521abd27816ba8d946b0cb7fc98d776cc9adcecba54688ccc109',
        registryCap:
          '0xe4995aaca4e70d4203790fbd22332107131e88b92b81bc976e6fc3a7d5005efd',
        state:
          '0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8',
        wormhole:
          '0x5306f64e312b581766351c07af79c72fcb1cd25147157fdc2f8ad76de9a3fb6a',
        wormholeState:
          '0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c',
      },
    },
    packages: {
      coinDecimalsRegistry: {
        id: '0xca5a5a62f01c79a104bf4d31669e29daa387f325c241de4edbe30986a9bc8b0d',
        upgradeCap:
          '0x34e76a945d29f195bc53ca704fa70877d1cf3a5d7bbfdda1b13e633fff13c0f6',
      },
      math: {
        id: '0xad013d5fde39e15eabda32b3dbdafd67dac32b798ce63237c27a8f73339b9b6f',
        upgradeCap:
          '0x3a329598231de02e6135c62284b66005b41cad1d9ab7ca2dc79c08293aba2ec6',
      },
      whitelist: {
        id: '0x1318fdc90319ec9c24df1456d960a447521b0a658316155895014a6e39b5482f',
        upgradeCap:
          '0xf5a22aea23db664f7b69855b6a546747f17c1ec4230319cfc17225e462b05761',
      },
      x: {
        id: '0x779b5c547976899f5474f3a5bc0db36ddf4697ad7e5a901db0415c2281d28162',
        upgradeCap:
          '0x3f203f6fff6a69d151e4f1cd931f22b68c489ef2759765662fc7baf673943c9e',
      },
      protocol: {
        id: '0xb03fa00e2d9f17d78a9d48bd94d8852abec68c19d55e819096b1e062e69bfad1',
        upgradeCap:
          '0x38527d154618d1fd5a644b90717fe07cf0e9f26b46b63e9568e611a3f86d5c1a',
      },
      protocolWhitelist: {
        id: '0x4c262d9343dac53ecb28f482a2a3f62c73d0ebac5b5f03d57383d56ff219acdf',
        upgradeCap:
          '0x4a5e88a75039b00988f633f811f58117f31b8627a46bf822aa114d9010049449',
      },
      query: {
        id: '0x3a0dbce719fc56a96bf8e8dd53cd57eb9c313642a88d99b86f51208762eba258',
        upgradeCap:
          '0x14220f035f4cfc2ce442c30703fb44d24f00846eb7077907a231a56051a1d9b2',
      },
      supra: { id: '', object: '', upgradeCap: '' },
      pyth: {
        id: '0xe622909f9252d4ef1737c41ea430ef44203d8f5dc8e01e1b3950a31405bc54eb',
        object:
          '0xe622909f9252d4ef1737c41ea430ef44203d8f5dc8e01e1b3950a31405bc54eb',
        upgradeCap:
          '0xb1f167889643ff766df31745b6e93b92462d8165b0a4f1b095499e15180370f7',
      },
      switchboard: {
        id: '0x248f5cb31c12eed6ab8fd4c6176466b982be42ce87e6bf8ff896fb8097a1660d',
        object:
          '0x248f5cb31c12eed6ab8fd4c6176466b982be42ce87e6bf8ff896fb8097a1660d',
        upgradeCap: '',
      },
      xOracle: {
        id: '0xe7511600c924f1d0ac4b3fa5de3ae26b8845545902b015dc5fc7894307365d7b',
        object:
          '0xe7511600c924f1d0ac4b3fa5de3ae26b8845545902b015dc5fc7894307365d7b',
        upgradeCap:
          '0x0f928a6b2e26b73330fecaf9b44acfc9800a4a9794d6415c2a3153bc70e3c1f0',
      },
      testCoin: {
        id: '',
        upgradeCap: '',
      },
    },
  },
  spool: {
    id: '0x1742655fe5872dfa6456673f9e38612a4965e6979e6cd7696a7f1225f28bae21',
    adminCap:
      '0xdd8a047cbbf802bfcde5288b8ef1910965d789cc614da11d39af05fca0bd020a',
    object:
      '0xe87f1b2d498106a2c61421cec75b7b5c5e348512b0dc263949a0e7a3c256571a',
    pools: {
      ssui: {
        id: '0xb9617f83c06ebdeac0a8834782b1015e1cc7ea23739e30c132c4bfb95c37a579',
        rewardPoolId:
          '0xc3206071a8d43212efb6e3b5504f2321f8df97ab122b466c0bc7cfdf398dc13a',
      },
      susdc: {
        id: '0x0b5f5f413bd3799e4052c37311966c77f3a4545eb125d2e93e67a68478021918',
        rewardPoolId:
          '0x85ed6ed72ea97c35dbf0cdc7ed6fbc48d8ec15de9b17c74bf4512df8a6d7f166',
      },
    },
    config: '',
  },
  borrowIncentive: {
    id: '0x8fe05c796e779c71e7739dcaecefb8757ff9482f62e419dbd0dd9c35b740054f',
    adminCap:
      '0xc486afa253646f4d381e81d7f1df8aa4723b845a6bb356f69bad635ffefffe2c',
    object:
      '0x8fe05c796e779c71e7739dcaecefb8757ff9482f62e419dbd0dd9c35b740054f',
    query: '0x5fba54ac5862f087112c54c02339623bd245721f5e21ea3330fc8c8afc8f51f4',
    incentivePools:
      '0xcace4f4736229043d9f897667d046370b8a4d6534bfd307787c40b4c9f42514a',
    incentiveAccounts:
      '0x41ff558f580ca0f711910fd6ef687fce9df76ee8e7fc5e150bdfae08e17fae62',
    config:
      '0x9636e7b947b806b9fe438d037f02bb24026c5b2691d2f6bad349c2e117f77cc3',
  },
  vesca: {
    id: '0x1158813b32962c2d22888fae257d5f2365b03631f0cd5d5b912ccdf51ff4e2f2',
    object:
      '0xcfe2d87aa5712b67cad2732edb6a2201bfdf592377e5c0968b7cb02099bd8e21',
    adminCap:
      '0x4d105b16467acca81d18c132cdd1a3cee159920a86c1ef4bdbf2e8d7878500c5',
    tableId:
      '0x0a0b7f749baeb61e3dfee2b42245e32d0e6b484063f0a536b33e771d573d7246',
    table: '0xd3a4632b1080f7d96e1c2487d4dabf2c1196916937c505a69954ac9f393be8d0',
    treasury:
      '0xafa4b6231e49c15a22d641ce33fda761baaf650fa21899dfa2eb1716146e7306',
    config:
      '0x7cbcb0a342179577a117dfdff974cf1ab765d3b571067bf22ddf5f9e3a667922',
  },
  referral: {
    id: '0x1bf5a8ce77050d8052549d743e16b469f15aa6b81b752b78b6ebb65179665f5a',
    object:
      '0x5658d4bf5ddcba27e4337b4262108b3ad1716643cac8c2054ac341538adc72ec',
    adminCap:
      '0xc5dc06b9074291259f2cac460c940012c781c4430e42125c541cc43101c3bcbd',
    referralBindings:
      '0xcf184487782bed962bf678001efe775d31fb94b9992333a57594cf15d79d5ced',
    bindingTableId:
      '0x41a50e258c0a266ce84e0e1a618dbf70b878cc943909e613089a50afcceb2bc0',
    referralRevenuePool:
      '0xc24e3e5e37032f29a3dd91a9a1f057af8821b7e6c148e9683900ac8b6d30f0c6',
    revenueTableId:
      '0x669dfb0f47fccbbe2ae8a0bfce2672a994ef3f1c7049621405cce2f91733bdc1',
    referralTiers:
      '0x144350f3db9b46d11b140084cd54e6de0b9c3b8d265ce8059b51d0ef58ea464b',
    tiersTableId:
      '0xad5e36fce7358a3ef94a56eb89ee7f1968100c1a9d967c1731154083e1dda1fb',
    authorizedWitnessList:
      '0xf21b0ed043c9bb70842c0129159f4943dbcc3c9ef2f2f808af65f8be25cfd20e',
    version:
      '0x3545849eb97723e676a476ec9d4fe5f2eb0eb2c6b78972851114fd4c7ed4639f',
  },
  loyaltyProgram: {
    id: '0xab7c4e6d53ef862a1115d0c381fd33e05f9c206b79f322a54990b1e8c2fe3446',
    object:
      '0xab7c4e6d53ef862a1115d0c381fd33e05f9c206b79f322a54990b1e8c2fe3446',
    rewardPool:
      '0x215e1022037052407e69a5c5938f888078013c924cae97132492719ac2c53ec6',
    userRewardTableId:
      '0x574a11f8a0fbaa05b8f559cb65634e8eb20f26b1ec29e7d58de9167f3cedd0f7',
  },
  scoin: {
    id: '0x826a4934bee9487e558eed603cf42f30cdc4321d6f31083930791b95f903b9f9',
    coins: {
      ssui: {
        coinType:
          '0x88618204de2dfdc2597681a8441ee726b0dc13494c41e319c3264eb7b35fea90::scallop_sui::SCALLOP_SUI',
        metaData: '',
        symbol: 'sSUI',
        treasury:
          '0x03f1d94a40bd9f5d556bacb5c5245732b185572f6a29b36ad8b555d9a8a24f09',
      },
      ssca: {
        coinType:
          '0x9f64a180373a6b66595025ae16a4ab701f0af1dd5c7ce1ac91dc112e52c2a3f8::scallop_sca::SCALLOP_SCA',
        metaData: '',
        symbol: 'sSCA',
        treasury:
          '0x1b05d2cd8b20dba19da073a54195fc52d2f438ea19dea0713bae7a7dab308199',
      },
      susdc: {
        coinType:
          '0x55ed015f9f006c0c96ad36ebe3b3570d088e8498f52defea48e5634c110e485c::scallop_usdc::SCALLOP_USDC',
        treasury:
          '0x6ef82ef94472dcb8c2cdeac8df38874024c08570ca165986ba56d1e38fe0c0a3',
        symbol: 'sUSDC',
        metaData:
          '0x763a21eba338e00bc684aaad80491c89eea5f247b59c47df45b17610c9ad58f2',
      },
      sdeep: {
        coinType:
          '0x34f0a2e793e1f79ceac72cfe3bb95f65541da449418289ccd12922d16140c882::scallop_deep::SCALLOP_DEEP',
        metaData: '',
        symbol: 'sDEEP',
        treasury:
          '0x71d41465cf2d16fa0206126526bebdf65c8871d1fcfbd0c2237db2306afd67ba',
      },
      sfud: {
        coinType:
          '0x3b23c05f917052255a0b16a534dbd4446911aa4a30bd3497cdf5b736551e7ef8::scallop_fud::SCALLOP_FUD',
        metaData: '',
        symbol: 'sFUD',
        treasury:
          '0x858c492d51425b922c040c1a389e185b3b00d565e7d72ead1a81dc733104660d',
      },
    },
  },
};
