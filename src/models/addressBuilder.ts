import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from '../constants';
import type { AddressParams } from 'src/types/model';
import type { AddressesInterface, AddressStringPath } from 'src/types/data';
import type { NetworkType } from '@scallop-io/sui-kit';

/**
 * it provides methods for managing addresses.
 */
export class ScallopAddress {
  private _apiClient: AxiosInstance;
  private _id?: string;
  private readonly _auth?: string;
  private readonly _network: NetworkType;
  private _addresses?: AddressesInterface;
  private _addressesMap: Map<NetworkType, AddressesInterface>;

  /**
   * @param params - The address parameters.
   */
  public constructor(params?: AddressParams) {
    const { id, auth, network } = params ?? {};

    if (auth) this._auth = auth;
    this._id = id;
    this._network = network || 'mainnet';
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
   * instance. If the `network` is not specified, the mainnet is used by default.
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
   * It doesn't read the data stored in the address instance, but reads and
   * synchronizes the data from the API into instance.
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
   * instance. If the `network` is not specified, the mainnet is used by default.
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
   * them back to the instance.
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
