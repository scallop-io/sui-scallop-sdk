import { API_BASE_URL } from '../constants';
import type { NetworkType } from '@scallop-io/sui-kit';
import type {
  ScallopAddressParams,
  AddressesInterface,
  AddressStringPath,
} from '../types';
import { ScallopCache } from './scallopCache';
import { DEFAULT_CACHE_OPTIONS } from 'src/constants/cache';
import axios, { AxiosInstance } from 'axios';

const EMPTY_ADDRESSES: AddressesInterface = {
  core: {
    version:
      '0x6156d5cd1538bec8a167a40fe1209a4ec9cf8137921fe0a697f191ac561f0b09',
    versionCap:
      '0x4cf4cc67c7e3db194aabab0cef4750c9ee9727b70954f67c3784039bccd5ac21',
    object:
      '0x87ddec2984645dbbe2403a509cc6edf393a43acdba9b77d45da2bcbefcf733c1',
    market:
      '0x8606ed145cc887985b8ed793f7753ff5dc762a42c379dac035f568e1bac58490',
    adminCap:
      '0x138ca6b6c22820d1e2fd130bc76972801169f9cdcb0ae72dcc3b0b61089959b0',
    coinDecimalsRegistry:
      '0x200abe9bf19751cc566ae35aa58e2b7e4ff688fc1130f8d8909ea09bc137d668',
    obligationAccessStore:
      '0x48b472d68ca910c45f7f3b6c26836b6aa6d2569810d94b1b939023da05ae0a23',
    coins: {
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
      apt: {
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
      sol: {
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
      btc: {
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
      eth: {
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
      usdc: {
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
      usdt: {
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
        id: '0x6cd813061a3adf3602b76545f076205f0c8e7ec1d3b1eab9a1da7992c18c0524',
        metaData:
          '0x5037eb1d6ee1ec33f738c9a900643ec574d0b8d4579933cd3d076e2fcb7b6909',
        treasury:
          '0xad87ef52314e8ac5ab0ba502e087e5b4506d63cf6d4d8136754666abf85c18f9',
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
        id: '0x28c3b881b1625cc49e81f0fa1b95d304fb99ef8a3fde1fa58b7ae5628904c7df',
        upgradeCap:
          '0x3ab64470e5067cc09b836e68cf41a92b0e83e994e8f1b9c41f0a8ba673803a62',
      },
      protocolWhitelist: {
        id: '0x4c262d9343dac53ecb28f482a2a3f62c73d0ebac5b5f03d57383d56ff219acdf',
        upgradeCap:
          '0x4a5e88a75039b00988f633f811f58117f31b8627a46bf822aa114d9010049449',
      },
      query: {
        id: '0xe4f9d62d17746d5b9dbf0d5557747430021a71575780b515161210cdba0a4c1c',
        upgradeCap:
          '0xb461ef8e96c9748b00a0595eceb610853f5279addeb580365cb3c1a65ecde6fd',
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
    id: '0xafc4a1417ae6bd7d2f7f04e07d5b05e4d301d12420a2919f9725dc2d64bfc7e6',
    adminCap:
      '0xbcb0e30edca1d7a39457bbbb8337b6837d2a4f98c7ce6d05a841309db7a41685',
    object:
      '0xafc4a1417ae6bd7d2f7f04e07d5b05e4d301d12420a2919f9725dc2d64bfc7e6',
    pools: {
      seth: {
        id: '0xeec40beccb07c575bebd842eeaabb835f77cd3dab73add433477e57f583a6787',
        rewardPoolId:
          '0x957de68a18d87817de8309b30c1ec269a4d87ae513abbeed86b5619cb9ce1077',
      },
      ssui: {
        id: '0xe939d5969e4963c83570a06fbd0fd4d2e1f26862b25a88aa71eed104c2bd2f0b',
        rewardPoolId:
          '0x162250ef72393a4ad3d46294c4e1bdfcb03f04c869d390e7efbfc995353a7ee9',
      },
      susdc: {
        id: '0x4abc7104b052babb18cd5f570f453b3c2b72bd8ea86f7c6f7eca6315888f96de',
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
    },
    config:
      '0xca2a354cf133a5f9815412fa1a2c3417ea6541300758873a2754ecac3f7e9103',
  },
  borrowIncentive: {
    id: '0xd016a70af9abbffd43af476588f9006af7d501bab197482cc04c9ec6846a2469',
    adminCap:
      '0x635ae3579ff4c3bf309acb9484f6b9282730a5915210e597faba118c5028493e',
    object:
      '0xd016a70af9abbffd43af476588f9006af7d501bab197482cc04c9ec6846a2469',
    query: '0x3492fddfb6bfc6219f705b0c25c711166656658012e864a72eb0a1ed019e63b3',
    incentivePools:
      '0x3c3c3d12c62d670dfbb365257a2866917c31ee12c7aea651474b02e6f884e5b1',
    incentiveAccounts:
      '0xe6c6ef6319030f326cdb0d4518619e59050f07c987d1a82350a04798008c2679',
    config:
      '0xe5ac3d3abcc6d29939b406dbd51c8c3fa3c833700d18d77b149c8c3cc96dc5ae',
  },
  vesca: {
    id: '0xb15b6e0cdd85afb5028bea851dd249405e734d800a259147bbc24980629723a4',
    object:
      '0xb15b6e0cdd85afb5028bea851dd249405e734d800a259147bbc24980629723a4',
    adminCap:
      '0x5df31ff7804a48c24d6070eed7a6ab741f2870dc4622c72063a05c6d464da3eb',
    tableId:
      '0xe3153b2bf124be0b86cb8bd468346a861efd0da52fc42197b54d2f616488a311',
    table: '0x611cb8d9d4d90867467b5ebdf4cc447a0047ed5b01334a28a29fcfe733e3d609',
    treasury:
      '0xe8c112c09b88158dc6c8e23d1fbae5b3c7136cdee54b7dafc08e65db28c4a5bc',
    config:
      '0xe0a2ff281e73c1d53cfa85807080f87e833e4f1a7f93dcf8800b3865269a76b9',
  },
  referral: {
    id: '0x1bf5a8ce77050d8052549d743e16b469f15aa6b81b752b78b6ebb65179665f5a',
    version:
      '0x3545849eb97723e676a476ec9d4fe5f2eb0eb2c6b78972851114fd4c7ed4639f',
    object:
      '0x1bf5a8ce77050d8052549d743e16b469f15aa6b81b752b78b6ebb65179665f5a',
    adminCap:
      '0xc29e33b02cfb9f4eb4b558dc4f7ec6e6551beb3f37b2776bd486bf1efa22a7f4',
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
      '0x9d6223dc52015b8a3986a573590ef2af8f1b8f3e4685513888c052f001b87e7f',
  },
};
/**
 * @description
 * It provides methods for managing addresses.
 *
 * @example
 * ```typescript
 * const scallopAddress = new ScallopAddress(<parameters>);
 * scallopAddress.<address functions>();
 * await scallopAddress.<address async functions>();
 * ```
 */
export class ScallopAddress {
  private readonly _auth?: string;
  private readonly _requestClient: AxiosInstance;

  private _id?: string;
  private _network: NetworkType;
  private _currentAddresses?: AddressesInterface = EMPTY_ADDRESSES;
  private _addressesMap: Map<NetworkType, AddressesInterface>;
  private _cache: ScallopCache;

  public constructor(params: ScallopAddressParams, cache?: ScallopCache) {
    const { id, auth, network } = params;
    this._cache = cache ?? new ScallopCache(DEFAULT_CACHE_OPTIONS);
    this._requestClient = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
    });
    if (auth) this._auth = auth;
    this._id = id;
    this._network = network || 'mainnet';
    this._addressesMap = new Map();
  }

  /**
   * Get addresses API id.
   *
   * @return The addresses API id.
   */
  public getId() {
    return this._id || undefined;
  }

  /**
   * Get the address at the provided path.
   *
   * @param path - The path of the address to get.
   * @return The address at the provided path.
   */
  public get(path: AddressStringPath) {
    if (this._currentAddresses) {
      const value = path
        .split('.')
        .reduce(
          (nestedAddressObj: any, key: string) =>
            typeof nestedAddressObj === 'object'
              ? nestedAddressObj[key]
              : nestedAddressObj,
          this._currentAddresses
        );
      return value || undefined;
    } else {
      return undefined;
    }
  }

  /**
   * Sets the address for the specified path, it does not interact with the API.
   *
   * @param path - The path of the address to set.
   * @param address - The address be setted to the tartget path.
   * @return The addresses.
   */
  public set(path: AddressStringPath, address: string) {
    if (this._currentAddresses) {
      const keys = path.split('.');
      keys.reduce((nestedAddressObj: any, key: string, index) => {
        if (index === keys.length - 1) {
          nestedAddressObj[key] = address;
        } else {
          return nestedAddressObj[key];
        }
      }, this._currentAddresses);
    }
    return this._currentAddresses;
  }

  /**
   * Synchronize the specified network addresses from the addresses map to the
   * current addresses and change the default network to specified network.
   *
   * @param network - Specifies which network's addresses you want to get.
   * @return Current addresses.
   */
  public switchCurrentAddresses(network: NetworkType) {
    if (this._addressesMap.has(network)) {
      this._currentAddresses = this._addressesMap.get(network);
      this._network = network;
    }
    return this._currentAddresses;
  }

  /**
   * Get the addresses, If `network` is not provided, returns the current
   * addresses or the default network addresses in the addresses map.
   *
   * @param network - Specifies which network's addresses you want to get.
   */
  public getAddresses(network?: NetworkType) {
    if (network) {
      return this._addressesMap.get(network);
    } else {
      return this._currentAddresses ?? this._addressesMap.get(this._network);
    }
  }

  /**
   * Set the addresses into addresses map. If the specified network is the same
   * as the current network, the current addresses will be updated at the same time.
   *
   * @param addresses - The addresses be setted to the tartget network.
   * @param network - Specifies which network's addresses you want to set.
   * @return The addresses.
   */
  public setAddresses(addresses: AddressesInterface, network?: NetworkType) {
    const targetNetwork = network || this._network;
    if (targetNetwork === this._network) this._currentAddresses = addresses;
    this._addressesMap.set(targetNetwork, addresses);
  }

  /**
   * Get all addresses.
   *
   * @return All addresses.
   */
  public getAllAddresses() {
    return Object.fromEntries(this._addressesMap);
  }

  /**
   * Create a new addresses through the API and synchronize it back to the
   * instance.
   *
   * @description
   * If the `network` is not specified, the mainnet is used by default.
   * If no `addresses` from instance or parameter is provided, an addresses with
   * all empty strings is created by default.
   *
   * This function only allows for one addresses to be input into a specific network
   * at a time, and does not provide an addresses map for setting addresses
   * across all networks at once.
   *
   * @param params.addresses - The addresses be setted to the tartget network.
   * @param params.network - Specifies which network's addresses you want to set.
   * @param params.auth - The authentication API key.
   * @param params.memo - Add memo to the addresses created in the API.
   * @return All addresses.
   */
  public async create(params?: {
    addresses?: AddressesInterface | undefined;
    network?: NetworkType | undefined;
    auth?: string | undefined;
    memo?: string | undefined;
  }) {
    const { addresses, network, auth, memo } = params ?? {};
    const apiKey = auth || this._auth || undefined;
    const targetNetwork = network || this._network;
    const targetAddresses =
      addresses ||
      this._currentAddresses ||
      this._addressesMap.get(targetNetwork) ||
      EMPTY_ADDRESSES;

    if (apiKey !== undefined) {
      this._addressesMap.clear();
      this.setAddresses(targetAddresses, targetNetwork);
      const response = await this._requestClient.post(
        `/addresses`,
        JSON.stringify({ ...Object.fromEntries(this._addressesMap), memo }),
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': auth || this._auth,
          },
        }
      );

      if (response.status === 201) {
        for (const [network, addresses] of Object.entries<AddressesInterface>(
          response.data
        )) {
          if (['localnet', 'devnet', 'testnet', 'mainnet'].includes(network)) {
            if (network === this._network) this._currentAddresses = addresses;
            this._addressesMap.set(network as NetworkType, addresses);
          }
        }
        this._id = response.data.id;
        return this.getAllAddresses();
      } else {
        throw Error('Failed to create addresses.');
      }
    } else {
      throw Error("You don't have permission to access this request.");
    }
  }

  /**
   * Read and synchronizes all addresses from the API into instance.
   *
   * @param id - The id of the addresses to get.
   * @return All addresses.
   */
  public async read(id?: string) {
    const addressesId = id || this._id || undefined;
    if (addressesId !== undefined) {
      const response = await this._cache.queryClient.fetchQuery({
        queryKey: ['api-getAddresses', addressesId],
        queryFn: async () => {
          return await this._requestClient.get(`/addresses/${addressesId}`, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
        },
      });

      if (response.status === 200) {
        for (const [network, addresses] of Object.entries<AddressesInterface>(
          response.data
        )) {
          if (['localnet', 'devnet', 'testnet', 'mainnet'].includes(network)) {
            if (network === this._network) this._currentAddresses = addresses;
            this._addressesMap.set(network as NetworkType, addresses);
          }
        }
        this._id = response.data.id;
        return this.getAllAddresses();
      } else {
        throw Error('Failed to create addresses.');
      }
    } else {
      // throw Error('Please provide API addresses id.');
    }
  }

  /**
   * Update the addresses through the API and synchronize it back to the
   * instance.
   *
   * @description
   * If the `network` is not specified, the mainnet is used by default.
   * If no `addresses` from instance or parameter is provided, an addresses with
   * all empty strings is created by default.
   *
   * This function only allows for one addresses to be input into a specific network
   * at a time, and does not provide an addresses map for setting addresses
   * across all networks at once.
   *
   * @param params.id - The id of the addresses to update.
   * @param params.addresses - The addresses be setted to the tartget network.
   * @param params.network - Specifies which network's addresses you want to set.
   * @param params.auth - The authentication api key.
   * @param params.memo - Add memo to the addresses created in the API.
   * @return All addresses.
   */
  public async update(params?: {
    id?: string;
    addresses?: AddressesInterface | undefined;
    network?: NetworkType | undefined;
    auth?: string | undefined;
    memo?: string | undefined;
  }) {
    const { id, addresses, network, auth, memo } = params ?? {};
    const apiKey = auth || this._auth || undefined;
    const targetId = id || this._id || undefined;
    const targetNetwork = network || this._network;
    const targetAddresses =
      addresses ||
      this._currentAddresses ||
      this._addressesMap.get(targetNetwork) ||
      EMPTY_ADDRESSES;

    if (targetId === undefined)
      throw Error('Require specific addresses id to be updated.');
    if (apiKey !== undefined) {
      if (id !== this._id) {
        this._addressesMap.clear();
      }
      this.setAddresses(targetAddresses, targetNetwork);
      const response = await this._requestClient.put(
        `/addresses/${targetId}`,
        JSON.stringify({ ...Object.fromEntries(this._addressesMap), memo }),
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': auth || this._auth,
          },
        }
      );

      if (response.status === 200) {
        for (const [network, addresses] of Object.entries<AddressesInterface>(
          response.data
        )) {
          if (['localnet', 'devnet', 'testnet', 'mainnet'].includes(network)) {
            if (network === this._network) this._currentAddresses = addresses;
            this._addressesMap.set(network as NetworkType, addresses);
          }
        }
        this._id = response.data.id;
        return this.getAllAddresses();
      } else {
        throw Error('Failed to update addresses.');
      }
    } else {
      throw Error("You don't have permission to access this request.");
    }
  }

  /**
   * Deletes all addresses of a specified id through the API and clear all
   * addresses in the instance.
   *
   * @param id - The id of the addresses to delete.
   * @param auth - The authentication API key.
   */
  public async delete(id?: string, auth?: string) {
    const apiKey = auth || this._auth || undefined;
    const targetId = id || this._id || undefined;

    if (targetId === undefined)
      throw Error('Require specific addresses id to be deleted.');
    if (apiKey !== undefined) {
      const response = await this._requestClient.delete(
        `/addresses/${targetId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': auth || this._auth,
          },
        }
      );

      if (response.status === 200) {
        this._id = undefined;
        this._currentAddresses = undefined;
        this._addressesMap.clear();
      } else {
        throw Error('Failed to delete addresses.');
      }
    } else {
      throw Error("You don't have permission to access this request.");
    }
  }
}
