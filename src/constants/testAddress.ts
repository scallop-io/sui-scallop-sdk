import { AddressesInterface } from 'src/types/address';

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
        coinType:
          '0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc::afsui::AFSUI',
        symbol: 'afSUI',
        decimals: 9,
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
        treasury:
          '0x54e81607d636c3520a697b803a99a167fce7ccdf1bad7d210e2941d264515351',
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
      secondaryPriceUpdatePolicyObject:
        '0x624a6f120777bb30e718b86e836c205ef4229448052377dc3d78272a6662b2c0',
      primaryPriceUpdatePolicyVecsetId:
        '0xfb1330aa028ed6a159b742c71b5a79b3b6824cf71efa40ea82b52486ad209264',
      secondaryPriceUpdatePolicyVecsetId:
        '0x4b827acc73f3f53f808dd73a7ee0a60ae61e84322176bece72b26467030b467c',
      supra: {
        registry: '',
        registryCap: '',
        holder: '',
      },
      switchboard: {
        registry:
          '0x9b1b415f384af6af0ff31c22decdc88b3b83d0188cf63ef9c58fd122bca77219',
        registryCap: '',
        registryTableId: '',
        state: '',
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
        lst: {
          afsui: {
            safeId:
              '0xeb685899830dd5837b47007809c76d91a098d52aabbf61e8ac467c59e5cc4610',
            stakedSuiVaultId:
              '0x2f8f6d5da7f13ea37daa397724280483ed062769813b6f31e9788e59cc88994d',
            configId:
              '0x67103edaadcd38b76f5df76d99adcad989260a5f16bfd411a67efbf858b2f7a2',
          },
        },
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
      supra: {
        id: '',
        upgradeCap: '',
      },
      pyth: {
        id: '0xe622909f9252d4ef1737c41ea430ef44203d8f5dc8e01e1b3950a31405bc54eb',
        object:
          '0xe622909f9252d4ef1737c41ea430ef44203d8f5dc8e01e1b3950a31405bc54eb',
        upgradeCap:
          '0xb1f167889643ff766df31745b6e93b92462d8165b0a4f1b095499e15180370f7',
        lst: {
          afsui: {
            id: '0xd45b20f4bbc7ab4b2b3874a4fa38aa440505d8010bba052df914892537e6b418',
            object:
              '0xd45b20f4bbc7ab4b2b3874a4fa38aa440505d8010bba052df914892537e6b418',
          },
        },
      },
      switchboard: {
        id: '0x248f5cb31c12eed6ab8fd4c6176466b982be42ce87e6bf8ff896fb8097a1660d',
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
      },
    },
  },
  spool: {
    id: '0x472fc7d4c3534a8ec8c2f5d7a557a43050eab057aaab853e8910968ddc84fc9f',
    adminCap:
      '0xdd8a047cbbf802bfcde5288b8ef1910965d789cc614da11d39af05fca0bd020a',
    object:
      '0xe87f1b2d498106a2c61421cec75b7b5c5e348512b0dc263949a0e7a3c256571a',
    pools: {
      sweth: {
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
        id: '0x0b5f5f413bd3799e4052c37311966c77f3a4545eb125d2e93e67a68478021918',
        rewardPoolId:
          '0x85ed6ed72ea97c35dbf0cdc7ed6fbc48d8ec15de9b17c74bf4512df8a6d7f166',
      },
      swusdc: {
        id: '0x4ace6648ddc64e646ba47a957c562c32c9599b3bba8f5ac1aadb2ae23a2f8ca0',
        rewardPoolId:
          '0xf4268cc9b9413b9bfe09e8966b8de650494c9e5784bf0930759cfef4904daff8',
      },
      swusdt: {
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
    },
    // version: '',
    // versionCap: '',
    config: '',
  },
  borrowIncentive: {
    id: '0x045811c127a4063d78683ea61fa987b9252a798b0d3ae9e927e25adcbe5549e2',
    adminCap:
      '0xc486afa253646f4d381e81d7f1df8aa4723b845a6bb356f69bad635ffefffe2c',
    object:
      '0x045811c127a4063d78683ea61fa987b9252a798b0d3ae9e927e25adcbe5549e2',
    query: '0xdbc22fe051d384691634cd3b9fe473b09723084a1e4c128728c42e2de3b2228f',
    incentivePools:
      '0xd214b7055554dd65f27a2c74366377dde63e66c498508ef3fc9f7d76a32b4465',
    incentiveAccounts:
      '0x717cd4d3e78e8c45f7570c0857f696f8c7a68248218a258aa49bff99b3ff7175',
    config:
      '0xe5fec608d3a30a1f75b24d2c67d227524075aa6f5ee22e5eccedacd9145b1d9d',
    // version: '',
    // versionCap: '',
  },
  vesca: {
    id: '0x0c7f5568dbd69488437ee95f2d9a028724e1de12432965ff8acca7c67310ba46',
    object:
      '0x0c7f5568dbd69488437ee95f2d9a028724e1de12432965ff8acca7c67310ba46',
    adminCap:
      '0x4d105b16467acca81d18c132cdd1a3cee159920a86c1ef4bdbf2e8d7878500c5',
    tableId:
      '0x5477d43c9f75faea312c0f02dd48b4e03d9cbf2b1a5436ddffb5edefbea18ff2',
    table: '0x06f763060ea5da3d639fb56df70674490a8354511cfe61584062aafd83b1940d',
    treasury:
      '0x934919cc31fa89b67578039bb10d5518fa23c50bc8f78500f1d1a718407a0a71',
    config:
      '0x38d3f7a1fa5071226535d4d8bfca8ccab3d24871402df1be669d7d5e9e3e9cb4',
    subsTable:
      '0x4756b716670ff62760b22bebed73c6eb2c2cb118674a2eea3a56ebea9e27ae76',
    subsTableId:
      '0xe9fa5d464d28fe30ad060ea32af577c68c9e82aca48ad1f10f13f35338472778',
    subsWhitelist:
      '0xfc72adae643da4f2fe080adc1e2cca981eadcb518facb02324eeaab169752ffb',
  },
  referral: {
    id: '0x709ce9b97a63c6815c385ffd31c354dcd8f760984610581be23b838af4c6f60b',
    object:
      '0x5658d4bf5ddcba27e4337b4262108b3ad1716643cac8c2054ac341538adc72ec',
    adminCap:
      '0xc5dc06b9074291259f2cac460c940012c781c4430e42125c541cc43101c3bcbd',
    referralBindings:
      '0xf63299d58789d99de94092b9011323466e55ca0c1ea1a7a3786a589af46e1c09',
    bindingTableId:
      '0x1c8202b17267ec8d6cf97ca013615354181a04f179570e42601ff2dae19294b1',
    referralRevenuePool:
      '0x6abd852caf90769c1b185cdf636d841673fa95528f0550f018b8a138bd283c07',
    revenueTableId:
      '0x595baa3654c297bff84ab7786a2d250f019cefc66e8df8e89fd9d41e02bd30dd',
    referralTiers:
      '0x962cb903d8d7346190c5204785ccbb91b61086aa764f674c8145df82335cf83e',
    tiersTableId:
      '0xeac755a7a8b7798530905ac79e8c114f19d0f130f6eab012954f08faac29c75d',
    authorizedWitnessList:
      '0xf21b0ed043c9bb70842c0129159f4943dbcc3c9ef2f2f808af65f8be25cfd20e',
    version:
      '0x1bd4b7285f72e11c316b828c7c47b3f4da18dcec9f9b3dba6d8629cbb6f93e5e',
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
  veScaLoyaltyProgram: {
    id: '0x120dd97cb2be154d3c0e65e697594bf9cd4a7ce36f0eea0f1d70601f4a0b83eb',
    object:
      '0x120dd97cb2be154d3c0e65e697594bf9cd4a7ce36f0eea0f1d70601f4a0b83eb',
    adminCap:
      '0x9877e840e32705b80cb375115d5ff9dcd58f0c68204b7e15aa431b8cb547aaca',
    veScaRewardPool:
      '0x1b4f09e30dbb6e1442f6710c52568295d120cc4ff2ae02449a11070b3faf2c86',
    veScaRewardTableId:
      '0xb63dc27b258ae4066544f58a987931a5a2f78ebe872319381b62eb65c3ac5560',
  },
  scoin: {
    id: '0x826a4934bee9487e558eed603cf42f30cdc4321d6f31083930791b95f903b9f9',
    coins: {
      ssui: {
        coinType:
          '0x88618204de2dfdc2597681a8441ee726b0dc13494c41e319c3264eb7b35fea90::scallop_sui::SCALLOP_SUI',
        treasury:
          '0x03f1d94a40bd9f5d556bacb5c5245732b185572f6a29b36ad8b555d9a8a24f09',
        metaData:
          '0xfc9f2b2aa98be8d2dc95603cd531bdb38bcb894c82929d435d84a1985282e838',
        symbol: 'sSUI',
      },
      ssca: {
        coinType:
          '0x9f64a180373a6b66595025ae16a4ab701f0af1dd5c7ce1ac91dc112e52c2a3f8::scallop_sca::SCALLOP_SCA',
        treasury:
          '0x1b05d2cd8b20dba19da073a54195fc52d2f438ea19dea0713bae7a7dab308199',
        metaData:
          '0xf1bf00be79b48c064f99fa5d1d4389e44776a269888b57b2f9a923080882ea73',
        symbol: 'sSCA',
      },
      safsui: {
        coinType:
          '0xe66ae8fd59e37f78e355dafb130b7c167ca4ec8792a424031a1a1eac96244ada::scallop_af_sui::SCALLOP_AF_SUI',
        treasury:
          '0xc57357a64593aa54bc23d7936129119b86876a200107481578f304762217061a',
        metaData:
          '0x42179b69f82ea26e3763345ee0fb1cea8b1bd355168b3241ceb727ec82bb0688',
        symbol: 'safSUI',
      },
      susdc: {
        coinType:
          '0x55ed015f9f006c0c96ad36ebe3b3570d088e8498f52defea48e5634c110e485c::scallop_usdc::SCALLOP_USDC',
        treasury:
          '0x6ef82ef94472dcb8c2cdeac8df38874024c08570ca165986ba56d1e38fe0c0a3',
        metaData:
          '0xad94e42c05ab0eb54c9d9a1bcf3689bcd330710d6b300956213aa35387b727c9',
        symbol: 'sUSDC',
      },
      sdeep: {
        coinType:
          '0x34f0a2e793e1f79ceac72cfe3bb95f65541da449418289ccd12922d16140c882::scallop_deep::SCALLOP_DEEP',
        treasury:
          '0x71d41465cf2d16fa0206126526bebdf65c8871d1fcfbd0c2237db2306afd67ba',
        metaData:
          '0x63e749a506bbae17ca63fd41a270e2b9b0a08dade1964bfa620ecba94c8be4f9',
        symbol: 'sDEEP',
      },
      sfud: {
        coinType:
          '0x3b23c05f917052255a0b16a534dbd4446911aa4a30bd3497cdf5b736551e7ef8::scallop_fud::SCALLOP_FUD',
        treasury:
          '0x858c492d51425b922c040c1a389e185b3b00d565e7d72ead1a81dc733104660d',
        metaData:
          '0x0cd9fb845663dd5e1f7c48a321ab1c523a54c70243711a5a115523945396e54f',
        symbol: 'sFUD',
      },
    },
  },
};

export const TEST_WHITELIST = {
  lending: new Set([
    'usdc',
    // 'sbeth',
    // 'sbusdt',
    // 'sbwbtc',
    // 'weth',
    // 'wbtc',
    // 'wusdc',
    // 'wusdt',
    'sui',
    // 'wapt',
    // 'wsol',
    // 'cetus',
    'afsui',
    // 'hasui',
    // 'vsui',
    'sca',
    'fud',
    'deep',
    // 'fdusd',
    // 'blub',
    // 'musd',
    // 'ns',
    // 'usdy',
    // 'wal',
  ]),
  collateral: new Set([
    'usdc',
    // 'sbeth',
    // 'sbusdt',
    // 'sbwbtc',
    // 'weth',
    // 'wbtc',
    // 'wusdc',
    // 'wusdt',
    'sui',
    // 'wapt',
    // 'wsol',
    // 'cetus',
    'afsui',
    // 'hasui',
    // 'vsui',
    'sca',
    // 'fdusd',
    // 'usdy',
    // 'wal',
    'deep',
  ]),
  borrowing: new Set([
    'usdc',
    // 'sbeth',
    // 'sbusdt',
    // 'sbwbtc',
    // 'weth',
    // 'wbtc',
    // 'wusdc',
    // 'wusdt',
    'sui',
    // 'wapt',
    // 'wsol',
    // 'cetus',
    'afsui',
    // 'hasui',
    // 'vsui',
    'sca',
    'fud',
    'deep',
    // 'fdusd',
    // 'blub',
    // 'musd',
    // 'ns',
    // 'usdy',
    // 'wal',
  ]),
  packages: new Set([
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
  ]),
  spool: new Set([
    'susdc',
    // 'sweth',
    'ssui',
    // 'swusdc',
    // 'swusdt',
    // 'scetus',
    // 'safsui',
    // 'shasui',
    // 'svsui',
  ]),
  scoin: new Set([
    'susdc',
    // 'ssbeth',
    // 'ssbusdt',
    // 'ssbwbtc',
    'ssui',
    // 'swusdc',
    // 'swusdt',
    'safsui',
    // 'shasui',
    // 'svsui',
    // 'sweth',
    'ssca',
    // 'scetus',
    // 'swsol',
    // 'swbtc',
    'sdeep',
    'sfud',
    // 'sfdusd',
    // 'sblub',
    // 'smusd',
    // 'sns',
    // 'susdy',
    // 'swal',
  ]),
  suiBridge: new Set(['sbeth', 'sbusdt', 'sbwbtc']),
  wormhole: new Set(['wusdc', 'wusdt', 'weth', 'wbtc', 'wapt', 'wsol']),
  oracles: new Set(['pyth', 'supra', 'switchboard']),
  pythEndpoints: new Set(['https://hermes.pyth.network']),
  deprecated: new Set(['wapt', 'wusdc', 'wusdt', 'weth', 'wbtc']),
  borrowIncentiveRewards: new Set(['mpoints']),
  rewardsAsPoint: new Set(['mpoints']),
  emerging: new Set(['wal', 'deep', 'sca', 'cetus']),
};

export const TEST_POOL_ADDRESSES = {
  usdc: {
    coinName: 'usdc',
    symbol: 'USDC',
    lendingPoolAddress:
      '0x13319d295914b390b22484373f20f822bca10314c34c227ae6e28df3d9aa8e01',
    collateralPoolAddress:
      '0x2fdcf63682577f6bfdd4296500067543ba9877d5d5e41ebd9e51b97ab071ce69',
    borrowDynamic:
      '0x7fd0660f0102789ad039542165c6cbc2d90ba3c1d9dbd4ac4ae8804d80817542',
    interestModel:
      '0xd4e7b06a79f63706523167f055296db641b0f8ddd6734c05e205f2de0fcefdd0',
    riskModel:
      '0x19e5993350186f192ffeb2cba0650b04c291390e149c8ac9b324ecf394daaa1a',
    borrowFeeKey: '',
    supplyLimitKey:
      '0x4be9ae54ac4d320f4f9c14cae78cb85c8e0e67791dd9bdba6d2db20614a28a24',
    borrowLimitKey:
      '0x6b01093cba95b835181f00e3a2c31ed8dfc8d64fe3db0fb80933a09f66e1ccf1',
    isolatedAssetKey: '',
    isIsolated: false,
    spool: '0x0b5f5f413bd3799e4052c37311966c77f3a4545eb125d2e93e67a68478021918',
    spoolReward:
      '0x85ed6ed72ea97c35dbf0cdc7ed6fbc48d8ec15de9b17c74bf4512df8a6d7f166',
    sCoinType:
      '0x55ed015f9f006c0c96ad36ebe3b3570d088e8498f52defea48e5634c110e485c::scallop_usdc::SCALLOP_USDC',
    sCoinTreasury:
      '0x6ef82ef94472dcb8c2cdeac8df38874024c08570ca165986ba56d1e38fe0c0a3',
    sCoinMetadataId:
      '0x763a21eba338e00bc684aaad80491c89eea5f247b59c47df45b17610c9ad58f2',
    sCoinSymbol: 'sUSDC',
    sCoinName: 'susdc',
    coinMetadataId:
      '0x69b7a7c3c200439c1b5f3b19d7d495d5966d5f08de66c69276152f8db3992ec6',
    coinType:
      '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
    spoolName: 'susdc',
    decimals: 6,
    pythFeed:
      'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
    pythFeedObjectId:
      '0x5dec622733a204ca27f5a90d8c2fad453cc6665186fd5dff13a83d0b6c9027ab',
    flashloanFeeObject:
      '0x289c770f54b26a4175d57cc6061e3d05f96e52d352cb7c0a51e2e3bacb2aee30',
  },
  sui: {
    coinName: 'sui',
    symbol: 'SUI',
    lendingPoolAddress:
      '0xeb86ad67543c1ac2c4cbaf178d38a45ab27c2e69d60f0f8badd83f563f012c3c',
    collateralPoolAddress:
      '0xcba7bb07d4d3ce01d81e71d9def680aa8b417347bfd7834aee8fc3b85b61c9a1',
    borrowDynamic:
      '0xd47c2fd3dbb95ed06e5da92f6b99611ba94a36efa6a13d9b33b02519761cc84e',
    interestModel:
      '0x4742bb49aa49ab4e5d9dfa119cddc027d1b7811ac42ca1ce794818d4a4da68e7',
    riskModel:
      '0x6dc356e829cfca2d79f0d68a79b5ddd5296ad0c955a38e2fc397485e2b629367',
    borrowFeeKey: '',
    supplyLimitKey:
      '0x0602418e66fb7a73fa997077bd66f248ad5b090d43344a14b9f1db598ecc1d47',
    borrowLimitKey:
      '0x2b33a7efdcf6a6df24f4d8a356dd52f58d75bc023c3f171d99502d4d008b53f0',
    isolatedAssetKey: '',
    isIsolated: false,
    spool: '0xb9617f83c06ebdeac0a8834782b1015e1cc7ea23739e30c132c4bfb95c37a579',
    spoolReward:
      '0xc3206071a8d43212efb6e3b5504f2321f8df97ab122b466c0bc7cfdf398dc13a',
    sCoinType:
      '0x88618204de2dfdc2597681a8441ee726b0dc13494c41e319c3264eb7b35fea90::scallop_sui::SCALLOP_SUI',
    sCoinTreasury:
      '0x03f1d94a40bd9f5d556bacb5c5245732b185572f6a29b36ad8b555d9a8a24f09',
    sCoinMetadataId: '',
    sCoinSymbol: 'sSUI',
    sCoinName: 'ssui',
    coinMetadataId:
      '0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3',
    coinType:
      '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
    spoolName: 'ssui',
    decimals: 9,
    pythFeed:
      '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
    pythFeedObjectId:
      '0x801dbc2f0053d34734814b2d6df491ce7807a725fe9a01ad74a07e9c51396c37',
    flashloanFeeObject:
      '0x27614284a8f0a699ffd35aae8f2572c937ec76771cb21b0d7930ec4491a76ed4',
  },
  sca: {
    coinName: 'sca',
    symbol: 'SCA',
    lendingPoolAddress:
      '0xd08ef85bc753616ce0f1e3ac01bbc8bd1ee53e03b1e82aaa9690db5cd285ef4c',
    collateralPoolAddress:
      '0x4f59b8ef2cdd195830890cf0c01e29c159e48a6a6c766c64fd4b26cfa9ee58c6',
    borrowDynamic:
      '0x7f6e11fbd32b5d0223f03bfda67a5b48c551a09cfff88edc187591f9a4b0ab10',
    interestModel:
      '0xcb10daf0fee6f416463444f5b47aac0f0197a889bc60be2c4f90916f6a8d2faa',
    riskModel:
      '0x043f21a35bd1e1060a7c579db46e10cfd039d0b75d6bfd758de97b60434ae708',
    borrowFeeKey: '',
    supplyLimitKey:
      '0x8dd938856b972a10ea27ecab2af7ed78e48fc5f6ccedaf2b2119959f747dc2e3',
    borrowLimitKey:
      '0x04c7de61c5b42972f9bf6a8b1848e5fea2d037ee8deba81741ecd4a70aa80d30',
    isolatedAssetKey: '',
    isIsolated: false,
    spool: '',
    spoolReward: '',
    sCoinType:
      '0x9f64a180373a6b66595025ae16a4ab701f0af1dd5c7ce1ac91dc112e52c2a3f8::scallop_sca::SCALLOP_SCA',
    sCoinTreasury:
      '0x1b05d2cd8b20dba19da073a54195fc52d2f438ea19dea0713bae7a7dab308199',
    sCoinMetadataId: '',
    sCoinSymbol: 'sSCA',
    sCoinName: 'ssca',
    coinMetadataId:
      '0x5d26a1e9a55c88147ac870bfa31b729d7f49f8804b8b3adfdf3582d301cca844',
    coinType:
      '0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA',
    spoolName: 'ssca',
    decimals: 9,
    pythFeed:
      '7e17f0ac105abe9214deb9944c30264f5986bf292869c6bd8e8da3ccd92d79bc',
    pythFeedObjectId:
      '0xf6de1d3279a269a597d813cbaca59aa906543ab9a8c64e84a4722f1a20863985',
    flashloanFeeObject:
      '0xe04e46471754b6f48d81c549ecfec09de02733715a63bec02364c6ac7c4dd2dc',
  },
  fud: {
    coinName: 'fud',
    symbol: 'FUD',
    lendingPoolAddress:
      '0xc8a078d15ee7bbff49a14835f36951833d2d55c91ffd2972251dadbff8045ca8',
    collateralPoolAddress: '',
    borrowDynamic:
      '0x345a2fa0fe5d5d704fd8ad609a9b7529f22e3cda738ad26756ad2a85e5d43777',
    interestModel:
      '0xc84a22d8bca58e5f05673d1de2a7406b1b7bc9dcd15fd848ba6555c7ecab9d83',
    borrowFeeKey: '',
    supplyLimitKey:
      '0xf98419aecc37a3c5de716f8ec590f8991a5be34da72ce1a2da09531ff45adf7d',
    borrowLimitKey:
      '0x3d928a001c453c50004baa54e14b0a0e1b0907d9c613dfd76064fd7ed4e8beb8',
    isolatedAssetKey: '',
    isIsolated: false,
    spool: '',
    spoolReward: '',
    sCoinType:
      '0x3b23c05f917052255a0b16a534dbd4446911aa4a30bd3497cdf5b736551e7ef8::scallop_fud::SCALLOP_FUD',
    sCoinTreasury:
      '0x858c492d51425b922c040c1a389e185b3b00d565e7d72ead1a81dc733104660d',
    sCoinMetadataId: '',
    sCoinSymbol: 'sFUD',
    sCoinName: 'sfud',
    coinMetadataId:
      '0x01087411ef48aaac1eb6e24803213e3a60a03b147dac930e5e341f17a85e524e',
    coinType:
      '0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1::fud::FUD',
    spoolName: 'sfud',
    decimals: 5,
    pythFeed:
      '6a4090703da959247727f2b490eb21aea95c8684ecfac675f432008830890c75',
    pythFeedObjectId:
      '0x4531c3ed0d22f21f5fce882905372006c9aafa30f01db03b789e95a6c50de7b2',
    flashloanFeeObject:
      '0x1ddda368a5f37d7b8c53879cb333ccfd520fc4a3e2fc98b9b5fdacd1a5945d5a',
  },
  deep: {
    coinName: 'deep',
    symbol: 'DEEP',
    lendingPoolAddress:
      '0xfb8e4f68c9b14034da7f1f4703013dda69ebbb4578f835825bcf92ab89c3b5ae',
    collateralPoolAddress: '',
    borrowDynamic:
      '0xbf983b12a8707b174c0b037096ba2fbf1b30e6efb9cce14fc35207de0a696f79',
    interestModel:
      '0xb7f04cd3aaaefe671a79f9aed8646ae085a7e6812c1604044977c9355e0769c8',
    borrowFeeKey: '',
    supplyLimitKey:
      '0x599528fdfdc253e90dfd0acf4f4a166b391e2aac1ca6528abbff63225b548fee',
    borrowLimitKey:
      '0xf4217e8ef9d9c32e8992092e910a77535a8124c19b8a762a673f227f5f765a4e',
    isolatedAssetKey: '',
    isIsolated: false,
    spool: '',
    spoolReward: '',
    sCoinType:
      '0x34f0a2e793e1f79ceac72cfe3bb95f65541da449418289ccd12922d16140c882::scallop_deep::SCALLOP_DEEP',
    sCoinTreasury:
      '0x71d41465cf2d16fa0206126526bebdf65c8871d1fcfbd0c2237db2306afd67ba',
    sCoinMetadataId: '',
    sCoinSymbol: 'sDEEP',
    sCoinName: 'sdeep',
    coinMetadataId:
      '0x6e60b051a08fa836f5a7acd7c464c8d9825bc29c44657fe170fe9b8e1e4770c0',
    coinType:
      '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP',
    spoolName: 'sdeep',
    decimals: 6,
    pythFeed:
      '29bdd5248234e33bd93d3b81100b5fa32eaa5997843847e2c2cb16d7c6d9f7ff',
    pythFeedObjectId:
      '0x8c7f3a322b94cc69db2a2ac575cbd94bf5766113324c3a3eceac91e3e88a51ed',
    flashloanFeeObject:
      '0xd54dfb677e9e011e2451375a7a2e318b4f2225c2a0b369bde0afcef8cbb1a863',
  },
  afsui: {
    coinName: 'afsui',
    symbol: 'afSUI',
    lendingPoolAddress:
      '0x8eb75cd4c5050c4c9950f11694bb32b644706d24b9129981df3b52d2080ad45d',
    collateralPoolAddress:
      '0x48c5455eb1a9f1422c617a89a41927e166cfb49b829100980d4369f9f079d75c',
    borrowDynamic:
      '0x8f5d749372526ef651b6ba6ffede9bf17b8a96f90cda2a64893366a1d5c89491',
    interestModel:
      '0x9e82e24542804156386df51ddce8399fca0981a77e710542847f981febf231e9',
    riskModel:
      '0xfe1b5c5a883d8693effb11b35965538f9777e3c3d89298db2b57252916df14bd',
    borrowFeeKey:
      '0xabc6422db2d4ee01635ddaeaa44ba68370eebd785d2c4632515f841ae9bc47d9',
    supplyLimitKey:
      '0x61a2054eb37f543c0d774da57f2c9542aad8d79a197f748ac08ef5df6cc47028',
    borrowLimitKey:
      '0x4459498a043872cd107ea917493fee0baf2d37a273c7538e1d6581cc61b92af8',
    isolatedAssetKey: '',
    isIsolated: false,
    spool: '0xeedf438abcaa6ce4d9625ffca110920592d5867e4c5637d84ad9f466c4feb800',
    spoolReward:
      '0x89255a2f86ed7fbfef35ab8b7be48cc7667015975be2685dd9a55a9a64baf76e',
    sCoinType:
      '0xe66ae8fd59e37f78e355dafb130b7c167ca4ec8792a424031a1a1eac96244ada::scallop_af_sui::SCALLOP_AF_SUI',
    sCoinTreasury:
      '0xc57357a64593aa54bc23d7936129119b86876a200107481578f304762217061a',
    sCoinMetadataId:
      '0x42179b69f82ea26e3763345ee0fb1cea8b1bd355168b3241ceb727ec82bb0688',
    sCoinSymbol: 'safSUI',
    sCoinName: 'safsui',
    coinMetadataId:
      '0x2f9217f533e51334873a39b8026a4aa6919497b47f49d0986a4f1aec66f8a34d',
    coinType:
      '0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc::afsui::AFSUI',
    spoolName: 'safsui',
    decimals: 9,
    pythFeed:
      '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
    pythFeedObjectId:
      '0x801dbc2f0053d34734814b2d6df491ce7807a725fe9a01ad74a07e9c51396c37',
    flashloanFeeObject:
      '0xac87fde83d434554ec300c1334c9a622aa5b59e82a04334dc99e1cc1f75d4eae',
  },
};
