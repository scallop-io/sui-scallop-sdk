import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from '../constants';
import type { AddressBuilderParams } from 'src/types/model';
import type { AddressesInterface, AddressStringPath } from 'src/types/data';
import type { NetworkType } from '@scallop-io/sui-kit';

// TODO: wait for api update new schema, then delete this constant.
const NEW_ADDRESSES: AddressesInterface = {
  core: {
    market:
      '0xb8982283c6164535183408afc0baa5162a8120d7d593b5fac4e31977b4d9d95b',
    adminCap:
      '0x4c8e82f449a399aeab829ab8cd96315f5da5c55c3f46370a27278329248a72f7',
    coinDecimalsRegistry:
      '0xd8b258de0e170be7f78ce57607e995241ab83549415dd5083f395c8971db3d52',
    coins: {
      btc: {
        id: '0x96f98f84c2d351fe152eebb3b937897d33bae6ee07ae8f60028dca16952862cd',
        metaData:
          '0x8cdf03c532bcfd9cf18c78f9451f42e824821dcd3821944e829e815083c88b07',
        // Deploy for faucet on testnet
        treasury:
          '0xc7f8a285b22440707a3f15032e5ed2c820809481e03236dc7d103de4c8a5b5ba',
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: 'f9c0172ba10dfa4d19088d94f5bf61d3b54d5bd7483a322a982e1373ee8ea31b',
            feedObject:
              '0x8899a5649db0099f3a685cf246ed2bd4224bc2078fcaf2c897268764df684d94',
          },
        },
      },
      eth: {
        id: '0x96f98f84c2d351fe152eebb3b937897d33bae6ee07ae8f60028dca16952862cd',
        metaData:
          '0x913329557602d09364d2aea832377ffc94f7f4d40885c66db630c9c7875b97ce',
        treasury:
          '0x860cad87d30808b5aedfa541fdccdb02229dcb455923b4cf2f31227c0ca4b2a4',
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: 'ca80ba6dc32e08d06f1aa886011eed1d77c77be9eb761cc10d72b7d0a2fd57a6',
            feedObject:
              '0x89b76133e1787183b12c753a6cb03484a274a8b3a3438e7d0a467d02271f5dda',
          },
        },
      },
      usdc: {
        id: '0x96f98f84c2d351fe152eebb3b937897d33bae6ee07ae8f60028dca16952862cd',
        metaData:
          '0xbeadb2703f2bf464a58ef3cdb363c2ba71ab53ccdce433d052894b78989c40ed',
        treasury:
          '0x06cebd4202dd077813e1fb11dd4f08b7c045b3ef61f89b2ed29085fdf0743b5f',
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: '41f3625971ca2ed2263e78573fe5ce23e13d2558ed3f2e47ab0f84fb9e7ae722',
            feedObject:
              '0x915e825251a3a2bc2dfb7544986493f11c49db28c470da6bcda295412dcc485e',
          },
        },
      },
      usdt: {
        id: '0x96f98f84c2d351fe152eebb3b937897d33bae6ee07ae8f60028dca16952862cd',
        metaData:
          '0xd8636c1ba598422cac38894c26f9cfe1521ac4be04ae27d72e8ba3a6e4d764f5',
        treasury:
          '0xfcfbec0818911487f86f950fa324e325c789dd2fa3cea38481fb2d884fa2032c',
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: '1fc18861232290221461220bd4e2acd1dcdfbc89c84092c93c18bdc7756c1588',
            feedObject:
              '0x5185bbe53391af7d87bdd954023f9dbb4f1b50714aab021e35eb99115ffc390d',
          },
        },
      },
      sui: {
        id: '',
        metaData: '',
        treasury: '',
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: '50c67b3fd225db8912a424dd4baed60ffdde625ed2feaaf283724f9608fea266',
            feedObject:
              '0x391aafe578a4cf669bf7669288ced3077539eca239dca6fd145144bd8c8e67b6',
          },
        },
      },
    },
    oracles: {
      xOracle:
        '0xa16829dc76adbd526c9066e909e324edc3f5d3151cba7c74c86ea77532ff921b',
      xOracleCap:
        '0x45941160c121644d5482d38404e4964c341e1afbe9c0379e76433def7a73fa43',
      supra: {},
      switchboard: {
        registry:
          '0x92ab1100382144473cd1efae456eab1f4c9e3e04f83dcfb327c58f11bc61998f',
        registryCap:
          '0xfa72ea81a9a0a986e77caee899af4326f7c0dc96bbb5b2b9bf9d1a2a5345a07a',
      },
      pyth: {
        state:
          '0xe96526143f8305830a103331151d46063339f7a9946b50aaa0d704c8c04173e5',
        wormhole:
          '0x80c60bff35fe5026e319cf3d66ae671f2b4e12923c92c45df75eaf4de79e3ce7',
        wormholeState:
          '0x79ab4d569f7eb1efdcc1f25b532f8593cda84776206772e33b490694cb8fc07a',
      },
    },
    packages: {
      coinDecimalsRegistry: {
        id: '0xeafc3d2e82e24a2ef270e6265ba72d7dd6036a743c03fa0e6c2f901fd5e145c0',
        upgradeCap:
          '0x89b94ca221ab4734708e74e496bc4737fe92b4aa1b48949ff3fc683a291aa33d',
      },
      math: {
        id: '0xa0b56ddd51e0d816c0fc985b86f7377b00761910895805448dc6b3aeec677adf',
        upgradeCap:
          '0xebbf16ad136f720de214bb0421c7a5c2e7d09b79018914ba4609d73bef7a86c0',
      },
      whitelist: {
        id: '0x9bad3512db164661beb0ba21f7786f0f17cdcd777c2a0d58e16032e05981d25c',
        upgradeCap:
          '0x3bae741561fdc8826e31145f61c41009f48c2d82c58f42237d89014ea6b1c525',
      },
      x: {
        id: '0x6a216b7f73cb3a7bd448d278a704de8a2b1dac474da91719cb015fbb7824b029',
        upgradeCap:
          '0x2eb858a0cf795e014e433f63569264ed49396a405c0ddd141ff1db21a4fa16f1',
      },
      protocol: {
        id: '0x8941cb2209639cf158059855e5b395d5b05da4385ac21668c8422e9268b9e39b',
        upgradeCap:
          '0x9ddcf80d6a40d83e96a3a3ad9a902268101b547872abeb8eab4fc9021cc0f2bd',
      },
      query: {
        id: '0x9e70ff97501eb23fb6fd7f2dd6fb983b22c031e4ddd3bc84585d9d3cebb7c6ce',
        upgradeCap:
          '0xa89d155ab24ab2b3db0a9c4e7a8f928a8a74aa6a2c78a003f637d73d1dff77af',
      },
      // Deploy by pyth on testnet
      pyth: {
        id: '0x524c15a935d4c34474cdf2604ee42a6c47591d13c6ffb6b678f6b7eaffba12fe',
        upgradeCap: '',
      },
      // Deploy by ourself on testnet
      switchboard: {
        id: '0xc5e3d08d0c65ba6fe12e822a3186b30ea22dd0efd19f95b21eeba00f60cfcff6',
        upgradeCap:
          '0x91b755d94170f48e61ee814ab106ea4ab759c35af0f738facdd1b5e153b319d9',
      },
      xOracle: {
        id: '0x9a5a259f0690182cc3d99fce6df69c1256f529b79ac6e7f19a29d4de8b4d85a4',
        upgradeCap:
          '0x4b27a0edc6b080eccada3f8d790f89feb32f5d1b5e9bc33ffa2794a03aac47d5',
      },
      // Deploy for faucet on testnet
      testCoin: {
        id: '0x96f98f84c2d351fe152eebb3b937897d33bae6ee07ae8f60028dca16952862cd',
        upgradeCap:
          '0xe2ee88272b72a1cb57673b5879d947b0a8ca41b4c6f862e950ff294c43a27699',
      },
    },
  },
};

/**
 * it provides methods for managing addresses.
 */
export class ScallopAddressBuilder {
  private _apiClient: AxiosInstance;
  private _id?: string;
  private readonly _auth?: string;
  private readonly _network: NetworkType;
  private _addresses?: AddressesInterface;
  private _addressesMap: Map<NetworkType, AddressesInterface>;

  /**
   * @param params - The address builder parameters.
   */
  public constructor(params?: AddressBuilderParams) {
    const { id, auth, network } = params ?? {};

    if (auth) this._auth = auth;
    this._id = id;
    this._network = network || 'mainnet';
    this._addresses = NEW_ADDRESSES;
    this._addressesMap = new Map();
    this._apiClient = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Get addresses api id.
   *
   * @returns The addresses api id.
   */
  public getId() {
    return this._id;
  }

  /**
   * Get the address at the provided path.
   *
   * @param path - The path of the address to get.
   * @returns The address at the provided path.
   */
  public get(path: AddressStringPath) {
    if (this._addresses) {
      const value = path
        .split('.')
        .reduce(
          (nestedAddressObj: any, key: string) =>
            typeof nestedAddressObj === 'object'
              ? nestedAddressObj[key]
              : nestedAddressObj,
          this._addresses
        );
      return value || undefined;
    } else {
      return undefined;
    }
  }

  /**
   * Set the address at the provided path.
   *
   * @param path - The path of the address to set.
   * @param address - The address be setted to the tartget path.
   * @returns The addresses.
   */
  public set(path: AddressStringPath, address: string) {
    if (this._addresses) {
      const keys = path.split('.');
      keys.reduce((nestedAddressObj: any, key: string, index) => {
        if (index === keys.length - 1) {
          nestedAddressObj[key] = address;
        } else {
          return nestedAddressObj[key];
        }
      }, this._addresses);
    }
    return this._addresses;
  }

  /**
   * Get the addresses.
   *
   * @param network - Specifies which network's addresses you want to get.
   * @returns The addresses.
   */
  public getAddresses(network?: NetworkType) {
    if (network) {
      return this._addressesMap.get(network);
    } else {
      return this._addresses;
    }
  }

  /**
   * Set the addresses into addresses map.
   *
   * @param network - Specifies which network's addresses you want to set.
   * @param addresses - The addresses be setted to the tartget network.
   * @returns The addresses.
   */
  public setAddresses(network?: NetworkType, addresses?: AddressesInterface) {
    const targetNetwork = network || this._network;
    const targetAddresses = addresses || this._addresses || undefined;
    if (targetAddresses) {
      this._addressesMap.set(targetNetwork, targetAddresses);
    } else {
      // TODO: change to new format version
      this._addressesMap.set(targetNetwork, {
        core: {
          market: '',
          adminCap: '',
          coinDecimalsRegistry: '',
          coins: {
            btc: {
              id: '',
              metaData: '',
              treasury: '',
              oracle: {
                supra: '',
                switchboard: '',
                pyth: {
                  feed: '',
                  feedObject: '',
                },
              },
            },
            eth: {
              id: '',
              metaData: '',
              treasury: '',
              oracle: {
                supra: '',
                switchboard: '',
                pyth: {
                  feed: '',
                  feedObject: '',
                },
              },
            },
            usdc: {
              id: '',
              metaData: '',
              treasury: '',
              oracle: {
                supra: '',
                switchboard: '',
                pyth: {
                  feed: '',
                  feedObject: '',
                },
              },
            },
            usdt: {
              id: '',
              metaData: '',
              treasury: '',
              oracle: {
                supra: '',
                switchboard: '',
                pyth: {
                  feed: '',
                  feedObject: '',
                },
              },
            },
            sui: {
              id: '',
              metaData: '',
              treasury: '',
              oracle: {
                supra: '',
                switchboard: '',
                pyth: {
                  feed: '',
                  feedObject: '',
                },
              },
            },
          },
          oracles: {
            xOracle: '',
            xOracleCap: '',
            supra: {},
            switchboard: {
              registry: '',
              registryCap: '',
            },
            pyth: {
              state: '',
              wormhole: '',
              wormholeState: '',
            },
          },
          packages: {
            coinDecimalsRegistry: {
              id: '',
              upgradeCap: '',
            },
            math: {
              id: '',
              upgradeCap: '',
            },
            whitelist: {
              id: '',
              upgradeCap: '',
            },
            x: {
              id: '',
              upgradeCap: '',
            },
            protocol: {
              id: '',
              upgradeCap: '',
            },
            query: {
              id: '',
              upgradeCap: '',
            },
            // Deploy by pyth on testnet
            pyth: {
              id: '',
              upgradeCap: '',
            },
            // Deploy by ourself on testnet
            switchboard: {
              id: '',
              upgradeCap: '',
            },
            xOracle: {
              id: '',
              upgradeCap: '',
            },
            // Deploy for faucet on testnet
            testCoin: {
              id: '',
              upgradeCap: '',
            },
          },
        },
      });
    }
  }

  /**
   * Get all addresses.
   *
   * @returns All addresses.
   */
  public getAllAddresses() {
    return Object.fromEntries(this._addressesMap);
  }

  /**
   * Create a new address through the API and synchronize it back to the
   * builder. If the `network` is not specified, the mainnet is used by default.
   * If no `addresses` is provided, an addresses with all empty strings is created
   * by default.
   *
   * This function only allows for one addresses to be input into a specific network
   * at a time, and does not provide an addresses map for setting addresses
   * across all networks at once.
   *
   * @param network - Specifies which network's addresses you want to set.
   * @param addresses - The addresses be setted to the tartget network.
   * @param auth - The authentication api key.
   * @returns The addresses.
   */
  public async create(
    network?: NetworkType,
    addresses?: AddressesInterface,
    auth?: string
  ) {
    const apiKey = auth || this._auth || undefined;
    const targetNetwork = network || this._network;
    const targetAddresses = addresses || this._addresses || undefined;
    if (apiKey !== undefined) {
      this._addressesMap.clear();
      this.setAddresses(targetNetwork, targetAddresses);
      const response = await this._apiClient.post(
        `${API_BASE_URL}/addresses`,
        JSON.stringify(Object.fromEntries(this._addressesMap)),
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
            if (network === this._network) this._addresses = addresses;
            this._addressesMap.set(network as NetworkType, addresses);
          }
        }
        this._id = response.data.id;
        return this._addresses;
      } else {
        throw Error('Failed to create addresses.');
      }
    } else {
      throw Error("You don't have permission to access this request.");
    }
  }

  /**
   * It doesn't read the data stored in the address builder, but reads and
   * synchronizes the data from the API into builder.
   *
   * @param id - The ID of the addresses to get.
   * @returns The addresses.
   */
  public async read(id?: string) {
    const addressesId = id || this._id || undefined;

    if (addressesId !== undefined) {
      const response = await this._apiClient.get(
        `${API_BASE_URL}/addresses/${addressesId}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        for (const [network, addresses] of Object.entries<AddressesInterface>(
          response.data
        )) {
          if (['localnet', 'devnet', 'testnet', 'mainnet'].includes(network)) {
            if (network === this._network) this._addresses = addresses;
            this._addressesMap.set(network as NetworkType, addresses);
          }
        }
        this._id = response.data.id;
        return this._addresses;
      } else {
        throw Error('Failed to create addresses.');
      }
    }
  }

  /**
   * Update the address through the API and synchronize it back to the
   * builder. If the `network` is not specified, the mainnet is used by default.
   * If no `addresses` is provided, an addresses with all empty strings is created
   * by default.
   *
   * This function only allows for one addresses to be input into a specific network
   * at a time, and does not provide an addresses map for setting addresses
   * across all networks at once.
   *
   * @param id - The ID of the addresses to update.
   * @param network - Specifies which network's addresses you want to set.
   * @param addresses - The addresses be setted to the tartget network.
   * @param auth - The authentication api key.
   * @returns The addresses.
   */
  public async update(
    id?: string,
    network?: NetworkType,
    addresses?: AddressesInterface,
    auth?: string
  ) {
    const apiKey = auth || this._auth || undefined;
    const targetId = id || this._id || undefined;
    const targetNetwork = network || this._network;
    const targetAddresses = addresses || this._addresses || undefined;
    if (targetId === undefined) throw Error('Require addresses id.');
    if (apiKey !== undefined) {
      if (id !== this._id) {
        this._addressesMap.clear();
      }
      this.setAddresses(targetNetwork, targetAddresses);
      const response = await this._apiClient.put(
        `${API_BASE_URL}/addresses/${targetId}`,
        JSON.stringify(Object.fromEntries(this._addressesMap)),
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
            if (network === this._network) this._addresses = addresses;
            this._addressesMap.set(network as NetworkType, addresses);
          }
        }
        this._id = response.data.id;
        return this._addresses;
      } else {
        throw Error('Failed to update addresses.');
      }
    } else {
      throw Error("You don't have permission to access this request.");
    }
  }

  /**
   * Deletes all addresses of a specified id through the API and synchronizes
   * them back to the builder.
   *
   * @param id - The ID of the addresses to delete.
   * @param auth - The authentication api key.
   */
  public async delete(id?: string, auth?: string) {
    const apiKey = auth || this._auth || undefined;
    const targetId = id || this._id || undefined;
    if (targetId === undefined) throw Error('Require addresses id.');
    if (apiKey !== undefined) {
      const response = await this._apiClient.delete(
        `${API_BASE_URL}/addresses/${targetId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': auth || this._auth,
          },
        }
      );

      if (response.status === 200) {
        this._id = undefined;
        this._addresses = undefined;
        this._addressesMap.clear();
      } else {
        throw Error('Failed to delete addresses.');
      }
    } else {
      throw Error("You don't have permission to access this request.");
    }
  }
}
