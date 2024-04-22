import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from '../constants';
import type { NetworkType } from '@scallop-io/sui-kit';
import type {
  ScallopAddressParams,
  AddressesInterface,
  AddressStringPath,
} from '../types';

const EMPTY_ADDRESSES: AddressesInterface = {
  core: {
    version: '',
    versionCap: '',
    object: '',
    market: '',
    adminCap: '',
    coinDecimalsRegistry: '',
    obligationAccessStore: '',
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
      afsui: {
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
      hasui: {
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
      vsui: {
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
      sca: {
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
      supra: {
        registry: '',
        registryCap: '',
        holder: '',
      },
      switchboard: {
        registry: '',
        registryCap: '',
      },
      pyth: {
        registry: '',
        registryCap: '',
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
      pyth: {
        id: '',
        upgradeCap: '',
      },
      switchboard: {
        id: '',
        upgradeCap: '',
      },
      xOracle: {
        id: '',
        upgradeCap: '',
      },
      // Deploy for faucet on testnet.
      testCoin: {
        id: '',
        upgradeCap: '',
      },
    },
  },
  spool: {
    id: '',
    adminCap: '',
    object: '',
    pools: {
      seth: {
        id: '',
        rewardPoolId: '',
      },
      ssui: {
        id: '',
        rewardPoolId: '',
      },
      susdc: {
        id: '',
        rewardPoolId: '',
      },
      susdt: {
        id: '',
        rewardPoolId: '',
      },
      scetus: {
        id: '',
        rewardPoolId: '',
      },
      safsui: {
        id: '',
        rewardPoolId: '',
      },
      shasui: {
        id: '',
        rewardPoolId: '',
      },
      svsui: {
        id: '',
        rewardPoolId: '',
      },
    },
  },
  borrowIncentive: {
    id: '',
    adminCap: '',
    object: '',
    query: '',
    config: '',
    incentivePools: '',
    incentiveAccounts: '',
  },
  vesca: {
    id: '',
    adminCap: '',
    tableId: '',
    table: '',
    treasury: '',
    config: '',
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

  private _requestClient: AxiosInstance;
  private _id?: string;
  private _network: NetworkType;
  private _currentAddresses?: AddressesInterface;
  private _addressesMap: Map<NetworkType, AddressesInterface>;

  public constructor(params: ScallopAddressParams) {
    const { id, auth, network } = params;

    if (auth) this._auth = auth;
    this._id = id;
    this._network = network || 'mainnet';
    this._addressesMap = new Map();
    this._requestClient = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
    });
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
        `${API_BASE_URL}/addresses`,
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
      const response = await this._requestClient.get(
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
      throw Error('Please provide API addresses id.');
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
        `${API_BASE_URL}/addresses/${targetId}`,
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
