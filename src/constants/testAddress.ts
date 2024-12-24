import { AddressesInterface } from 'src/types';

export const TEST_ADDRESSES: AddressesInterface = {
  core: {
    // version:
    //   '0x07871c4b3c847a0f674510d4978d5cf6f960452795e8ff6f189fd2088a3f6ac7',
    version:
      '0xd318de9b0f6873879a82cbfcc2daa1d1591a8b54e7cea9f4b567da63c692a52b',
    versionCap:
      '0x590a4011cb649b3878f3ea14b3a78674642a9548d79b7e091ef679574b158a07',
    // object:
    //   '0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf',
    object:
      '0x6c23585e940a989588432509107e98bae06dbca4e333f26d0635d401b3c7c76d',
    // market:
    //   '0xa757975255146dc9686aa823b7838b507f315d704f428cbadad2f4ea061939d9',
    market:
      '0x9d6434e97f3f98fd9b0c0e1dca22632073985abcd22541feae7ee1e34cbe3af2',
    adminCap:
      '0x09689d018e71c337d9db6d67cbca06b74ed92196103624028ccc3ecea411777c',
    coinDecimalsRegistry:
      '0x200abe9bf19751cc566ae35aa58e2b7e4ff688fc1130f8d8909ea09bc137d668',
    // obligationAccessStore:
    //   '0x733e30b7c94d619d78cb8f5bc4bfbb759ced9a531239028caabb2474e5be59c9',
    obligationAccessStore:
      '0x46e9b44a77ee9c9d33cc2689ecdfbb8f681935cbc6bdf6ac3df048e396c36c82',
    coins: {
      usdc: {
        id: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7',
        metaData:
          '0x69b7a7c3c200439c1b5f3b19d7d495d5966d5f08de66c69276152f8db3992ec6',
        treasury: '',
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
      cetus: {
        id: '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b',
        metaData:
          '0x4c0dce55eff2db5419bbd2d239d1aa22b4a400c01bbb648b058a9883989025da',
        treasury: '',
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: 'e5b274b2611143df055d6e7cd8d93fe1961716bcd4dca1cad87a83bc1e78c1ef',
            feedObject:
              '0x24c0247fb22457a719efac7f670cdc79be321b521460bd6bd2ccfa9f80713b14',
          },
        },
      },
      wapt: {
        id: '0x3a5143bb1196e3bcdfab6203d1683ae29edd26294fc8bfeafe4aaa9d2704df37',
        metaData:
          '0xc969c5251f372c0f34c32759f1d315cf1ea0ee5e4454b52aea08778eacfdd0a8',
        treasury: '',
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: '03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5',
            feedObject:
              '0x7c5b7837c44a69b469325463ac0673ac1aa8435ff44ddb4191c9ae380463647f',
          },
        },
      },
      wsol: {
        id: '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8',
        metaData:
          '0x4d2c39082b4477e3e79dc4562d939147ab90c42fc5f3e4acf03b94383cd69b6e',
        treasury: '',
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: 'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
            feedObject:
              '0x9d0d275efbd37d8a8855f6f2c761fa5983293dd8ce202ee5196626de8fcd4469',
          },
        },
      },
      wbtc: {
        id: '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881',
        metaData:
          '0x5d3c6e60eeff8a05b693b481539e7847dfe33013e7070cdcb387f5c0cac05dfd',
        treasury: '',
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: 'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
            feedObject:
              '0x9a62b4863bdeaabdc9500fce769cf7e72d5585eeb28a6d26e4cafadc13f76ab2',
          },
        },
      },
      weth: {
        id: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5',
        metaData:
          '0x8900e4ceede3363bef086d6b50ca89d816d0e90bf6bc46efefe1f8455e08f50f',
        treasury: '',
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
            feedObject:
              '0x9193fd47f9a0ab99b6e365a464c8a9ae30e6150fc37ed2a89c1586631f6fc4ab',
          },
        },
      },
      wusdc: {
        id: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf',
        metaData:
          '0x4fbf84f3029bd0c0b77164b587963be957f853eccf834a67bb9ecba6ec80f189',
        treasury: '',
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
      wusdt: {
        id: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c',
        metaData:
          '0xfb0e3eb97dd158a5ae979dddfa24348063843c5b20eb8381dd5fa7c93699e45c',
        treasury: '',
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: '2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
            feedObject:
              '0x985e3db9f93f76ee8bace7c3dd5cc676a096accd5d9e09e9ae0fb6e492b14572',
          },
        },
      },
      sui: {
        id: '0x0000000000000000000000000000000000000000000000000000000000000002',
        metaData:
          '0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3',
        treasury: '',
        oracle: {
          supra: '',
          switchboard:
            '0xbca474133638352ba83ccf7b5c931d50f764b09550e16612c9f70f1e21f3f594',
          pyth: {
            feed: '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
            feedObject:
              '0x801dbc2f0053d34734814b2d6df491ce7807a725fe9a01ad74a07e9c51396c37',
          },
        },
      },
      afsui: {
        id: '0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc',
        metaData:
          '0x2f9217f533e51334873a39b8026a4aa6919497b47f49d0986a4f1aec66f8a34d',
        treasury: '',
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
            feedObject:
              '0x801dbc2f0053d34734814b2d6df491ce7807a725fe9a01ad74a07e9c51396c37',
          },
        },
      },
      hasui: {
        id: '0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d',
        metaData:
          '0x2c5f33af93f6511df699aaaa5822d823aac6ed99d4a0de2a4a50b3afa0172e24',
        treasury: '',
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
            feedObject:
              '0x801dbc2f0053d34734814b2d6df491ce7807a725fe9a01ad74a07e9c51396c37',
          },
        },
      },
      vsui: {
        id: '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55',
        metaData:
          '0xabd84a23467b33854ab25cf862006fd97479f8f6f53e50fe732c43a274d939bd',
        treasury: '',
        oracle: {
          supra: '',
          switchboard: '',
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
      sbeth: {
        id: '0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29',
        metaData:
          '0x89b04ba87f8832d4d76e17a1c9dce72eb3e64d372cf02012b8d2de5384faeef0',
        treasury: '',
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: 'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
            feedObject:
              '0x9193fd47f9a0ab99b6e365a464c8a9ae30e6150fc37ed2a89c1586631f6fc4ab',
          },
        },
      },
      fdusd: {
        id: '0xf16e6b723f242ec745dfd7634ad072c42d5c1d9ac9d62a39c381303eaa57693a',
        metaData:
          '0xdebee5265a67c186ed87fe93303d33dfe1de53e3b4fd7d9329c2852860acd3e7',
        treasury: '',
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: '0xccdc1a08923e2e4f4b1e6ea89de6acbc5fe1948e9706f5604b8cb50bc1ed3979',
            feedObject:
              '0x5f6583b2b0fe1ecf94aaffeaab8a838794693960cea48c0da282d5f4a24be027',
          },
        },
      },
      deep: {
        id: '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270',
        metaData:
          '0x6e60b051a08fa836f5a7acd7c464c8d9825bc29c44657fe170fe9b8e1e4770c0',
        treasury: '',
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
        '0x93d5bf0936b71eb27255941e532fac33b5a5c7759e377b4923af0a1359ad494f',
      xOracleCap:
        '0x1edeae568fde99e090dbdec4bcdbd33a15f53a1ce1f87aeef1a560dedf4b4a90',
      supra: { registry: '', registryCap: '', holder: '' },
      switchboard: { registry: '', registryCap: '' },
      pyth: {
        registry:
          '0xedc293f9413a5a7a5d53bdba1fd889d0a4030894469228f0acdae4aa3c55a213',
        registryCap:
          '0xbcb07141eb1f7e01fbda4130ecf5f5adaeabb77f5d9c32158b7532bcd2197acd',
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
        id: '0xb784ea287d944e478a3ceaa071f8885072cce6b7224cf245914dc2f9963f460e',
        upgradeCap:
          '0x38527d154618d1fd5a644b90717fe07cf0e9f26b46b63e9568e611a3f86d5c1a',
      },
      // protocol: {
      //   id: '0x6e641f0dca8aedab3101d047e96439178f16301bf0b57fe8745086ff1195eb3e',
      //   upgradeCap:
      //     '0x38527d154618d1fd5a644b90717fe07cf0e9f26b46b63e9568e611a3f86d5c1a',
      // },
      protocolWhitelist: {
        id: '0x4c262d9343dac53ecb28f482a2a3f62c73d0ebac5b5f03d57383d56ff219acdf',
        upgradeCap:
          '0x4a5e88a75039b00988f633f811f58117f31b8627a46bf822aa114d9010049449',
      },
      // query: {
      //   id: '0xb8d603a39114a5efef3dd0bf84df0bed1be1fbd39b78b7dd6e8a61ccc5e6006f',
      //   upgradeCap:
      //     '0x0d535c35f608b9b01b7ccce11acf43b1dd80c1b72bf8b541744a6e28e8d2745f',
      // },
      query: {
        id: '0x89706958f43fb170de134579e3fbc53972b946ee78bd2442d8e1adc36074fbdc',
        upgradeCap:
          '0x0d535c35f608b9b01b7ccce11acf43b1dd80c1b72bf8b541744a6e28e8d2745f',
      },
      supra: { id: '', upgradeCap: '' },
      pyth: {
        id: '0x910f30cbc7f601f75a5141a01265cd47c62d468707c5e1aecb32a18f448cb25a',
        upgradeCap:
          '0xdf0ffbae1ea5bb25fbca5efba433dcf00c7cced65679af2f04728901275c6157',
      },
      switchboard: { id: '', upgradeCap: '' },
      xOracle: {
        id: '0x1478a432123e4b3d61878b629f2c692969fdb375644f1251cd278a4b1e7d7cd6',
        upgradeCap:
          '0x0f928a6b2e26b73330fecaf9b44acfc9800a4a9794d6415c2a3153bc70e3c1f0',
      },
      testCoin: { id: '', upgradeCap: '' },
    },
  },
  spool: {
    // id: '0x7c4fdabe81c31b19a45d1e572a52a539997a90903fbb5bfab71480abe0fa62c3',
    id: '0x1742655fe5872dfa6456673f9e38612a4965e6979e6cd7696a7f1225f28bae21',
    adminCap:
      '0xdd8a047cbbf802bfcde5288b8ef1910965d789cc614da11d39af05fca0bd020a',
    // object:
    //   '0xe87f1b2d498106a2c61421cec75b7b5c5e348512b0dc263949a0e7a3c256571a',
    object:
      '0x1742655fe5872dfa6456673f9e38612a4965e6979e6cd7696a7f1225f28bae21',
    pools: {
      sweth: {
        id: '0xeec40beccb07c575bebd842eeaabb835f77cd3dab73add433477e57f583a6787',
        rewardPoolId:
          '0x957de68a18d87817de8309b30c1ec269a4d87ae513abbeed86b5619cb9ce1077',
      },
      ssui: {
        // id: '0x4f0ba970d3c11db05c8f40c64a15b6a33322db3702d634ced6536960ab6f3ee4',
        id: '0xb9617f83c06ebdeac0a8834782b1015e1cc7ea23739e30c132c4bfb95c37a579',
        rewardPoolId:
          // '0x162250ef72393a4ad3d46294c4e1bdfcb03f04c869d390e7efbfc995353a7ee9',
          '0xc3206071a8d43212efb6e3b5504f2321f8df97ab122b466c0bc7cfdf398dc13a',
      },
      susdc: {
        id: '0x0b5f5f413bd3799e4052c37311966c77f3a4545eb125d2e93e67a68478021918',
        rewardPoolId:
          '0x85ed6ed72ea97c35dbf0cdc7ed6fbc48d8ec15de9b17c74bf4512df8a6d7f166',
      },
      swusdc: {
        // id: '0x4ace6648ddc64e646ba47a957c562c32c9599b3bba8f5ac1aadb2ae23a2f8ca0',
        id: '0xf1b383b9cf2e9f515fc69567df1053098f273849d09cd84b0278a773429bd2b2',
        rewardPoolId:
          // '0xf4268cc9b9413b9bfe09e8966b8de650494c9e5784bf0930759cfef4904daff8',
          '0xc71c53ee6505d928ba15bea4fe4f45d98c9c31eced94b72d00a7827d4b7ba3ff',
      },
      swusdt: {
        // id: '0xcb328f7ffa7f9342ed85af3fdb2f22919e1a06dfb2f713c04c73543870d7548f',
        id: '0xb5567dfa5c7fc17a249e959732664c50713dd8c23db1a11376b27df800c17418',
        rewardPoolId:
          // '0x2c9f934d67a5baa586ceec2cc24163a2f049a6af3d5ba36b84d8ac40f25c4080',
          '0x60768b0687ff0235e376a039709a683e4c436098785e473b67b32dbab47b69ab',
      },
      scetus: {
        id: '0xac1bb13bf4472a637c18c2415fb0e3c1227ea2bcf35242e50563c98215bd298e',
        rewardPoolId:
          '0x6835c1224126a45086fc6406adc249e3f30df18d779ca4f4e570e38716a17f3f',
      },
      safsui: {
        // id: '0xeedf438abcaa6ce4d9625ffca110920592d5867e4c5637d84ad9f466c4feb800',
        id: '0xc568bb4c991258e839aa54802ecda04fcd9838c826bc3b42b40af81b23c458c8',
        rewardPoolId:
          // '0x89255a2f86ed7fbfef35ab8b7be48cc7667015975be2685dd9a55a9a64baf76e',
          '0x389a3cbeda742b918941bb24fd00e077bad3367484394d6234f8209b9a6aa03d',
      },
      shasui: {
        // id: '0xa6148bc1b623e936d39a952ceb5bea79e8b37228a8f595067bf1852efd3c34aa',
        id: '0x93f3f4499bf89f2d05ddc1f8b15f51701a7c6c4d0ac0b9c3bc99462cbbd8e321',
        rewardPoolId:
          // '0x6f3563644d3e2ef13176dbf9d865bd93479df60ccbe07b7e66db57f6309f5a66',
          '0x94cee1be7f5ff34193f3aabef0b14142cb28af4d905fe487a9a7d85a15edb6aa',
      },
      svsui: {
        // id: '0x69ce8e537e750a95381e6040794afa5ab1758353a1a2e1de7760391b01f91670',
        id: '0xa970e9087f80cb59e9299b8e7af7175d977ad6c9af0322aa4440e138fbd7ae00',
        rewardPoolId:
          // '0xbca914adce058ad0902c7f3cfcd698392a475f00dcfdc3f76001d0370b98777a',
          '0x38eee9699c4fc132a6623e54b865f047df4fc6eb83af807300f44e8f4b235ff0',
      },
    },
    config: '',
  },
  borrowIncentive: {
    id: '0x85769d63565ce99c7622f8e336ca1460926ddf29738ad2a39407b5cac29f61fe',
    adminCap:
      '0x56ac8e6f2b360b2b35c0168d72cc6cd17d9592afb83709865cb87af24bb2025b',
    object:
      '0x85769d63565ce99c7622f8e336ca1460926ddf29738ad2a39407b5cac29f61fe',
    query: '0x8e0d00f8ff1199d7c5fe56cea0e901a525daeefff0445a1635ace8282ae3302c',
    incentivePools:
      '0x9d564c93128c6ab0c0d3e050a47f11df0b91494f3bb779bdc1301c1c637f15eb',
    incentiveAccounts:
      '0x09e6040e798246de04941bc79a3ba62d3eca6d7a218cc30f21fb07f478fa2926',
    config:
      '0x43d4ca1dfc90b161c4240facd119e74e4b850cca2957f88c2ec289c9380da064',
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
      '0x595baa3654c297bff84ab7786a2d250f019cefc66e8df8e89fd9d41e02bd30dd',
    referralTiers:
      '0x144350f3db9b46d11b140084cd54e6de0b9c3b8d265ce8059b51d0ef58ea464b',
    tiersTableId:
      '0xeac755a7a8b7798530905ac79e8c114f19d0f130f6eab012954f08faac29c75d',
    // authorizedWitnessList:
    //   '0xf21b0ed043c9bb70842c0129159f4943dbcc3c9ef2f2f808af65f8be25cfd20e',
    authorizedWitnessList:
      '0x9d6223dc52015b8a3986a573590ef2af8f1b8f3e4685513888c052f001b87e7f',
    version:
      '0x3545849eb97723e676a476ec9d4fe5f2eb0eb2c6b78972851114fd4c7ed4639f',
  },
  vesca: {
    id: '0x1158813b32962c2d22888fae257d5f2365b03631f0cd5d5b912ccdf51ff4e2f2',
    object:
      '0x1158813b32962c2d22888fae257d5f2365b03631f0cd5d5b912ccdf51ff4e2f2',
    adminCap:
      '0x8ffa76135c5b85c5fbd73a6448a4a733d826cb63a267ab817656acb77c72d4a5',
    tableId:
      '0x0a0b7f749baeb61e3dfee2b42245e32d0e6b484063f0a536b33e771d573d7246',
    table: '0xd3a4632b1080f7d96e1c2487d4dabf2c1196916937c505a69954ac9f393be8d0',
    treasury:
      '0xafa4b6231e49c15a22d641ce33fda761baaf650fa21899dfa2eb1716146e7306',
    config:
      '0x7cbcb0a342179577a117dfdff974cf1ab765d3b571067bf22ddf5f9e3a667922',
  },
  loyaltyProgram: {
    id: '0xd17bcf8b5a59652c36225d478564a8593ae0ed7d650bcacdda1d6fe179127907',
    object:
      '0xd17bcf8b5a59652c36225d478564a8593ae0ed7d650bcacdda1d6fe179127907',
    rewardPool:
      '0xf9c090492ef476bd542109d0913ffe871cbfa28578b7114eca2a8c0e5671786f',
    userRewardTableId:
      '0x748a80395849ed37db1b0e14f2ab5d1d96458d2359ab3a84eb079d0f4ac7cf2e',
  },
  scoin: {
    id: '0x773dab39c90fe05439b06a2d061795e52a974ff92c2aef90b2ee467acf7f33c8',
    coins: {
      ssui: {
        coinType:
          '0xf569919046f19a0c40b519ecfbb6ca0319698cd5908716c29b62ef56541f298b::scallop_sui::SCALLOP_SUI',
        treasury:
          '0x0e499640a12c38dd9cc44532f5bc5fd1b6da86d2f9a8810357250f4b26e9e5c7',
      },
      scetus: {
        coinType:
          '0x8b71e6d323ed78515af2bead13bf3d0da1562ba4a99234eb7c4f14fd39ef0427::scallop_cetus::SCALLOP_CETUS',
        treasury:
          '0xd786f4b2d26278cc7911a3445b1b085eab60f269ef9dbb6b87e803d52f155003',
      },
      ssca: {
        coinType:
          '0x958428555e778e55918a59eb1c92c77f32b5c554fa3a5e56cd0815086b5072e7::scallop_sca::SCALLOP_SCA',
        treasury:
          '0x5f1c5de1df7341075d119570269b7b452af50afe8363080638f1ae29a554c038',
      },
      swusdc: {
        coinType:
          '0xf5447c4305a486d8c8557559887c2c39449ddb5e748f15d33946d02a1663c158::scallop_wormhole_usdc::SCALLOP_WORMHOLE_USDC',
        treasury:
          '0x471fbab72578bab577263006fe32543b6e76153fffa2bef69affe4bc4934258f',
      },
      swusdt: {
        coinType:
          '0xac781d9f73058ff5e69f9bf8dde32f2e8c71c66d7fe8497fc83b2d9182254b22::scallop_wormhole_usdt::SCALLOP_WORMHOLE_USDT',
        treasury:
          '0x921a4ed4bb4b4f11f51a462c83f4c0f6b60a90e441d1bc0d26d6fd893146bf4d',
      },
      sweth: {
        coinType:
          '0x27d54f43e3eda701be56b82e5756e41c84467cd202f5cf713d5f9e45a9f1b6bc::scallop_wormhole_eth::SCALLOP_WORMHOLE_ETH',
        treasury:
          '0x032b4c8fac94c038dbe986f7587e9b1e4ef580b5ee06d2ef249d85459b7ef05d',
      },
      safsui: {
        coinType:
          '0xb75b46d975d8d80670b53a6bee90baaa8ce2e0b7d397f079447d641eef6b44ad::scallop_af_sui::SCALLOP_AF_SUI',
        treasury:
          '0x21450ef0570ef3d224ffa3b873ab802e439ece7b93cc7efad10ae0c1e3b3fcfe',
      },
      shasui: {
        coinType:
          '0xd973a723874e2c7cde196602a79155a1343a933f8cf87d9b1bb7408bc1acbc58::scallop_ha_sui::SCALLOP_HA_SUI',
        treasury:
          '0xf822fc1402207e47d2e3ba8ff6e1e594bf1de777dc5ebd2744619cd2726e3b0d',
      },
      svsui: {
        coinType:
          '0x97023a317320c4498cc4cd239dd02fd30c28246e5e8f81325d63f2bd8d70f6b3::scallop_v_sui::SCALLOP_V_SUI',
        treasury:
          '0x327114f0bf3559d7e2de10282147ed76a236c7c6775029165c4db09a6062ead6',
      },
      ssbeth: {
        coinType:
          '0xb14f82d8506d139eacef109688d1b71e7236bcce9b2c0ad526abcd6aa5be7de0::scallop_sb_eth::SCALLOP_SB_ETH',
        treasury:
          '0xfd0f02def6358a1f266acfa1493d4707ee8387460d434fb667d63d755ff907ed',
      },
      sfdusd: {
        coinType:
          '0x6711551c1e7652a270d9fbf0eee25d99594c157cde3cb5fbb49035eb59b1b001::scallop_fdusd::SCALLOP_FDUSD',
        treasury:
          '0xdad9bc6293e694f67a5274ea51b596e0bdabfafc585ae6d7e82888e65f1a03e0',
      },
      sdeep: {
        coinType:
          '0xeb7a05a3224837c5e5503575aed0be73c091d1ce5e43aa3c3e716e0ae614608f::scallop_deep::SCALLOP_DEEP',
        treasury:
          '0xc63838fabe37b25ad897392d89876d920f5e0c6a406bf3abcb84753d2829bc88',
      },
      sfud: {
        coinType:
          '0xe56d5167f427cbe597da9e8150ef5c337839aaf46891d62468dcf80bdd8e10d1::scallop_fud::SCALLOP_FUD',
        treasury:
          '0xf25212f11d182decff7a86165699a73e3d5787aced203ca539f43cfbc10db867',
      },
    },
  },
};
