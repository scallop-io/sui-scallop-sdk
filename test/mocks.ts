export const ADDRESS_INTERFACE = {
  mainnet: {
    core: {
      version:
        '0x07871c4b3c847a0f674510d4978d5cf6f960452795e8ff6f189fd2088a3f6ac7',
      versionCap:
        '0x590a4011cb649b3878f3ea14b3a78674642a9548d79b7e091ef679574b158a07',
      object:
        '0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf',
      market:
        '0xa757975255146dc9686aa823b7838b507f315d704f428cbadad2f4ea061939d9',
      adminCap:
        '0x09689d018e71c337d9db6d67cbca06b74ed92196103624028ccc3ecea411777c',
      coinDecimalsRegistry:
        '0x200abe9bf19751cc566ae35aa58e2b7e4ff688fc1130f8d8909ea09bc137d668',
      obligationAccessStore:
        '0x733e30b7c94d619d78cb8f5bc4bfbb759ced9a531239028caabb2474e5be59c9',
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
        cetus: {
          id: '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b',
          metaData:
            '0x4c0dce55eff2db5419bbd2d239d1aa22b4a400c01bbb648b058a9883989025da',
          treasury: '',
          coinType:
            '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
          symbol: 'CETUS',
          decimals: 9,
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
          coinType:
            '0x3a5143bb1196e3bcdfab6203d1683ae29edd26294fc8bfeafe4aaa9d2704df37::coin::COIN',
          symbol: 'wAPT',
          decimals: 8,
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
          coinType:
            '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN',
          symbol: 'wSOL',
          decimals: 8,
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
          coinType:
            '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN',
          symbol: 'wBTC',
          decimals: 8,
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
          coinType:
            '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
          symbol: 'wETH',
          decimals: 8,
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
          coinType:
            '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
          symbol: 'wUSDC',
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
        wusdt: {
          id: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c',
          metaData:
            '0xfb0e3eb97dd158a5ae979dddfa24348063843c5b20eb8381dd5fa7c93699e45c',
          treasury: '',
          coinType:
            '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
          symbol: 'wUSDT',
          decimals: 6,
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
        hasui: {
          id: '0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d',
          metaData:
            '0x2c5f33af93f6511df699aaaa5822d823aac6ed99d4a0de2a4a50b3afa0172e24',
          treasury: '',
          coinType:
            '0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI',
          symbol: 'haSUI',
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
        vsui: {
          id: '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55',
          metaData:
            '0xabd84a23467b33854ab25cf862006fd97479f8f6f53e50fe732c43a274d939bd',
          treasury: '',
          coinType:
            '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT',
          symbol: 'vSUI',
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
        sbeth: {
          id: '0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29',
          metaData:
            '0x89b04ba87f8832d4d76e17a1c9dce72eb3e64d372cf02012b8d2de5384faeef0',
          treasury: '',
          coinType:
            '0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29::eth::ETH',
          symbol: 'sbETH',
          decimals: 8,
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
          coinType:
            '0xf16e6b723f242ec745dfd7634ad072c42d5c1d9ac9d62a39c381303eaa57693a::fdusd::FDUSD',
          symbol: 'FDUSD',
          decimals: 6,
          oracle: {
            supra: '',
            switchboard: '',
            pyth: {
              feed: 'ccdc1a08923e2e4f4b1e6ea89de6acbc5fe1948e9706f5604b8cb50bc1ed3979',
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
        sbusdt: {
          id: '0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068',
          metaData:
            '0xda61b33ac61ed4c084bbda65a2229459ed4eb2185729e70498538f0688bec3cc',
          treasury: '',
          coinType:
            '0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT',
          symbol: 'sbUSDT',
          decimals: 6,
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
        blub: {
          id: '0xfa7ac3951fdca92c5200d468d31a365eb03b2be9936fde615e69f0c1274ad3a0',
          metaData:
            '0xac32b519790cae96c3317457d903d61d04f1bc8f7710096d80fcba72c7a53703',
          treasury: '',
          coinType:
            '0xfa7ac3951fdca92c5200d468d31a365eb03b2be9936fde615e69f0c1274ad3a0::BLUB::BLUB',
          symbol: 'BLUB',
          decimals: 2,
          oracle: {
            supra: '',
            switchboard: '',
            pyth: {
              feed: '5fc11ffe4975b624be495be038da30e30bee2004d8ae6282b5364577ef4ca92c',
              feedObject:
                '0x246658c3324f2477568c78cca622518fbc6969a004b841d81409d24a7ec39b18',
            },
          },
        },
        sbwbtc: {
          id: '0xaafb102dd0902f5055cadecd687fb5b71ca82ef0e0285d90afde828ec58ca96b',
          metaData:
            '0x53e1cae1ad70a778d0b450d36c7c2553314ca029919005aad26945d65a8fb784',
          treasury: '',
          coinType:
            '0xaafb102dd0902f5055cadecd687fb5b71ca82ef0e0285d90afde828ec58ca96b::btc::BTC',
          symbol: 'sbwBTC',
          decimals: 8,
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
        musd: {
          id: '0xe44df51c0b21a27ab915fa1fe2ca610cd3eaa6d9666fe5e62b988bf7f0bd8722',
          metaData:
            '0xc154abd271b24032a2c80d96c1b82109490bb600ed189ef881d8c9467ed44a4f',
          treasury: '',
          coinType:
            '0xe44df51c0b21a27ab915fa1fe2ca610cd3eaa6d9666fe5e62b988bf7f0bd8722::musd::MUSD',
          symbol: 'mUSD',
          decimals: 9,
          oracle: {
            supra: '',
            switchboard: '',
            pyth: {
              feed: '2ee09cdb656959379b9262f89de5ff3d4dfed0dd34c072b3e22518496a65249c',
              feedObject:
                '0x72fbf053d6009a40cff74d9708592bd7b86673a0e7b252077e1aa53390976584',
            },
          },
        },
        ns: {
          id: '0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178',
          metaData:
            '0x279adec041f8ec5c2d419abf2c32713ae7930a9a3a1ff244c88e5ceced40db6e',
          treasury: '',
          coinType:
            '0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS',
          symbol: 'NS',
          decimals: 6,
          oracle: {
            supra: '',
            switchboard: '',
            pyth: {
              feed: 'bb5ff26e47a3a6cc7ec2fce1db996c2a145300edc5acaabe43bf9ff7c5dd5d32',
              feedObject:
                '0xc6352e1ea55d7b5acc3ed690cc3cdf8007978071d7bfd6a189445018cfb366e0',
            },
          },
        },
        usdy: {
          id: '0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb',
          metaData:
            '0xd8dd6cf839e2367de6e6107da4b4361f44798dd6cf26d094058d94e4cee25e36',
          treasury: '',
          coinType:
            '0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY',
          symbol: 'USDY',
          decimals: 6,
          oracle: {
            supra: '',
            switchboard: '',
            pyth: {
              feed: 'e3d1723999820435ebab53003a542ff26847720692af92523eea613a9a28d500',
              feedObject:
                '0x773cb390165e227cbd5bd924edaeff7d33b1b78aac045c4903ed9be7e711741a',
            },
          },
        },
        wal: {
          id: '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59',
          metaData:
            '0xcf8a31804ae40cb3e7183fe57320f87467a7750d4fa701bca1ffbb1edd37781e',
          treasury: '',
          coinType:
            '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL',
          symbol: 'WAL',
          decimals: 9,
          oracle: {
            supra: '',
            switchboard: '',
            pyth: {
              feed: 'eba0732395fae9dec4bae12e52760b35fc1c5671e2da8b449c9af4efe5d54341',
              feedObject:
                '0xeb7e669f74d976c0b99b6ef9801e3a77716a95f1a15754e0f1399ce3fb60973d',
            },
          },
        },
        haedal: {
          id: '0x3a304c7feba2d819ea57c3542d68439ca2c386ba02159c740f7b406e592c62ea',
          metaData:
            '0xcc89fcc22f0d13de3688b94fa16d64a22079186a941914280c67101ff754263c',
          treasury: '',
          coinType:
            '0x3a304c7feba2d819ea57c3542d68439ca2c386ba02159c740f7b406e592c62ea::haedal::HAEDAL',
          symbol: 'HAEDAL',
          decimals: 9,
          oracle: {
            supra: '',
            switchboard: '',
            pyth: {
              feed: 'e67d98cc1fbd94f569d5ba6c3c3c759eb3ffc5d2b28e64538a53ae13efad8fd1',
              feedObject:
                '0xbc98681c15de1ca1b80a8e26500d43c77f7113368b024de1bf490afcb0387109',
            },
          },
        },
      },
      oracles: {
        xOracle:
          '0x93d5bf0936b71eb27255941e532fac33b5a5c7759e377b4923af0a1359ad494f',
        xOracleCap:
          '0x1edeae568fde99e090dbdec4bcdbd33a15f53a1ce1f87aeef1a560dedf4b4a90',
        primaryPriceUpdatePolicyObject:
          '0x56e48a141f20a3a6a6d3fc43e58b01fc63f756c08224870e7890c80ec9d2afee',
        secondaryPriceUpdatePolicyObject:
          '0xef4d9430ae42c1b24199ac55e87ddd7262622447ee3c7de8868efe839b3d8705',
        primaryPriceUpdatePolicyVecsetId:
          '0xc22c9d691ee4c780de09db91d8b487d863211ebf08720772144bcf716318826c',
        secondaryPriceUpdatePolicyVecsetId:
          '0x3b184ff859f5de30eeaf186898e5224925be6bb6d2baa74347ef471a8cd1c0d3',
        supra: { registry: '', registryCap: '', holder: '' },
        switchboard: {
          registry: '',
          registryCap: '',
          registryTableId: '',
          state: '',
        },
        pyth: {
          registry:
            '0x352c9600e69ff6469f9fc7cd1d0cd5f88264caa5f8908102a223ce663fbb360c',
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
          id: '0x83bbe0b3985c5e3857803e2678899b03f3c4a31be75006ab03faf268c014ce41',
          upgradeCap:
            '0x38527d154618d1fd5a644b90717fe07cf0e9f26b46b63e9568e611a3f86d5c1a',
        },
        protocolWhitelist: {
          id: '0x4c262d9343dac53ecb28f482a2a3f62c73d0ebac5b5f03d57383d56ff219acdf',
          upgradeCap:
            '0x4a5e88a75039b00988f633f811f58117f31b8627a46bf822aa114d9010049449',
        },
        query: {
          id: '0xbb6e3ffa494b543aa028cf8d3fb894be1a678b5fe710f7bb959df0e3c1acc0e8',
          upgradeCap:
            '0x14220f035f4cfc2ce442c30703fb44d24f00846eb7077907a231a56051a1d9b2',
        },
        supra: { id: '', upgradeCap: '' },
        pyth: {
          id: '0x1cf913c825c202cbbb71c378edccb9c04723fa07a73b88677b2ef89c6e203a85',
          object:
            '0x1cf913c825c202cbbb71c378edccb9c04723fa07a73b88677b2ef89c6e203a85',
          upgradeCap:
            '0xb1f167889643ff766df31745b6e93b92462d8165b0a4f1b095499e15180370f7',
        },
        switchboard: { id: '', upgradeCap: '' },
        xOracle: {
          id: '0x897ebc619bdb4c3d9e8d86fb85b86cfd5d861b1696d26175c55ed14903a372f6',
          object:
            '0x897ebc619bdb4c3d9e8d86fb85b86cfd5d861b1696d26175c55ed14903a372f6',
          upgradeCap:
            '0x0f928a6b2e26b73330fecaf9b44acfc9800a4a9794d6415c2a3153bc70e3c1f0',
        },
        testCoin: { id: '', upgradeCap: '' },
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
      version: '',
      versionCap: '',
      config: '',
    },
    borrowIncentive: {
      id: '0x35241d7ff3bf163c2fbd3c2b11fb5710d3946c56ccc9c80813a1f8c6f6acdd67',
      adminCap:
        '0xc486afa253646f4d381e81d7f1df8aa4723b845a6bb356f69bad635ffefffe2c',
      object:
        '0x002875153e09f8145ab63527bc85c00f2bd102e12f9573c47f8cdf1a1cb62934',
      query:
        '0x529edc54a3dce2207703ceebbccb0ac14133f7825c1f528775ba0d85a4063489',
      incentivePools:
        '0x6547e143d406b5ccd5f46aae482497de279cc1a68c406f701df70a05f9212ab4',
      incentiveAccounts:
        '0xc4701fdbc1c92f9a636d334d66012b3027659e9fb8aff27279a82edfb6b77d02',
      config:
        '0xdf5d04b4691cc67e82fd4db8394d89ff44823a9de29716c924f74bb4f11cc1f7',
      version: '',
      versionCap: '',
    },
    vesca: {
      id: '0x18ff254b07856588796b3a97e447a1e504c48f58b309437cd8f2c397ecc2fc21',
      object:
        '0xcfe2d87aa5712b67cad2732edb6a2201bfdf592377e5c0968b7cb02099bd8e21',
      adminCap:
        '0x4d105b16467acca81d18c132cdd1a3cee159920a86c1ef4bdbf2e8d7878500c5',
      tableId:
        '0x0a0b7f749baeb61e3dfee2b42245e32d0e6b484063f0a536b33e771d573d7246',
      table:
        '0xd3a4632b1080f7d96e1c2487d4dabf2c1196916937c505a69954ac9f393be8d0',
      treasury:
        '0xafa4b6231e49c15a22d641ce33fda761baaf650fa21899dfa2eb1716146e7306',
      config:
        '0x7cbcb0a342179577a117dfdff974cf1ab765d3b571067bf22ddf5f9e3a667922',
      subsTable:
        '0x064ae57829a1224b05d209da729ab77647ab70a21a82a933a5070639d15af490',
      subsTableId:
        '0xe9fa5d464d28fe30ad060ea32af577c68c9e82aca48ad1f10f13f35338472778',
      subsWhitelist:
        '0xaa0a920bf20b43aa1a8c19cf39df457a835ce98b2820a0d1090420a7e5ff66fe',
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
      id: '0x80ca577876dec91ae6d22090e56c39bc60dce9086ab0729930c6900bc4162b4c',
      coins: {
        ssui: {
          coinType:
            '0xaafc4f740de0dd0dde642a31148fb94517087052f19afb0f7bed1dc41a50c77b::scallop_sui::SCALLOP_SUI',
          treasury:
            '0x5c1678c8261ac9eec024d4d630006a9f55c80dc0b1aa38a003fcb1d425818c6b',
          metaData:
            '0xac724644f481f4870ecdc29b9549aa8ea5180f10827c0d97b493f9f65a91455d',
          symbol: 'sSUI',
        },
        scetus: {
          coinType:
            '0xea346ce428f91ab007210443efcea5f5cdbbb3aae7e9affc0ca93f9203c31f0c::scallop_cetus::SCALLOP_CETUS',
          treasury:
            '0xa283c63488773c916cb3d6c64109536160d5eb496caddc721eb39aad2977d735',
          metaData:
            '0xf022d041455a038d762a091f7a9e9521211f20501bcf8b6913ef5493a023218f',
          symbol: 'sCETUS',
        },
        ssca: {
          coinType:
            '0x5ca17430c1d046fae9edeaa8fd76c7b4193a00d764a0ecfa9418d733ad27bc1e::scallop_sca::SCALLOP_SCA',
          treasury:
            '0xe04bfc95e00252bd654ee13c08edef9ac5e4b6ae4074e8390db39e9a0109c529',
          metaData:
            '0x27e3877491b308dfac46fb3d9f7dfa6a1e8b7dc3c374e92ecda7976055746964',
          symbol: 'sSCA',
        },
        swusdc: {
          coinType:
            '0xad4d71551d31092230db1fd482008ea42867dbf27b286e9c70a79d2a6191d58d::scallop_wormhole_usdc::SCALLOP_WORMHOLE_USDC',
          treasury:
            '0x50c5cfcbcca3aaacab0984e4d7ad9a6ad034265bebb440f0d1cd688ec20b2548',
          metaData:
            '0xdc0595d068621d630f3c7c364dd257f7e3f8079e00c31c8d18755a033c15ae93',
          symbol: 'swUSDC',
        },
        swusdt: {
          coinType:
            '0xe6e5a012ec20a49a3d1d57bd2b67140b96cd4d3400b9d79e541f7bdbab661f95::scallop_wormhole_usdt::SCALLOP_WORMHOLE_USDT',
          treasury:
            '0x1f02e2fed702b477732d4ad6044aaed04f2e8e586a169153694861a901379df0',
          metaData:
            '0x171d0f1ca99d5fefb8b2e40b89899bacdc5417a783906ae119b9cb1c113d59ae',
          symbol: 'swUSDT',
        },
        sweth: {
          coinType:
            '0x67540ceb850d418679e69f1fb6b2093d6df78a2a699ffc733f7646096d552e9b::scallop_wormhole_eth::SCALLOP_WORMHOLE_ETH',
          treasury:
            '0x4b7f5da0e306c9d52490a0c1d4091e653d6b89778b9b4f23c877e534e4d9cd21',
          metaData:
            '0x077d0fd835b559e5b4bb52641f7627ddbf8b200f9b2cf4e28b3514da2a32a4dd',
          symbol: 'swETH',
        },
        safsui: {
          coinType:
            '0x00671b1fa2a124f5be8bdae8b91ee711462c5d9e31bda232e70fd9607b523c88::scallop_af_sui::SCALLOP_AF_SUI',
          treasury:
            '0x55f4dfe9e40bc4cc11c70fcb1f3daefa2bdc330567c58d4f0792fbd9f9175a62',
          metaData:
            '0xfd81c4d1b4d9d1b8c522e91121d22e94759386b29eafe1cc3888ca0ebe369b9e',
          symbol: 'safSUI',
        },
        shasui: {
          coinType:
            '0x9a2376943f7d22f88087c259c5889925f332ca4347e669dc37d54c2bf651af3c::scallop_ha_sui::SCALLOP_HA_SUI',
          treasury:
            '0x404ccc1404d74a90eb6f9c9d4b6cda6d417fb03189f80d9070a35e5dab1df0f5',
          metaData:
            '0x0a2a4a25aac50ac79210d710f93cb22db58bc6ee22f213364dda9a709cab2189',
          symbol: 'shaSUI',
        },
        svsui: {
          coinType:
            '0xe1a1cc6bcf0001a015eab84bcc6713393ce20535f55b8b6f35c142e057a25fbe::scallop_v_sui::SCALLOP_V_SUI',
          treasury:
            '0xc06688ee1af25abc286ffb1d18ce273d1d5907cd1064c25f4e8ca61ea989c1d1',
          metaData:
            '0xa96cc21ddfb6486be4a96cda0c58734e4ddea2a8c04984f9e6121d8fae997ddf',
          symbol: 'svSUI',
        },
        swsol: {
          coinType:
            '0x1392650f2eca9e3f6ffae3ff89e42a3590d7102b80e2b430f674730bc30d3259::scallop_wormhole_sol::SCALLOP_WORMHOLE_SOL',
          treasury:
            '0x760fd66f5be869af4382fa32b812b3c67f0eca1bb1ed7a5578b21d56e1848819',
          metaData:
            '0xee202d2013fc09453d695c640088ee08f14afc8f1ae26284b4ebbc4712ff1ba5',
          symbol: 'swSOL',
        },
        swbtc: {
          coinType:
            '0x2cf76a9cf5d3337961d1154283234f94da2dcff18544dfe5cbdef65f319591b5::scallop_wormhole_btc::SCALLOP_WORMHOLE_BTC',
          treasury:
            '0xe2883934ea42c99bc998bbe0f01dd6d27aa0e27a56455707b1b34e6a41c20baa',
          metaData:
            '0x1ba5904dae41699683da767c7a97785a55c51ec1253498c8fe1980169a96523d',
          symbol: 'swBTC',
        },
        susdc: {
          coinType:
            '0x854950aa624b1df59fe64e630b2ba7c550642e9342267a33061d59fb31582da5::scallop_usdc::SCALLOP_USDC',
          treasury:
            '0xbe6b63021f3d82e0e7e977cdd718ed7c019cf2eba374b7b546220402452f938e',
          metaData:
            '0x763a21eba338e00bc684aaad80491c89eea5f247b59c47df45b17610c9ad58f2',
          symbol: 'sUSDC',
        },
        ssbeth: {
          coinType:
            '0xb14f82d8506d139eacef109688d1b71e7236bcce9b2c0ad526abcd6aa5be7de0::scallop_sb_eth::SCALLOP_SB_ETH',
          treasury:
            '0xfd0f02def6358a1f266acfa1493d4707ee8387460d434fb667d63d755ff907ed',
          metaData:
            '0xdfdd14d53ed8c7ace7cac8a0eecdfa4c2345e15d9efcbd4e1828f81a107cbe2d',
          symbol: 'ssbETH',
        },
        sfdusd: {
          coinType:
            '0x6711551c1e7652a270d9fbf0eee25d99594c157cde3cb5fbb49035eb59b1b001::scallop_fdusd::SCALLOP_FDUSD',
          treasury:
            '0xdad9bc6293e694f67a5274ea51b596e0bdabfafc585ae6d7e82888e65f1a03e0',
          metaData:
            '0xb1529a3b5e5831d19a722493eec19785f613945d3dc984602d44a418f990d73f',
          symbol: 'sFDUSD',
        },
        sdeep: {
          coinType:
            '0xeb7a05a3224837c5e5503575aed0be73c091d1ce5e43aa3c3e716e0ae614608f::scallop_deep::SCALLOP_DEEP',
          treasury:
            '0xc63838fabe37b25ad897392d89876d920f5e0c6a406bf3abcb84753d2829bc88',
          metaData:
            '0x2443014594a500a9119e11c6c6a86e865834f496c4614280ce8cace33c0b072e',
          symbol: 'sDEEP',
        },
        sfud: {
          coinType:
            '0xe56d5167f427cbe597da9e8150ef5c337839aaf46891d62468dcf80bdd8e10d1::scallop_fud::SCALLOP_FUD',
          treasury:
            '0xf25212f11d182decff7a86165699a73e3d5787aced203ca539f43cfbc10db867',
          metaData:
            '0x4e03390de36b8c84e0a8297d3d0d08a8a34bed93787e37fcb26bfc26df33226c',
          symbol: 'sFUD',
        },
        ssbusdt: {
          coinType:
            '0xb1d7df34829d1513b73ba17cb7ad90c88d1e104bb65ab8f62f13e0cc103783d3::scallop_sb_usdt::SCALLOP_SB_USDT',
          treasury:
            '0x58bdf6a9752e3a60144d0b70e8608d630dfd971513e2b2bfa7282f5eaa7d04d8',
          metaData:
            '0x1ce77b036043c8fdcc5cd050ed06433ae60296b194c2abf7ade8b7b7c8386d36',
          symbol: 'ssbUSDT',
        },
        sblub: {
          coinType:
            '0xe72f65446eabfad2103037af2d49d24599106fb44bf4c046c1e7e9acf6844dd0::scallop_blub::SCALLOP_BLUB',
          treasury:
            '0x87d34361dfd0e2accc946684d10b176484f348892f6cc51a829418040c4700e1',
          metaData:
            '0xfa11263cb39de80b9e224d7e0391866a7e779d3d62451de82a91ba601bfb1ce3',
          symbol: 'sBLUB',
        },
        ssbwbtc: {
          coinType:
            '0x08c0fe357d3a138f4552bee393ce3a28a45bebcca43373d6a90bc44ab76f82e2::scallop_sb_wbtc::SCALLOP_SB_WBTC',
          treasury:
            '0x21db1d3b310d32b5fb1383591103bfea57c6aed62ef6d3b6d469bab752b8681f',
          metaData:
            '0x83d3d44ca57f9b1657065865caa497188d6fc1429f0ca846a51a9058f066f591',
          symbol: 'ssbwBTC',
        },
        smusd: {
          coinType:
            '0x0a228d1c59071eccf3716076a1f71216846ee256d9fb07ea11fb7c1eb56435a5::scallop_musd::SCALLOP_MUSD',
          treasury:
            '0xadfd554635ccc87e992f23ca838f0f16c14874e324a1b79b77f6bfe118edea9f',
          metaData:
            '0xb924f8c3d4b993172d4fc553c1ea242e8ca539e83edc3edaf5512ae44dfa6863',
          symbol: 'smUSD',
        },
        sns: {
          coinType:
            '0x6511052d2f1404934e0d877709949bcda7c1d451d1218a4b2643ca2f3fa93991::scallop_ns::SCALLOP_NS',
          treasury:
            '0xa178587907006828839f312e6b5afa69e8aa9c66bdf06b2a5918bd8d913488e3',
          metaData:
            '0x898320fe66409bdcf580e2a5764217aa51a6fb26890645efff7011b54117e6df',
          symbol: 'sNS',
        },
        susdy: {
          coinType:
            '0xd285cbbf54c87fd93cd15227547467bb3e405da8bbf2ab99f83f323f88ac9a65::scallop_usdy::SCALLOP_USDY',
          treasury:
            '0xc8c5339fb10d9ad96f235fb312bda54df351549a3302e7fa7fd5d1725481604f',
          metaData:
            '0x098c4c77bd29ec803a11fa2b2d684577c6a09e75b77e0a7ab59b8b785fb492df',
          symbol: 'sUSDY',
        },
        swal: {
          coinType:
            '0x622345b3f80ea5947567760eec7b9639d0582adcfd6ab9fccb85437aeda7c0d0::scallop_wal::SCALLOP_WAL',
          metaData:
            '0x542c3918c6dc5d2c4648e124edb65d8cb83a635306b3c7fa5263c67a446056a1',
          symbol: 'sWAL',
          treasury:
            '0xc02b365a1d880156c1a757d7777867e8a436ab97ce5f51e211695580ab7c9bce',
        },
        shaedal: {
          coinType:
            '0x0425be5f46f5639ab7201dfde3b2ed837fc129c434f55677c9ba11b528a3214a::scallop_haedal::SCALLOP_HAEDAL',
          treasury:
            '0x4ae9417c4c2ae8e629e72d06682f248c90c61233d43eb0a5654de768d63be26d',
          metaData:
            '0xcc89fcc22f0d13de3688b94fa16d64a22079186a941914280c67101ff754263c',
          symbol: 'sHAEDAL',
        },
      },
    },
  },
};

export const POOL_ADDRESSES = {
  usdc: {
    coinName: 'usdc',
    symbol: 'USDC',
    lendingPoolAddress:
      '0xd3be98bf540f7603eeb550c0c0a19dbfc78822f25158b5fa84ebd9609def415f',
    collateralPoolAddress:
      '0x8f0d529ba179c5b3d508213003eab813aaae31f78226099639b9a69d1aec17af',
    borrowDynamic:
      '0x77837ecd4f26fac9a410fff594f2c0bd3288904a15492ca77cb8a52684dbb866',
    interestModel:
      '0xaae3f179d63009380cbdcb9acb12907afc9c3cb79cc3460be296a9c6d28f3ff3',
    riskModel:
      '0x198b24db213bfeb8b3c80ae63dde92e32fd24984d25da8233ff777b851edd574',
    borrowFeeKey:
      '0xd37c5316cfe0a5967d14264fa6b423f880518b294a1ee6581ccbb49ccc401fb8',
    supplyLimitKey:
      '0x4be9ae54ac4d320f4f9c14cae78cb85c8e0e67791dd9bdba6d2db20614a28a24',
    borrowLimitKey:
      '0x6b01093cba95b835181f00e3a2c31ed8dfc8d64fe3db0fb80933a09f66e1ccf1',
    spool: '0x0b5f5f413bd3799e4052c37311966c77f3a4545eb125d2e93e67a68478021918',
    spoolReward:
      '0x85ed6ed72ea97c35dbf0cdc7ed6fbc48d8ec15de9b17c74bf4512df8a6d7f166',
    coinMetadataId:
      '0x69b7a7c3c200439c1b5f3b19d7d495d5966d5f08de66c69276152f8db3992ec6',
    sCoinType:
      '0x854950aa624b1df59fe64e630b2ba7c550642e9342267a33061d59fb31582da5::scallop_usdc::SCALLOP_USDC',
    sCoinTreasury:
      '0xbe6b63021f3d82e0e7e977cdd718ed7c019cf2eba374b7b546220402452f938e',
    sCoinMetadataId:
      '0x763a21eba338e00bc684aaad80491c89eea5f247b59c47df45b17610c9ad58f2',
    sCoinSymbol: 'sUSDC',
    sCoinName: 'susdc',
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
    isolatedAssetKey: '',
    isIsolated: false,
  },
  sui: {
    coinName: 'sui',
    symbol: 'SUI',
    lendingPoolAddress:
      '0x9c9077abf7a29eebce41e33addbcd6f5246a5221dd733e56ea0f00ae1b25c9e8',
    collateralPoolAddress:
      '0x75aacfb7dcbf92ee0111fc1bf975b12569e4ba632e81ed7ae5ac090d40cd3acb',
    borrowDynamic:
      '0xbf68e6159c99dcaf87717385f1143d2891c2d19663bd51f0bc9b6909e4bb7c27',
    interestModel:
      '0x0dad9baa89b863c15a0487575de7cc428b01f1aa3998ad7a9e9752d96e83ffa9',
    riskModel:
      '0xcd6675864690b5648a6e309f2f02a66914b2b2bd9c31936f4e0f7fc0f792bc86',
    borrowFeeKey:
      '0xda5ede87a05c0677b17511c859b22d0a2b0229ee374d5d7a1274cb836b9fe5f8',
    supplyLimitKey:
      '0x0602418e66fb7a73fa997077bd66f248ad5b090d43344a14b9f1db598ecc1d47',
    borrowLimitKey:
      '0x2b33a7efdcf6a6df24f4d8a356dd52f58d75bc023c3f171d99502d4d008b53f0',
    spool: '0x4f0ba970d3c11db05c8f40c64a15b6a33322db3702d634ced6536960ab6f3ee4',
    spoolReward:
      '0x162250ef72393a4ad3d46294c4e1bdfcb03f04c869d390e7efbfc995353a7ee9',
    coinMetadataId:
      '0x9258181f5ceac8dbffb7030890243caed69a9599d2886d957a9cb7656af3bdb3',
    sCoinType:
      '0xaafc4f740de0dd0dde642a31148fb94517087052f19afb0f7bed1dc41a50c77b::scallop_sui::SCALLOP_SUI',
    sCoinTreasury:
      '0x5c1678c8261ac9eec024d4d630006a9f55c80dc0b1aa38a003fcb1d425818c6b',
    sCoinMetadataId:
      '0xac724644f481f4870ecdc29b9549aa8ea5180f10827c0d97b493f9f65a91455d',
    sCoinSymbol: 'sSUI',
    sCoinName: 'ssui',
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
    isolatedAssetKey: '',
    isIsolated: false,
  },
  wsol: {
    coinName: 'wsol',
    symbol: 'wSOL',
    lendingPoolAddress:
      '0x985682c42984cdfb03f9ff7d8923344c2fe096b1ae4b82ea17721af19d22a21f',
    collateralPoolAddress:
      '0xdc1cc2c371a043ae8e3c3fe2d013c35f1346960b7dbb4c072982c5b794ed144f',
    borrowDynamic:
      '0xe3f301e16d4f1273ea659dd82c5c3f124ca5a5883a5726c7ec0f77bf43b70895',
    interestModel:
      '0xd95affaee077006b8dbb4b108c1b087e95fc6e5143ef0682da345d5b35bc6356',
    riskModel:
      '0x8e0da6358073144ec3557400c87f04991ba3a13ca7e0d0a19daed45260b32f16',
    borrowFeeKey:
      '0x604bffbc817e8e12db15f2373a9e15b2c7adbc510649cdf2cc62a594af90671c',
    supplyLimitKey:
      '0xbd419b536b3f9c9d4adfc20372ca6feedc53cc31798ac860dbfc847bcf05f54b',
    borrowLimitKey:
      '0x77d453c51948f32564c810bc73f9ba7abde880657b7f89e1c8a3bc28fa36ee87',
    coinMetadataId:
      '0x4d2c39082b4477e3e79dc4562d939147ab90c42fc5f3e4acf03b94383cd69b6e',
    sCoinType:
      '0x1392650f2eca9e3f6ffae3ff89e42a3590d7102b80e2b430f674730bc30d3259::scallop_wormhole_sol::SCALLOP_WORMHOLE_SOL',
    sCoinTreasury:
      '0x760fd66f5be869af4382fa32b812b3c67f0eca1bb1ed7a5578b21d56e1848819',
    sCoinMetadataId:
      '0xee202d2013fc09453d695c640088ee08f14afc8f1ae26284b4ebbc4712ff1ba5',
    sCoinSymbol: 'swSOL',
    sCoinName: 'swsol',
    coinType:
      '0xb7844e289a8410e50fb3ca48d69eb9cf29e27d223ef90353fe1bd8e27ff8f3f8::coin::COIN',
    decimals: 8,
    pythFeed:
      'ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    pythFeedObjectId:
      '0x9d0d275efbd37d8a8855f6f2c761fa5983293dd8ce202ee5196626de8fcd4469',
    flashloanFeeObject:
      '0xe84bdb35b790fc7bdd1645122ac6ac0fc904531d6772c9e25904fece322c5f34',
    spool: '',
    spoolName: 'swsol',
    spoolReward: '',
    isolatedAssetKey: '',
    isIsolated: false,
  },
  wusdt: {
    coinName: 'wusdt',
    symbol: 'wUSDT',
    lendingPoolAddress:
      '0xfbc056f126dd35adc1f8fe985e2cedc8010e687e8e851e1c5b99fdf63cd1c879',
    collateralPoolAddress:
      '0x2260cb5b24929dd20a1742f37a61ff3ce4fde5cdb023e2d3ce2e0ce2d90719e3',
    borrowDynamic:
      '0xb524030cc8f7cdbf13f1925a0a2b5e77cc52bab73b070f42c5e510f6083da1ba',
    interestModel:
      '0x92f93c4431b4c51774d6d964da516af2def18b78f49dbbf519e58449a8ba4659',
    riskModel:
      '0xdf89d66988cb506ddeff46f5dfd1d11aaece345e9a05a0c6a18a0788647de2a7',
    borrowFeeKey:
      '0xda8f8b3522fc4086eae4ae7ce8844d60aa0dc3eab8ffc91fe93e922a72639b2d',
    supplyLimitKey:
      '0xa9cb5ebb90ca6e808a2bd7728cca4a6fa8b565d4deeda96eb23c8322c477c24e',
    borrowLimitKey:
      '0xa3278564fc613680a69c10972a0299965bf6e12e9ac171388842fc958de0f90e',
    spool: '0xcb328f7ffa7f9342ed85af3fdb2f22919e1a06dfb2f713c04c73543870d7548f',
    spoolReward:
      '0x2c9f934d67a5baa586ceec2cc24163a2f049a6af3d5ba36b84d8ac40f25c4080',
    coinMetadataId:
      '0xfb0e3eb97dd158a5ae979dddfa24348063843c5b20eb8381dd5fa7c93699e45c',
    sCoinType:
      '0xe6e5a012ec20a49a3d1d57bd2b67140b96cd4d3400b9d79e541f7bdbab661f95::scallop_wormhole_usdt::SCALLOP_WORMHOLE_USDT',
    sCoinTreasury:
      '0x1f02e2fed702b477732d4ad6044aaed04f2e8e586a169153694861a901379df0',
    sCoinMetadataId:
      '0x171d0f1ca99d5fefb8b2e40b89899bacdc5417a783906ae119b9cb1c113d59ae',
    sCoinSymbol: 'swUSDT',
    sCoinName: 'swusdt',
    coinType:
      '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
    spoolName: 'swusdt',
    decimals: 6,
    pythFeed:
      '2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
    pythFeedObjectId:
      '0x985e3db9f93f76ee8bace7c3dd5cc676a096accd5d9e09e9ae0fb6e492b14572',
    flashloanFeeObject:
      '0x5b61983a19b5159ca348d291e4b595f42db70ccda32852a2ed85528aa65171e4',
    isolatedAssetKey: '',
    isIsolated: false,
  },
  wapt: {
    coinName: 'wapt',
    symbol: 'wAPT',
    lendingPoolAddress:
      '0xca8c14a24e0c32b198eaf479a3317461e3cc339097ce88eaf296a15df8dcfdf5',
    collateralPoolAddress:
      '0xde33f9ac5bb0ed34598da4e64b4983832716ced65f172fbf267bcfe859c4ad9c',
    borrowDynamic:
      '0xadda873fb6bf68e1ba3f2dfaa51cf75d4a1bef73d9627bd36e77d2baecb1f2dc',
    interestModel:
      '0xa4a29d07beecea5eb0c59745bb89d7a1380c6f206a7f1ca37046e05db6025c43',
    riskModel:
      '0x7ada83b473af30aed50d187de82a0912878b53ade7ac30e11ce23953cf739d84',
    borrowFeeKey:
      '0x768735df587c7e0f141dcd035fbbcbf9d2149a7b23888baed4e2baa160fa2eeb',
    supplyLimitKey: '',
    borrowLimitKey: '',
    spool: '',
    spoolReward: '',
    coinMetadataId:
      '0xc969c5251f372c0f34c32759f1d315cf1ea0ee5e4454b52aea08778eacfdd0a8',
    sCoinType: '',
    sCoinTreasury: '',
    sCoinMetadataId: '',
    sCoinSymbol: '',
    sCoinName: 'swapt',
    coinType:
      '0x3a5143bb1196e3bcdfab6203d1683ae29edd26294fc8bfeafe4aaa9d2704df37::coin::COIN',
    decimals: 8,
    pythFeed:
      '03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5',
    pythFeedObjectId:
      '0x7c5b7837c44a69b469325463ac0673ac1aa8435ff44ddb4191c9ae380463647f',
    flashloanFeeObject:
      '0x9d5898edcd1e4abcb044273242293a9d036f6a977bf3fe57ab71f5a87c505ee6',
    spoolName: 'swapt',
    isolatedAssetKey: '',
    isIsolated: false,
  },
  wusdc: {
    coinName: 'wusdc',
    symbol: 'wUSDC',
    lendingPoolAddress:
      '0x2f4df5e1368fbbdaa5c712d28b837b3d41c2d3872979ccededcdfdac55ff8a93',
    collateralPoolAddress:
      '0x94cf69158114c5b242d2ee5d0149a335bddf3b9c9a6ba919cca58097a4814980',
    borrowDynamic:
      '0x0464d117908b52fc75f7f85322a47caa078ef56f48681bcfdcb630a66f2591e6',
    interestModel:
      '0xd72e2b5ba486752939d6dfb86a67b86ce9a60c83cb8fb893caac54a0f112577f',
    riskModel:
      '0xb74035de8f70c1531ceb8e2e8c152d6b8db24c8a9fe7bbf6f75dbf7c6700a0a3',
    borrowFeeKey:
      '0x76dcf1acbd9951fe3d1a3fe28403fec089ffe53a7c7d6c77e3ea97033a63581a',
    supplyLimitKey:
      '0x7b302196907e87c5d5872f2e6f40628d110170f994e0e08bc607bded001958c3',
    borrowLimitKey:
      '0x97f1502ce994db0bcb15aac1760d174def9e88e97cd2262eed54521ee2c19f81',
    spool: '0x4ace6648ddc64e646ba47a957c562c32c9599b3bba8f5ac1aadb2ae23a2f8ca0',
    spoolReward:
      '0xf4268cc9b9413b9bfe09e8966b8de650494c9e5784bf0930759cfef4904daff8',
    coinMetadataId:
      '0x4fbf84f3029bd0c0b77164b587963be957f853eccf834a67bb9ecba6ec80f189',
    sCoinType:
      '0xad4d71551d31092230db1fd482008ea42867dbf27b286e9c70a79d2a6191d58d::scallop_wormhole_usdc::SCALLOP_WORMHOLE_USDC',
    sCoinTreasury:
      '0x50c5cfcbcca3aaacab0984e4d7ad9a6ad034265bebb440f0d1cd688ec20b2548',
    sCoinMetadataId:
      '0xdc0595d068621d630f3c7c364dd257f7e3f8079e00c31c8d18755a033c15ae93',
    sCoinSymbol: 'swUSDC',
    sCoinName: 'swusdc',
    coinType:
      '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
    spoolName: 'swusdc',
    decimals: 6,
    pythFeed:
      'eaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
    pythFeedObjectId:
      '0x5dec622733a204ca27f5a90d8c2fad453cc6665186fd5dff13a83d0b6c9027ab',
    flashloanFeeObject:
      '0xd241d6a7e44ac11a6689370ed9a98eec389b98b8a6695c61fddede9fa7567b90',
    isolatedAssetKey: '',
    isIsolated: false,
  },
  deep: {
    coinName: 'deep',
    symbol: 'DEEP',
    lendingPoolAddress:
      '0xf4a67ffb43da1e1c61c049f188f19463ea8dbbf2d5ef4722d6df854ff1b1cc03',
    collateralPoolAddress:
      '0x3e37fdf8b95de2af87085a264cb4bf50adabad1f6b415243b9cb7aec4a8dab56',
    borrowDynamic:
      '0x95e00d7466f97a100e70f08bd37788dc49335796f6f49fab996d40dd0681c6d3',
    interestModel:
      '0x4143c298506a332d92ea8a995e6f3991ee3215f58f6fc6441752835d275b9a69',
    borrowFeeKey:
      '0xb14ee43f4ad2a2c40bac8c4406a401690e93c982e289cf3802fedf74a159cab2',
    supplyLimitKey:
      '0x599528fdfdc253e90dfd0acf4f4a166b391e2aac1ca6528abbff63225b548fee',
    borrowLimitKey:
      '0xf4217e8ef9d9c32e8992092e910a77535a8124c19b8a762a673f227f5f765a4e',
    coinMetadataId:
      '0x6e60b051a08fa836f5a7acd7c464c8d9825bc29c44657fe170fe9b8e1e4770c0',
    sCoinType:
      '0xeb7a05a3224837c5e5503575aed0be73c091d1ce5e43aa3c3e716e0ae614608f::scallop_deep::SCALLOP_DEEP',
    sCoinTreasury:
      '0xc63838fabe37b25ad897392d89876d920f5e0c6a406bf3abcb84753d2829bc88',
    sCoinMetadataId:
      '0x2443014594a500a9119e11c6c6a86e865834f496c4614280ce8cace33c0b072e',
    sCoinSymbol: 'sDEEP',
    sCoinName: 'sdeep',
    coinType:
      '0xdeeb7a4662eec9f2f3def03fb937a663dddaa2e215b8078a284d026b7946c270::deep::DEEP',
    decimals: 6,
    pythFeed:
      '29bdd5248234e33bd93d3b81100b5fa32eaa5997843847e2c2cb16d7c6d9f7ff',
    pythFeedObjectId:
      '0x8c7f3a322b94cc69db2a2ac575cbd94bf5766113324c3a3eceac91e3e88a51ed',
    flashloanFeeObject:
      '0xd54dfb677e9e011e2451375a7a2e318b4f2225c2a0b369bde0afcef8cbb1a863',
    isolatedAssetKey:
      '0x208d3a24ba369dcfc8f0387333d1512b98199eb150d2f2a69359ff708cf761e3',
    spool: '',
    spoolName: 'sdeep',
    spoolReward: '',
    riskModel:
      '0xf742e6a37bdda54a89ecc89b619ab18a5454ed9cd51728dcbbffe8e3c458024c',
    isIsolated: false,
  },
  weth: {
    coinName: 'weth',
    symbol: 'wETH',
    lendingPoolAddress:
      '0xc8fcdff48efc265740ae0b74aae3faccae9ec00034039a113f3339798035108c',
    collateralPoolAddress:
      '0xad7ced91ed6e7f2b81805561eee27fa6f3e72fdae561077334c7248583db4dbf',
    borrowDynamic:
      '0xd1578e1d1c9c82eb4c5bf14beece8142a67a683b2647d7276e92984119fc1445',
    interestModel:
      '0xa1dc08541cd2cb7cfb4e56272292d5c6a4780e80fd210c58abffae98268b5ed9',
    riskModel:
      '0x9f05a25fd33a9e8cf33962126b175d038e184f0ee1b87dc41d4cedbe6abebbe5',
    borrowFeeKey:
      '0x29672ba8ab4625b8181d8ed739e5344de22a97d417748c4d1276c7379283d7a3',
    supplyLimitKey:
      '0x2b957941bdc9432bbc83ab74dc194b6ebb7c927bc4c6926a5492b5503499e509',
    borrowLimitKey:
      '0x51f256d87e51a7ca2b1c482923096f4b6dac6beac89d8ecf4c65b7d5764115d6',
    spool: '0xeec40beccb07c575bebd842eeaabb835f77cd3dab73add433477e57f583a6787',
    spoolReward:
      '0x957de68a18d87817de8309b30c1ec269a4d87ae513abbeed86b5619cb9ce1077',
    coinMetadataId:
      '0x8900e4ceede3363bef086d6b50ca89d816d0e90bf6bc46efefe1f8455e08f50f',
    sCoinType:
      '0x67540ceb850d418679e69f1fb6b2093d6df78a2a699ffc733f7646096d552e9b::scallop_wormhole_eth::SCALLOP_WORMHOLE_ETH',
    sCoinTreasury:
      '0x4b7f5da0e306c9d52490a0c1d4091e653d6b89778b9b4f23c877e534e4d9cd21',
    sCoinMetadataId:
      '0x077d0fd835b559e5b4bb52641f7627ddbf8b200f9b2cf4e28b3514da2a32a4dd',
    sCoinSymbol: 'swETH',
    sCoinName: 'sweth',
    coinType:
      '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
    spoolName: 'sweth',
    decimals: 8,
    pythFeed:
      'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    pythFeedObjectId:
      '0x9193fd47f9a0ab99b6e365a464c8a9ae30e6150fc37ed2a89c1586631f6fc4ab',
    flashloanFeeObject:
      '0xd252acb058e77877810c1290564e290a8f9fcab5bc9aca2884ede8a38810cf34',
    isolatedAssetKey: '',
    isIsolated: false,
  },
  vsui: {
    coinName: 'vsui',
    symbol: 'vSUI',
    lendingPoolAddress:
      '0xda9257c0731d8822e8a438ebced13415850d705b779c79958dcf2aeb21fcb43d',
    collateralPoolAddress:
      '0x4435e8b8ec2a04094d863aa52deb6ab6f8f47ed8778f4d9f1b27afc4a6e85f1e',
    borrowDynamic:
      '0x8eae703505246f975e83f5af24780e5f1b89ef403d5a80ea15534624d6f1a503',
    interestModel:
      '0xaf6a52b5eaaa5af4d9e49d83de0d504c295ae21f3a37560c3f48e0e15a1d4625',
    riskModel:
      '0x1e862f27a6bd47c3041159a5cf392f549485c6605ed9aa937f16ecc951e82e65',
    borrowFeeKey:
      '0x5230de0f41a5e4c05b3d1187a90a9eeab491cec97b08b71512d9785e8af36aa6',
    supplyLimitKey:
      '0x1d40e34d1f365ec431fff020bd75c16b14b340b3ed6c139803cc15c2384621b2',
    borrowLimitKey:
      '0x4eb206b4417642cfc1b02f80bb5f5e366af2af2f9fb4ea4f4e898ae82367f8a0',
    spool: '0x69ce8e537e750a95381e6040794afa5ab1758353a1a2e1de7760391b01f91670',
    spoolReward:
      '0xbca914adce058ad0902c7f3cfcd698392a475f00dcfdc3f76001d0370b98777a',
    coinMetadataId:
      '0xabd84a23467b33854ab25cf862006fd97479f8f6f53e50fe732c43a274d939bd',
    sCoinType:
      '0xe1a1cc6bcf0001a015eab84bcc6713393ce20535f55b8b6f35c142e057a25fbe::scallop_v_sui::SCALLOP_V_SUI',
    sCoinTreasury:
      '0xc06688ee1af25abc286ffb1d18ce273d1d5907cd1064c25f4e8ca61ea989c1d1',
    sCoinMetadataId:
      '0xa96cc21ddfb6486be4a96cda0c58734e4ddea2a8c04984f9e6121d8fae997ddf',
    sCoinSymbol: 'svSUI',
    sCoinName: 'svsui',
    coinType:
      '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT',
    spoolName: 'svsui',
    decimals: 9,
    pythFeed:
      '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
    pythFeedObjectId:
      '0x801dbc2f0053d34734814b2d6df491ce7807a725fe9a01ad74a07e9c51396c37',
    flashloanFeeObject:
      '0x0069cddee7a5c0b1d34beb5ef0620f978096525f1830b055f38b110f40d73fbb',
    isolatedAssetKey: '',
    isIsolated: false,
  },
  wbtc: {
    coinName: 'wbtc',
    symbol: 'wBTC',
    lendingPoolAddress:
      '0x65cc08a5aca0a0b8d72e1993ded8d145f06dd102fd0d8f285b92934faed564ab',
    collateralPoolAddress:
      '0x1aa4e5cf743cd797b4eb8bf1e614f80ae2cf556ced426cddaaf190ffcd0e59c3',
    borrowDynamic:
      '0x6f97dcf54158a5d08f359a213a41e347bc1e6316414288dc1e1b674dc008742e',
    interestModel:
      '0x582b915cca0ffca9576a7cedd505d0fd7cb146e9521ccf10e7453ed93705684d',
    riskModel:
      '0x1d0a242bf1682e259112239720da19d3155dd99d70b1f4b3b973eecbab858911',
    borrowFeeKey:
      '0x654ab7e8ff6d9ef04da697e1f12ca21eaf72ebb495daf877e0776e65187dcb92',
    supplyLimitKey:
      '0xac3b0d17df9f98aa2798c54405cf1d8d5356ef22f76f02d150cbe5195e9f3a36',
    borrowLimitKey:
      '0x231e13ba6b1eb26c562f4a125778d3152f9a77e31f124bd6012e234a73012169',
    coinMetadataId:
      '0x5d3c6e60eeff8a05b693b481539e7847dfe33013e7070cdcb387f5c0cac05dfd',
    sCoinType:
      '0x2cf76a9cf5d3337961d1154283234f94da2dcff18544dfe5cbdef65f319591b5::scallop_wormhole_btc::SCALLOP_WORMHOLE_BTC',
    sCoinTreasury:
      '0xe2883934ea42c99bc998bbe0f01dd6d27aa0e27a56455707b1b34e6a41c20baa',
    sCoinMetadataId:
      '0x1ba5904dae41699683da767c7a97785a55c51ec1253498c8fe1980169a96523d',
    sCoinSymbol: 'swBTC',
    sCoinName: 'swbtc',
    coinType:
      '0x027792d9fed7f9844eb4839566001bb6f6cb4804f66aa2da6fe1ee242d896881::coin::COIN',
    decimals: 8,
    pythFeed:
      'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    pythFeedObjectId:
      '0x9a62b4863bdeaabdc9500fce769cf7e72d5585eeb28a6d26e4cafadc13f76ab2',
    flashloanFeeObject:
      '0x2078490aa37d8fb42b511e5c95e217cb957d141267e16980bc802d76b42719f7',
    spool: '',
    spoolName: 'swbtc',
    spoolReward: '',
    isolatedAssetKey: '',
    isIsolated: false,
  },
  afsui: {
    coinName: 'afsui',
    symbol: 'afSUI',
    lendingPoolAddress:
      '0x9b942a24ce390b7f5016d34a0217057bf9487b92aa6d7cc9894271dbbe62471a',
    collateralPoolAddress:
      '0xe5e56f5c0e3072760b21f9d49a5cc793f37d736c412a9065c16e1265c74e6341',
    borrowDynamic:
      '0x1c76d4df9506154a117bbac0f5e005d8a9c0d9ca60e3fe0c9d080006f6f54e81',
    interestModel:
      '0xb155c536b37c9601baaa734ad1dd0ef335b2b597aceb8d3ecee41a43f94dcd70',
    riskModel:
      '0x75371b1d04b5bebc0738af548ba64ea658e74f78228ec8014336d8eebb992312',
    borrowFeeKey:
      '0xabc6422db2d4ee01635ddaeaa44ba68370eebd785d2c4632515f841ae9bc47d9',
    supplyLimitKey:
      '0x61a2054eb37f543c0d774da57f2c9542aad8d79a197f748ac08ef5df6cc47028',
    borrowLimitKey:
      '0x4459498a043872cd107ea917493fee0baf2d37a273c7538e1d6581cc61b92af8',
    spool: '0xeedf438abcaa6ce4d9625ffca110920592d5867e4c5637d84ad9f466c4feb800',
    spoolReward:
      '0x89255a2f86ed7fbfef35ab8b7be48cc7667015975be2685dd9a55a9a64baf76e',
    coinMetadataId:
      '0x2f9217f533e51334873a39b8026a4aa6919497b47f49d0986a4f1aec66f8a34d',
    sCoinType:
      '0x00671b1fa2a124f5be8bdae8b91ee711462c5d9e31bda232e70fd9607b523c88::scallop_af_sui::SCALLOP_AF_SUI',
    sCoinTreasury:
      '0x55f4dfe9e40bc4cc11c70fcb1f3daefa2bdc330567c58d4f0792fbd9f9175a62',
    sCoinMetadataId:
      '0xfd81c4d1b4d9d1b8c522e91121d22e94759386b29eafe1cc3888ca0ebe369b9e',
    sCoinSymbol: 'safSUI',
    sCoinName: 'safsui',
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
    isolatedAssetKey: '',
    isIsolated: false,
  },
  hasui: {
    coinName: 'hasui',
    symbol: 'haSUI',
    lendingPoolAddress:
      '0x7ebc607f6bdeb659fb6506cb91c5cc1d47bb365cfd5d2e637ea765346ec84ed4',
    collateralPoolAddress:
      '0xad9ed40d6486e4c26cec7370dffce8dc4821eb79178250b5938a34ccafd61e6d',
    borrowDynamic:
      '0x13ec1220b41c6e0f11dd6113199a2aff8e4cf2223047b5bd06d7a3ed5d23e1d2',
    interestModel:
      '0x987c58cbe48096618f4d9d83e0bde2ff638ce4753aba40dab7c302ac3e4b4519',
    riskModel:
      '0xe42d8497d423eca0d8df89850c2d77d3644e7f54a2d28f59c315903ea5ec8dec',
    borrowFeeKey:
      '0xef885c382d461c4fb14d1f3b3758c380c78a1a4b2a3d2fafe6e8649a60fdd7ab',
    supplyLimitKey:
      '0xc7385b1703693cbbc9c97227fe3fd5c91d7afda00e0da69d942c3260d78e45e0',
    borrowLimitKey:
      '0x65333e606eead786a999c8267bc9886b0fdbc298a8a8635a48a9c9b8838d9395',
    spool: '0xa6148bc1b623e936d39a952ceb5bea79e8b37228a8f595067bf1852efd3c34aa',
    spoolReward:
      '0x6f3563644d3e2ef13176dbf9d865bd93479df60ccbe07b7e66db57f6309f5a66',
    coinMetadataId:
      '0x2c5f33af93f6511df699aaaa5822d823aac6ed99d4a0de2a4a50b3afa0172e24',
    sCoinType:
      '0x9a2376943f7d22f88087c259c5889925f332ca4347e669dc37d54c2bf651af3c::scallop_ha_sui::SCALLOP_HA_SUI',
    sCoinTreasury:
      '0x404ccc1404d74a90eb6f9c9d4b6cda6d417fb03189f80d9070a35e5dab1df0f5',
    sCoinMetadataId:
      '0x0a2a4a25aac50ac79210d710f93cb22db58bc6ee22f213364dda9a709cab2189',
    sCoinSymbol: 'shaSUI',
    sCoinName: 'shasui',
    coinType:
      '0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI',
    spoolName: 'shasui',
    decimals: 9,
    pythFeed:
      '23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
    pythFeedObjectId:
      '0x801dbc2f0053d34734814b2d6df491ce7807a725fe9a01ad74a07e9c51396c37',
    flashloanFeeObject:
      '0xb9f505d532de1d6c9f3a8522a2d16f2958b75c0ed939d4f80b96f584a2a8ed5e',
    isolatedAssetKey: '',
    isIsolated: false,
  },
  sbusdt: {
    coinName: 'sbusdt',
    symbol: 'sbUSDT',
    lendingPoolAddress:
      '0x958ca02058a7dd8b00e26ed6988f45d7c2834ae2a47ee4c4a8fdedea155f18ca',
    collateralPoolAddress:
      '0x63c861f97192ceab2dabb1e74649ae87a9e36c33aaedcc43e40a811d3a39e653',
    borrowDynamic:
      '0xf1ef9a19881ed6ddeb88f361c83f37c592ec5b9c64fe715383f63ccc094be205',
    interestModel:
      '0x62c46e4667c4fa69a29030ecbc0f661c61365d02adc3810b08b11cfd8f42ca1c',
    riskModel:
      '0x59d5f3dbcd14a0aab6ee6e2879803e10b0a752119d19c4ac0bd389d71dc8c2bf',
    borrowFeeKey:
      '0xa418990ad042e97cca61830476483933b9e026970fc33451072b2627ccb31da2',
    supplyLimitKey:
      '0x93641bfb62ea40760f0c15911b4ec0eb866f8725e36b0ca9a786775d93629139',
    borrowLimitKey:
      '0x953a9b8d5353abb38db21a2cbbc5c54f8f23348895acb26cbe2c0ab61b54635d',
    coinMetadataId:
      '0xda61b33ac61ed4c084bbda65a2229459ed4eb2185729e70498538f0688bec3cc',
    sCoinType:
      '0xb1d7df34829d1513b73ba17cb7ad90c88d1e104bb65ab8f62f13e0cc103783d3::scallop_sb_usdt::SCALLOP_SB_USDT',
    sCoinTreasury:
      '0x58bdf6a9752e3a60144d0b70e8608d630dfd971513e2b2bfa7282f5eaa7d04d8',
    sCoinMetadataId:
      '0x1ce77b036043c8fdcc5cd050ed06433ae60296b194c2abf7ade8b7b7c8386d36',
    sCoinSymbol: 'ssbUSDT',
    sCoinName: 'ssbusdt',
    coinType:
      '0x375f70cf2ae4c00bf37117d0c85a2c71545e6ee05c4a5c7d282cd66a4504b068::usdt::USDT',
    decimals: 6,
    pythFeed:
      '2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
    pythFeedObjectId:
      '0x985e3db9f93f76ee8bace7c3dd5cc676a096accd5d9e09e9ae0fb6e492b14572',
    flashloanFeeObject:
      '0x8216d9d04e53af658676cb9a2834140a51a915551fe8a34a27e6885792bdd518',
    spool: '',
    spoolName: 'ssbusdt',
    spoolReward: '',
    isolatedAssetKey: '',
    isIsolated: false,
  },
  cetus: {
    coinName: 'cetus',
    symbol: 'CETUS',
    lendingPoolAddress:
      '0xc09858f60e74a1b671635bec4e8a2c84a0ff313eb87f525fba3258e88c6b6282',
    collateralPoolAddress:
      '0xe363967e29b7b9c1245d6d46d63e719de8f90b37e3358c545b55d945ea0b676a',
    borrowDynamic:
      '0xcc725fd5d71990cdccc7e16c88a2abde6dbcd0bf6e805ccc1c0cb83a106bbf4e',
    interestModel:
      '0x2f1258aab89d04d11834121599ab1317dfecb582b4246f106df399911125845a',
    riskModel:
      '0x03fed312dbba624dff5edaf4736891a1c7d864445fd268e7572b42ec7381132e',
    borrowFeeKey:
      '0xdf5fb0cc4ebbf5eebfae23dfa5b266f6a58c18a894a13054ae60c0eb6e79c382',
    supplyLimitKey:
      '0xa5ea3d4bf663d7bc667e82b40a98923590ff3851b9ea8e7afbc26c588c7007d3',
    borrowLimitKey:
      '0xf44218a5f0feb128e6fbe74b91d1e7e9ef859bd23a576ff0de151829e015a157',
    spool: '0xac1bb13bf4472a637c18c2415fb0e3c1227ea2bcf35242e50563c98215bd298e',
    spoolReward:
      '0x6835c1224126a45086fc6406adc249e3f30df18d779ca4f4e570e38716a17f3f',
    coinMetadataId:
      '0x4c0dce55eff2db5419bbd2d239d1aa22b4a400c01bbb648b058a9883989025da',
    sCoinType:
      '0xea346ce428f91ab007210443efcea5f5cdbbb3aae7e9affc0ca93f9203c31f0c::scallop_cetus::SCALLOP_CETUS',
    sCoinTreasury:
      '0xa283c63488773c916cb3d6c64109536160d5eb496caddc721eb39aad2977d735',
    sCoinMetadataId:
      '0xf022d041455a038d762a091f7a9e9521211f20501bcf8b6913ef5493a023218f',
    sCoinSymbol: 'sCETUS',
    sCoinName: 'scetus',
    coinType:
      '0x06864a6f921804860930db6ddbe2e16acdf8504495ea7481637a1c8b9a8fe54b::cetus::CETUS',
    spoolName: 'scetus',
    decimals: 9,
    pythFeed:
      'e5b274b2611143df055d6e7cd8d93fe1961716bcd4dca1cad87a83bc1e78c1ef',
    pythFeedObjectId:
      '0x24c0247fb22457a719efac7f670cdc79be321b521460bd6bd2ccfa9f80713b14',
    flashloanFeeObject:
      '0xe65a73d11c31b2d323ad2b9f6b4bb0a3c0df9c1b212eef66c854941186a5ddc7',
    isolatedAssetKey: '',
    isIsolated: false,
  },
  sbeth: {
    coinName: 'sbeth',
    symbol: 'sbETH',
    lendingPoolAddress:
      '0xaa34c938e0394e5186c7dc626ad69be96af2194b23fdc6ac1c63090e399f5ba4',
    collateralPoolAddress:
      '0xce0549a1cbe952e734f56646988e6b02bbae14667889a60e24d0d03540a6119f',
    borrowDynamic:
      '0x7bbe75e8b924229f2f2110838ff612ea66e670fa3766759515dee78f617b1ea3',
    interestModel:
      '0x9e6cae260d05155785a1904d24e6abc98368509c5752c8a9cec15a35aabc1512',
    riskModel:
      '0xcf10334cfee675ecea2d2fee37b0f7cd2835c84b8b5692a853021debe6af80ab',
    borrowFeeKey:
      '0x4298c8b6afe7a42a8e3ff93773fb9769529fe6d37e085ab411acf2ba2a44a931',
    supplyLimitKey:
      '0x812fe508b78d3e0817149c0b39976221ddb267b5cc9514e81679f9b9a2f3624c',
    borrowLimitKey:
      '0x165c274c67eda2b0d13563124741fffd0ce7d643f4c1c4b59d7e53a83796ae25',
    coinMetadataId:
      '0x89b04ba87f8832d4d76e17a1c9dce72eb3e64d372cf02012b8d2de5384faeef0',
    sCoinType:
      '0xb14f82d8506d139eacef109688d1b71e7236bcce9b2c0ad526abcd6aa5be7de0::scallop_sb_eth::SCALLOP_SB_ETH',
    sCoinTreasury:
      '0xfd0f02def6358a1f266acfa1493d4707ee8387460d434fb667d63d755ff907ed',
    sCoinMetadataId:
      '0xdfdd14d53ed8c7ace7cac8a0eecdfa4c2345e15d9efcbd4e1828f81a107cbe2d',
    sCoinSymbol: 'ssbETH',
    sCoinName: 'ssbeth',
    coinType:
      '0xd0e89b2af5e4910726fbcd8b8dd37bb79b29e5f83f7491bca830e94f7f226d29::eth::ETH',
    decimals: 8,
    pythFeed:
      'ff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    pythFeedObjectId:
      '0x9193fd47f9a0ab99b6e365a464c8a9ae30e6150fc37ed2a89c1586631f6fc4ab',
    flashloanFeeObject:
      '0x8f2a845b337d08cf4fbd7c7c5d3d23f2c94ed2a85c0d4dd7ef0a26fc8d3b9df6',
    spool: '',
    spoolName: 'ssbeth',
    spoolReward: '',
    isolatedAssetKey: '',
    isIsolated: false,
  },
  sbwbtc: {
    coinName: 'sbwbtc',
    symbol: 'sbwBTC',
    lendingPoolAddress:
      '0x5c4fc366c39e0969ddb8912da221cbf298656466f3b58039ff82c5ce64071ad8',
    collateralPoolAddress:
      '0x85fb30d16d66f08e8bc8013665b786d5ca04652015c5ac7461cee51c54d7d507',
    borrowDynamic:
      '0x1e25ebd25b6e1d4c765ff3172472ae21903e7f237b3efe1f6f011c93fef9f634',
    interestModel:
      '0x5f7bff8aa04cc6790a88c51014d5b6feadf6441e4c40a496d67705c2856183b3',
    riskModel:
      '0xb62fb27d5f1305ed94092ff4fd7015a71420bd2b47542599d361a1e8b88c46ad',
    borrowFeeKey:
      '0x4ede8076a8d83315c49df8db9e6774d55ba149fcfb4a7a38845cd76c34f590d1',
    supplyLimitKey:
      '0x4f5dfd04f32cc7ba8fba665486838fd3a291324980460d31bf79918a6b68a112',
    borrowLimitKey:
      '0xc32b0a82ae08248912c39da03c1b347bcfbc7b63da0385e24306c4b97777da56',
    coinMetadataId:
      '0x53e1cae1ad70a778d0b450d36c7c2553314ca029919005aad26945d65a8fb784',
    sCoinType:
      '0x08c0fe357d3a138f4552bee393ce3a28a45bebcca43373d6a90bc44ab76f82e2::scallop_sb_wbtc::SCALLOP_SB_WBTC',
    sCoinTreasury:
      '0x21db1d3b310d32b5fb1383591103bfea57c6aed62ef6d3b6d469bab752b8681f',
    sCoinMetadataId:
      '0x83d3d44ca57f9b1657065865caa497188d6fc1429f0ca846a51a9058f066f591',
    sCoinSymbol: 'ssbwBTC',
    sCoinName: 'ssbwbtc',
    coinType:
      '0xaafb102dd0902f5055cadecd687fb5b71ca82ef0e0285d90afde828ec58ca96b::btc::BTC',
    decimals: 8,
    pythFeed:
      'e62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
    pythFeedObjectId:
      '0x9a62b4863bdeaabdc9500fce769cf7e72d5585eeb28a6d26e4cafadc13f76ab2',
    flashloanFeeObject:
      '0x4cb4c290fa0e4940d01356be33b9df660f650ddbffd658807316c3d9cb9ce848',
    spool: '',
    spoolName: 'ssbwbtc',
    spoolReward: '',
    isolatedAssetKey: '',
    isIsolated: false,
  },
  fud: {
    coinName: 'fud',
    symbol: 'FUD',
    lendingPoolAddress:
      '0xefed2cbe76b344792ac724523c8b2236740d1cea2100d46a0ed0dc760c7f4231',
    collateralPoolAddress: '',
    borrowDynamic:
      '0x14367ddca30e2860cb89ed4eaca20c7ece260c5d59dd9990d2c85a8321326acb',
    interestModel:
      '0x2600ac100ef154eb2329ffd3aad47aca308ff9f9348de3e8e94aaeb906ec2303',
    borrowFeeKey:
      '0xa87e8b26e07ff35ac9fb57adcc779be2883080fc7d12de2d9e7e16d8d8d5e529',
    supplyLimitKey:
      '0xf98419aecc37a3c5de716f8ec590f8991a5be34da72ce1a2da09531ff45adf7d',
    borrowLimitKey:
      '0x3d928a001c453c50004baa54e14b0a0e1b0907d9c613dfd76064fd7ed4e8beb8',
    coinMetadataId:
      '0x01087411ef48aaac1eb6e24803213e3a60a03b147dac930e5e341f17a85e524e',
    sCoinType:
      '0xe56d5167f427cbe597da9e8150ef5c337839aaf46891d62468dcf80bdd8e10d1::scallop_fud::SCALLOP_FUD',
    sCoinTreasury:
      '0xf25212f11d182decff7a86165699a73e3d5787aced203ca539f43cfbc10db867',
    sCoinMetadataId:
      '0x4e03390de36b8c84e0a8297d3d0d08a8a34bed93787e37fcb26bfc26df33226c',
    sCoinSymbol: 'sFUD',
    sCoinName: 'sfud',
    coinType:
      '0x76cb819b01abed502bee8a702b4c2d547532c12f25001c9dea795a5e631c26f1::fud::FUD',
    decimals: 5,
    pythFeed:
      '6a4090703da959247727f2b490eb21aea95c8684ecfac675f432008830890c75',
    pythFeedObjectId:
      '0x4531c3ed0d22f21f5fce882905372006c9aafa30f01db03b789e95a6c50de7b2',
    flashloanFeeObject:
      '0x1ddda368a5f37d7b8c53879cb333ccfd520fc4a3e2fc98b9b5fdacd1a5945d5a',
    isolatedAssetKey:
      '0xfcb533e9e4e31f9c9f32d6cbf7fbb3425f1d60474e229a363a2dc7f835d587e2',
    spool: '',
    spoolName: 'sfud',
    spoolReward: '',
    isIsolated: true,
  },
  musd: {
    coinName: 'musd',
    symbol: 'mUSD',
    lendingPoolAddress:
      '0x0565254220e7ca857a87341898bdebeb9e5d6f8f8fe68eb25dd3e257d41a0b0c',
    collateralPoolAddress: '',
    borrowDynamic:
      '0x9448dc2ae8054d5b735fd617fb4ca57046ddc98bfff91ce31de1df452f3bf695',
    interestModel:
      '0xc3b57c57814e22ac42c7062922a0437ebf40495e37aee32cbb94cba0693970ed',
    borrowFeeKey:
      '0xfdb02d76dc67553fd15f42f1de49ca79cd2812bdaf8bcd079cfe17ce23ed9fc4',
    supplyLimitKey:
      '0x340aaae070f9489b59c4257610babf6f170abf43fbe51cf7de1e2e04492f6823',
    borrowLimitKey:
      '0x2af09dd392e5fa0bb1895b021d871f42dd1bdf4843173836d9611c8c6484031a',
    coinMetadataId:
      '0xc154abd271b24032a2c80d96c1b82109490bb600ed189ef881d8c9467ed44a4f',
    sCoinType:
      '0x0a228d1c59071eccf3716076a1f71216846ee256d9fb07ea11fb7c1eb56435a5::scallop_musd::SCALLOP_MUSD',
    sCoinTreasury:
      '0xadfd554635ccc87e992f23ca838f0f16c14874e324a1b79b77f6bfe118edea9f',
    sCoinMetadataId:
      '0xb924f8c3d4b993172d4fc553c1ea242e8ca539e83edc3edaf5512ae44dfa6863',
    sCoinSymbol: 'smUSD',
    sCoinName: 'smusd',
    coinType:
      '0xe44df51c0b21a27ab915fa1fe2ca610cd3eaa6d9666fe5e62b988bf7f0bd8722::musd::MUSD',
    decimals: 9,
    pythFeed:
      '2ee09cdb656959379b9262f89de5ff3d4dfed0dd34c072b3e22518496a65249c',
    pythFeedObjectId:
      '0x72fbf053d6009a40cff74d9708592bd7b86673a0e7b252077e1aa53390976584',
    flashloanFeeObject:
      '0xb7da1ce9e6d5d094023147a787e973528cc339d432e5edbc9ca2ed8185cddf88',
    isolatedAssetKey:
      '0xe10f03b13d2cdb46543130bafaf1884c9a5a7712b5932aae15b2f8d4fc31a774',
    spool: '',
    spoolName: 'smusd',
    spoolReward: '',
    isIsolated: true,
  },
  fdusd: {
    coinName: 'fdusd',
    symbol: 'FDUSD',
    lendingPoolAddress:
      '0x4f46051a01f05c3ad9aecf29a771aad5c884e1a1888e08d7709085e3a095bc9c',
    collateralPoolAddress:
      '0x4f6647a9afcfdb62bb9b27e4d1cb7bd7130aca1b4f13fa7164453c869c1681ae',
    borrowDynamic:
      '0x4ddcf19b6290a8b048ecb314b14ef7f52c1c5b9ddc9259a2a242cd91d681a085',
    interestModel:
      '0xb57a33706b29d2d253c74c1c0869e6e20da99036338d2b0b7235ab41621ee9dd',
    riskModel:
      '0xd65fb21758dc1e6184940a1a27efb13228d7cf5e19f6dcca06cc2d996af4a6b9',
    borrowFeeKey:
      '0xafe673a27747b063fa918d2dfe47794e44af553737ac562c2a63186539a07f45',
    supplyLimitKey:
      '0x730e0785ba056a7a95f4a6959371a598d7fe782e81c40785c79982ced4cf4e35',
    borrowLimitKey:
      '0x1630c6954918a06fe56312afb8958366c5ed7af653dae0e32c09d088da38577e',
    coinMetadataId:
      '0xdebee5265a67c186ed87fe93303d33dfe1de53e3b4fd7d9329c2852860acd3e7',
    sCoinType:
      '0x6711551c1e7652a270d9fbf0eee25d99594c157cde3cb5fbb49035eb59b1b001::scallop_fdusd::SCALLOP_FDUSD',
    sCoinTreasury:
      '0xdad9bc6293e694f67a5274ea51b596e0bdabfafc585ae6d7e82888e65f1a03e0',
    sCoinMetadataId:
      '0xb1529a3b5e5831d19a722493eec19785f613945d3dc984602d44a418f990d73f',
    sCoinSymbol: 'sFDUSD',
    sCoinName: 'sfdusd',
    coinType:
      '0xf16e6b723f242ec745dfd7634ad072c42d5c1d9ac9d62a39c381303eaa57693a::fdusd::FDUSD',
    decimals: 6,
    pythFeed:
      'ccdc1a08923e2e4f4b1e6ea89de6acbc5fe1948e9706f5604b8cb50bc1ed3979',
    pythFeedObjectId:
      '0x5f6583b2b0fe1ecf94aaffeaab8a838794693960cea48c0da282d5f4a24be027',
    flashloanFeeObject:
      '0x5e32556f5bb64358ddc9a2e9e1ec3b3053cdcbd6351e9d422058f6b9794755e1',
    spool: '',
    spoolName: 'sfdusd',
    spoolReward: '',
    isolatedAssetKey: '',
    isIsolated: false,
  },
  blub: {
    coinName: 'blub',
    symbol: 'BLUB',
    lendingPoolAddress:
      '0x4dede1d8eda98647c3fc9838e94a890b73ca37a20764087eb78ba0473edea1a5',
    collateralPoolAddress: '',
    borrowDynamic:
      '0xb2e9df6917ff3cb93fc4361102504c2d225913b3860458ef40f83b370601bec2',
    interestModel:
      '0xec07bfcf93df52d1c0dabecc88b1ee66445a2fda6b98378c19d8e029022f2012',
    borrowFeeKey:
      '0x59b820845932c1f151793b1c6e605ad993535784ccfaa83e709207d6aed3ab99',
    supplyLimitKey:
      '0xc25e930484a10498a53562cfb87da47280e842564d455f25e5b80a913002d5a0',
    borrowLimitKey:
      '0xaf4560140b2c6906befd546cc556f7c459964e7c31e20a6e1ab992bbc6d12b7f',
    coinMetadataId:
      '0xac32b519790cae96c3317457d903d61d04f1bc8f7710096d80fcba72c7a53703',
    sCoinType:
      '0xe72f65446eabfad2103037af2d49d24599106fb44bf4c046c1e7e9acf6844dd0::scallop_blub::SCALLOP_BLUB',
    sCoinTreasury:
      '0x87d34361dfd0e2accc946684d10b176484f348892f6cc51a829418040c4700e1',
    sCoinMetadataId:
      '0xfa11263cb39de80b9e224d7e0391866a7e779d3d62451de82a91ba601bfb1ce3',
    sCoinSymbol: 'sBLUB',
    sCoinName: 'sblub',
    coinType:
      '0xfa7ac3951fdca92c5200d468d31a365eb03b2be9936fde615e69f0c1274ad3a0::BLUB::BLUB',
    decimals: 2,
    pythFeed:
      '5fc11ffe4975b624be495be038da30e30bee2004d8ae6282b5364577ef4ca92c',
    pythFeedObjectId:
      '0x246658c3324f2477568c78cca622518fbc6969a004b841d81409d24a7ec39b18',
    flashloanFeeObject:
      '0x813176c9af63d6128e41f58ac9c02b9785c3a070a01466d1cb79de3c4691a605',
    isolatedAssetKey:
      '0x30a8f1dbf9dc05dae26c25fac6dfa80fa2d886e05e61cefc697b94959dd75007',
    spool: '',
    spoolName: 'sblub',
    spoolReward: '',
    isIsolated: true,
  },
  sca: {
    coinName: 'sca',
    symbol: 'SCA',
    lendingPoolAddress:
      '0x6fc7d4211fc7018b6c75e7b908b88f2e0536443239804a3d32af547637bd28d7',
    collateralPoolAddress:
      '0xff677a5d9e9dc8f08f0a8681ebfc7481d1c7d57bc441f2881974adcdd7b13c31',
    borrowDynamic:
      '0x4e24f52edd739dab59ca4c6353ca430b7ce57e7f333abd0957958570a7cd09ca',
    interestModel:
      '0xbdcd48cf5b1a814911dc2d5c72d393a980c87820199fe5d799289ce94f4c47df',
    riskModel:
      '0xc437c24b67b8e2676907700fa395af337ad6463d2c0b4f4fa2e9276414026089',
    borrowFeeKey:
      '0xee55ba0f9800a62d9e7aef667f87e658258f41814d2c9fa02e25590671b4e5ad',
    supplyLimitKey:
      '0x8dd938856b972a10ea27ecab2af7ed78e48fc5f6ccedaf2b2119959f747dc2e3',
    borrowLimitKey:
      '0x04c7de61c5b42972f9bf6a8b1848e5fea2d037ee8deba81741ecd4a70aa80d30',
    coinMetadataId:
      '0x5d26a1e9a55c88147ac870bfa31b729d7f49f8804b8b3adfdf3582d301cca844',
    sCoinType:
      '0x5ca17430c1d046fae9edeaa8fd76c7b4193a00d764a0ecfa9418d733ad27bc1e::scallop_sca::SCALLOP_SCA',
    sCoinTreasury:
      '0xe04bfc95e00252bd654ee13c08edef9ac5e4b6ae4074e8390db39e9a0109c529',
    sCoinMetadataId:
      '0x27e3877491b308dfac46fb3d9f7dfa6a1e8b7dc3c374e92ecda7976055746964',
    sCoinSymbol: 'sSCA',
    sCoinName: 'ssca',
    coinType:
      '0x7016aae72cfc67f2fadf55769c0a7dd54291a583b63051a5ed71081cce836ac6::sca::SCA',
    decimals: 9,
    pythFeed:
      '7e17f0ac105abe9214deb9944c30264f5986bf292869c6bd8e8da3ccd92d79bc',
    pythFeedObjectId:
      '0xf6de1d3279a269a597d813cbaca59aa906543ab9a8c64e84a4722f1a20863985',
    flashloanFeeObject:
      '0xe04e46471754b6f48d81c549ecfec09de02733715a63bec02364c6ac7c4dd2dc',
    spool: '',
    spoolName: 'ssca',
    spoolReward: '',
    isolatedAssetKey: '',
    isIsolated: false,
  },
  usdy: {
    coinName: 'usdy',
    symbol: 'USDY',
    lendingPoolAddress:
      '0xd7a8b75ffcd9f22a0108c95ae735b864e117a28d0bf6d596eb4ccd9d6213210d',
    collateralPoolAddress:
      '0x518a921e61aa11a0252bf70d5b2e378e886163a558e07b32424f3930ee0a464a',
    borrowDynamic:
      '0xaddf0b9b382f1ace39916383d24e91b5fd6ff49c5ae0c9400c173fd448e173c8',
    interestModel:
      '0x85781ba1b952743fbc7ba436e165721a189bd724d65cf4abb78b9fe924e6e2eb',
    riskModel:
      '0x96923670c98ec791fefd8074b87cd0087da60e4dbfca9423049fc805e703ec50',
    borrowFeeKey:
      '0x1904f3f2b76bbfa6ba6184cace93ee605691333a35525f1d6648a1509411e4d2',
    supplyLimitKey:
      '0x2f3a58bcf68426cc998b7a9782dccf87351c44efbe655b13a0ac753d6f34a034',
    borrowLimitKey:
      '0xe8ade192f71fbe30d2ed1d246241c370d2882ff78ad312a3382ca8e2c73c386d',
    coinMetadataId:
      '0xd8dd6cf839e2367de6e6107da4b4361f44798dd6cf26d094058d94e4cee25e36',
    sCoinType:
      '0xd285cbbf54c87fd93cd15227547467bb3e405da8bbf2ab99f83f323f88ac9a65::scallop_usdy::SCALLOP_USDY',
    sCoinTreasury:
      '0xc8c5339fb10d9ad96f235fb312bda54df351549a3302e7fa7fd5d1725481604f',
    sCoinMetadataId:
      '0x098c4c77bd29ec803a11fa2b2d684577c6a09e75b77e0a7ab59b8b785fb492df',
    sCoinSymbol: 'sUSDY',
    sCoinName: 'susdy',
    coinType:
      '0x960b531667636f39e85867775f52f6b1f220a058c4de786905bdf761e06a56bb::usdy::USDY',
    decimals: 6,
    pythFeed:
      'e3d1723999820435ebab53003a542ff26847720692af92523eea613a9a28d500',
    pythFeedObjectId:
      '0x773cb390165e227cbd5bd924edaeff7d33b1b78aac045c4903ed9be7e711741a',
    flashloanFeeObject:
      '0x3088b12a808e5f54c71dc80fac922924e0e25c877c7cb78f8be7ad01f792bd2f',
    spool: '',
    spoolName: 'susdy',
    spoolReward: '',
    isolatedAssetKey: '',
    isIsolated: false,
  },
  ns: {
    coinName: 'ns',
    symbol: 'NS',
    lendingPoolAddress:
      '0x98491693e99905ce243655f1d2dc86b62d7c9c330985ee71d16760b63601708c',
    collateralPoolAddress: '',
    borrowDynamic:
      '0x320035fc3bdba3106f550531523b5eab623fc3b42639e6b27623838d121ef64a',
    interestModel:
      '0x6e3c7426f922c6e8538331d36918dc092a53e46d4bb478c36d09b40d0fddc3bf',
    borrowFeeKey:
      '0x9d99ae707899e1034401e8fb8524573a2603ac71a6d367f65d06fbb0ca586950',
    supplyLimitKey:
      '0xe6e87903708cbc09c8d5b005ddbec036efde2c58de4b52d4d8b9f10cb5c9a92b',
    borrowLimitKey:
      '0x3e958a562c6062e39559bb72feb2e4fa5595d629fcafe36a3a40546e0934bd8a',
    coinMetadataId:
      '0x279adec041f8ec5c2d419abf2c32713ae7930a9a3a1ff244c88e5ceced40db6e',
    sCoinType:
      '0x6511052d2f1404934e0d877709949bcda7c1d451d1218a4b2643ca2f3fa93991::scallop_ns::SCALLOP_NS',
    sCoinTreasury:
      '0xa178587907006828839f312e6b5afa69e8aa9c66bdf06b2a5918bd8d913488e3',
    sCoinMetadataId:
      '0x898320fe66409bdcf580e2a5764217aa51a6fb26890645efff7011b54117e6df',
    sCoinSymbol: 'sNS',
    sCoinName: 'sns',
    coinType:
      '0x5145494a5f5100e645e4b0aa950fa6b68f614e8c59e17bc5ded3495123a79178::ns::NS',
    decimals: 6,
    pythFeed:
      'bb5ff26e47a3a6cc7ec2fce1db996c2a145300edc5acaabe43bf9ff7c5dd5d32',
    pythFeedObjectId:
      '0xc6352e1ea55d7b5acc3ed690cc3cdf8007978071d7bfd6a189445018cfb366e0',
    flashloanFeeObject:
      '0xdbcc132a678477fcb843212ec8b5821be5fdb6546950c230c2b4d58c6331144c',
    isolatedAssetKey:
      '0x73ebd841fdbe2a4b4f87fd58a729cba0a7a5871962dc04f5123339d1e0e64de8',
    spool: '',
    spoolName: 'sns',
    spoolReward: '',
    isIsolated: true,
  },
  mpoints: {
    coinName: 'mpoints',
    symbol: 'mPOINTS',
    lendingPoolAddress: '',
    collateralPoolAddress: '',
    borrowDynamic: '',
    interestModel: '',
    riskModel: '',
    borrowFeeKey: '',
    supplyLimitKey: '',
    borrowLimitKey: '',
    spool: '',
    spoolReward: '',
    coinMetadataId:
      '0xa06156a85117345cb3fe41146d03fe26d6c45ca16b2bc6771046814f16c60338',
    sCoinType: '',
    sCoinTreasury: '',
    sCoinMetadataId: '',
    sCoinSymbol: '',
    sCoinName: '',
    coinType:
      '0x7bae0b3b7b6c3da899fe3f4af95b7110633499c02b8c6945110d799d99deaa68::mpoints::MPOINTS',
    spoolName: '',
    decimals: 0,
    pythFeed: '',
    pythFeedObjectId: '',
    flashloanFeeObject: '',
    isolatedAssetKey: '',
    isIsolated: false,
  },
  wal: {
    coinName: 'wal',
    symbol: 'WAL',
    lendingPoolAddress:
      '0xd1dc54a659a5f1b5b26864a1ee0327585c0bd07f066bd3864163db7e73df1209',
    collateralPoolAddress:
      '0xf92856029333f66194e817c988d824f42b635a8dd32d0504cac74cbd7741675e',
    borrowDynamic:
      '0xd64edb426bf707cff3516b289c04c7004da6263a1029808550944da2478afe0c',
    interestModel:
      '0x52ab10df8f003a87ae7f5facff220dd27e52926c8fd348235050efa42c0a0eb5',
    riskModel:
      '0x296b22e162917c158e6582085a98d356b2fd49d41f05703c5a4dcad0f1a340e0',
    borrowFeeKey:
      '0xc660c3dfe83902bd16818b21f49970a79b113fedad54b815175d2a86501692ad',
    supplyLimitKey:
      '0xf1f1c016cfeacc975b442e39734aaf680a65fb01dcc889b7a84b6e89fb50a460',
    borrowLimitKey:
      '0x337a3090614f20d5b16ab09e10778af2c34b761c2e39e6175ece6abd475f5c57',
    spool: '',
    spoolReward: '',
    coinMetadataId:
      '0xcf8a31804ae40cb3e7183fe57320f87467a7750d4fa701bca1ffbb1edd37781e',
    sCoinType:
      '0x622345b3f80ea5947567760eec7b9639d0582adcfd6ab9fccb85437aeda7c0d0::scallop_wal::SCALLOP_WAL',
    sCoinTreasury:
      '0xc02b365a1d880156c1a757d7777867e8a436ab97ce5f51e211695580ab7c9bce',
    sCoinMetadataId:
      '0x542c3918c6dc5d2c4648e124edb65d8cb83a635306b3c7fa5263c67a446056a1',
    sCoinSymbol: 'sWAL',
    sCoinName: 'swal',
    coinType:
      '0x356a26eb9e012a68958082340d4c4116e7f55615cf27affcff209cf0ae544f59::wal::WAL',
    spoolName: 'swal',
    decimals: 9,
    pythFeed:
      'eba0732395fae9dec4bae12e52760b35fc1c5671e2da8b449c9af4efe5d54341',
    pythFeedObjectId:
      '0xeb7e669f74d976c0b99b6ef9801e3a77716a95f1a15754e0f1399ce3fb60973d',
    flashloanFeeObject:
      '0xbd3c9d957f81dfe45323b70ab2bfce8e8ef94c7940d8bc520f288119d079355a',
    isolatedAssetKey:
      '0x421fd728a1de66a31959986a07b3554255160700b92db4da14367cbdcc7dc405',
    isIsolated: false,
  },
  haedal: {
    coinName: 'haedal',
    symbol: 'HAEDAL',
    lendingPoolAddress:
      '0xcc5e913d291e870f3265fb8b260662d84fa2e578dc8b514dfacfbc4562298c0e',
    collateralPoolAddress: '',
    borrowDynamic:
      '0x15fff8d3d331a53cc6e8461a66cb84343fceea790b135adb27e77345714bb151',
    interestModel:
      '0x717a12385920ccabe70d9cfa8a763dc0e6108482d2b0f28539ee35a2efea107c',
    borrowFeeKey:
      '0x6c5bac2e5ce87ed7e4af2852abed242462efe3f8898c01b992cf1bfebb17a160',
    supplyLimitKey:
      '0x2b5aa1258117cdab463bf4d117cf26992ae6458db68f24a9907431f778661e67',
    borrowLimitKey:
      '0x06158c327cc926bc4491391b470e477ef14e46b0fd68b1c3e77cd5498dd6e394',
    spool: '',
    spoolReward: '',
    coinMetadataId:
      '0xcc89fcc22f0d13de3688b94fa16d64a22079186a941914280c67101ff754263c',
    sCoinType:
      '0x0425be5f46f5639ab7201dfde3b2ed837fc129c434f55677c9ba11b528a3214a::scallop_haedal::SCALLOP_HAEDAL',
    sCoinTreasury:
      '0x4ae9417c4c2ae8e629e72d06682f248c90c61233d43eb0a5654de768d63be26d',
    sCoinMetadataId:
      '0xcc89fcc22f0d13de3688b94fa16d64a22079186a941914280c67101ff754263c',
    sCoinSymbol: 'sHAEDAL',
    sCoinName: 'shaedal',
    coinType:
      '0x3a304c7feba2d819ea57c3542d68439ca2c386ba02159c740f7b406e592c62ea::haedal::HAEDAL',
    spoolName: 'shaedal',
    decimals: 9,
    pythFeed:
      'e67d98cc1fbd94f569d5ba6c3c3c759eb3ffc5d2b28e64538a53ae13efad8fd1',
    pythFeedObjectId:
      '0xbc98681c15de1ca1b80a8e26500d43c77f7113368b024de1bf490afcb0387109',
    flashloanFeeObject:
      '0xab13a86fd1bad2850d23540a208ed3327885410f9d6f950f43ea7d0ea2db927b',
    isolatedAssetKey:
      '0xefcd73fbb3d9e0a5d66aca94798a7a1d9100586482643f9fdc00993c422176c3',
    isIsolated: true,
  },
};

export const WHITELIST = {
  lending: [
    'usdc',
    'sbeth',
    'sbusdt',
    'sbwbtc',
    'weth',
    'wbtc',
    'wusdc',
    'wusdt',
    'sui',
    'wapt',
    'wsol',
    'cetus',
    'afsui',
    'hasui',
    'vsui',
    'sca',
    'fud',
    'deep',
    'fdusd',
    'blub',
    'musd',
    'ns',
    'usdy',
    'wal',
    'haedal',
  ],
  collateral: [
    'usdc',
    'sbeth',
    'sbusdt',
    'sbwbtc',
    'weth',
    'wbtc',
    'wusdc',
    'wusdt',
    'sui',
    'wapt',
    'wsol',
    'cetus',
    'afsui',
    'hasui',
    'vsui',
    'sca',
    'fdusd',
    'usdy',
    'wal',
    'deep',
  ],
  borrowing: [
    'usdc',
    'sbeth',
    'sbusdt',
    'sbwbtc',
    'weth',
    'wbtc',
    'wusdc',
    'wusdt',
    'sui',
    'wapt',
    'wsol',
    'cetus',
    'afsui',
    'hasui',
    'vsui',
    'sca',
    'fud',
    'deep',
    'fdusd',
    'blub',
    'musd',
    'ns',
    'usdy',
    'wal',
    'haedal',
  ],
  packages: [
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
  ],
  spool: [
    'susdc',
    'sweth',
    'ssui',
    'swusdc',
    'swusdt',
    'scetus',
    'safsui',
    'shasui',
    'svsui',
  ],
  scoin: [
    'susdc',
    'ssbeth',
    'ssbusdt',
    'ssbwbtc',
    'ssui',
    'swusdc',
    'swusdt',
    'safsui',
    'shasui',
    'svsui',
    'sweth',
    'ssca',
    'scetus',
    'swsol',
    'swbtc',
    'sdeep',
    'sfud',
    'sfdusd',
    'sblub',
    'smusd',
    'sns',
    'susdy',
    'swal',
    'shaedal',
  ],
  suiBridge: ['sbeth', 'sbusdt', 'sbwbtc'],
  wormhole: ['wusdc', 'wusdt', 'weth', 'wbtc', 'wapt', 'wsol'],
  oracles: ['pyth', 'supra', 'switchboard'],
  pythEndpoints: [
    'https://hermes.pyth.network',
    'https://scallop.rpc.p2p.world',
  ],
  deprecated: ['wapt', 'wusdc', 'wusdt', 'weth', 'wbtc', 'vsui'],
  borrowIncentiveRewards: ['mpoints'],
  rewardsAsPoint: ['mpoints'],
  emerging: ['wal', 'deep', 'sca', 'cetus'],
};
