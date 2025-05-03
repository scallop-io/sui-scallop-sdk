import { NetworkType } from '@scallop-io/sui-kit';
import { API_BASE_URL, queryKeys } from 'src/constants';
import { AddressesInterface, AddressStringPath } from 'src/types';
import ScallopAxios, { ScallopAxiosParams } from './scallopAxios';

export type ScallopAddressParams = {
  addressId?: string;
  addressApiUrl?: string;
  auth?: string;
  network?: NetworkType;
  forceAddressesInterface?: Partial<Record<NetworkType, AddressesInterface>>;
} & ScallopAxiosParams;

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
      cetus: {
        id: '',
        metaData: '',
        treasury: '',
        symbol: '',
        coinType: '',
        decimals: 0,
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: '',
            feedObject: '',
          },
        },
      },
      wapt: {
        id: '',
        metaData: '',
        treasury: '',
        symbol: '',
        coinType: '',
        decimals: 0,
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: '',
            feedObject: '',
          },
        },
      },
      wsol: {
        id: '',
        metaData: '',
        treasury: '',
        symbol: '',
        coinType: '',
        decimals: 0,
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: '',
            feedObject: '',
          },
        },
      },
      wbtc: {
        id: '',
        metaData: '',
        treasury: '',
        symbol: '',
        coinType: '',
        decimals: 0,
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: '',
            feedObject: '',
          },
        },
      },
      weth: {
        id: '',
        metaData: '',
        treasury: '',
        symbol: '',
        coinType: '',
        decimals: 0,
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: '',
            feedObject: '',
          },
        },
      },
      wusdc: {
        id: '',
        metaData: '',
        treasury: '',
        symbol: '',
        coinType: '',
        decimals: 0,
        oracle: {
          supra: '',
          switchboard: '',
          pyth: {
            feed: '',
            feedObject: '',
          },
        },
      },
      wusdt: {
        id: '',
        metaData: '',
        treasury: '',
        symbol: '',
        coinType: '',
        decimals: 0,
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
        symbol: '',
        coinType: '',
        decimals: 0,
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
        symbol: '',
        coinType: '',
        decimals: 0,
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
        symbol: '',
        coinType: '',
        decimals: 0,
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
        symbol: '',
        coinType: '',
        decimals: 0,
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
        symbol: '',
        coinType: '',
        decimals: 0,
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
      primaryPriceUpdatePolicyObject: '',
      secondaryPriceUpdatePolicyObject: '',
      primaryPriceUpdatePolicyVecsetId: '',
      secondaryPriceUpdatePolicyVecsetId: '',
      supra: { registry: '', registryCap: '', holder: '' },
      switchboard: {
        registry: '',
        registryCap: '',
        registryTableId: '',
        state: '',
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
      protocolWhitelist: {
        id: '',
        upgradeCap: '',
      },
      query: {
        id: '',
        upgradeCap: '',
      },
      supra: { id: '', upgradeCap: '' },
      pyth: {
        id: '',
        upgradeCap: '',
      },
      switchboard: { id: '', upgradeCap: '' },
      xOracle: {
        id: '',
        upgradeCap: '',
      },
      testCoin: { id: '', upgradeCap: '' },
    },
  },
  spool: {
    id: '',
    adminCap: '',
    object: '',
    pools: {
      sweth: {
        id: '',
        rewardPoolId: '',
      },
      ssui: {
        id: '',
        rewardPoolId: '',
      },
      swusdc: {
        id: '',
        rewardPoolId: '',
      },
      swusdt: {
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
    config: '',
  },
  borrowIncentive: {
    id: '',
    adminCap: '',
    object: '',
    query: '',
    incentivePools: '',
    incentiveAccounts: '',
    config: '',
  },
  vesca: {
    id: '',
    object: '',
    adminCap: '',
    tableId: '',
    table: '',
    treasury: '',
    config: '',
  },
  referral: {
    id: '',
    version: '',
    object: '',
    adminCap: '',
    referralBindings: '',
    bindingTableId: '',
    referralRevenuePool: '',
    revenueTableId: '',
    referralTiers: '',
    tiersTableId: '',
    authorizedWitnessList: '',
  },
  loyaltyProgram: {
    id: '',
    object: '',
    rewardPool: '',
    userRewardTableId: '',
  },
  scoin: {
    id: '',
    coins: {
      ssui: {
        coinType: '',
        treasury: '',
        metaData: '',
        symbol: '',
      },
      scetus: {
        coinType: '',
        treasury: '',
        metaData: '',
        symbol: '',
      },
      ssca: {
        coinType: '',
        treasury: '',
        metaData: '',
        symbol: '',
      },
      swusdc: {
        coinType: '',
        treasury: '',
        metaData: '',
        symbol: '',
      },
      swusdt: {
        coinType: '',
        treasury: '',
        metaData: '',
        symbol: '',
      },
      sweth: {
        coinType: '',
        treasury: '',
        metaData: '',
        symbol: '',
      },
      safsui: {
        coinType: '',
        treasury: '',
        metaData: '',
        symbol: '',
      },
      shasui: {
        coinType: '',
        treasury: '',
        metaData: '',
        symbol: '',
      },
      svsui: {
        coinType: '',
        treasury: '',
        metaData: '',
        symbol: '',
      },
    },
  },
};

class ScallopAddress {
  private currentAddresses?: AddressesInterface;
  private addressId?: string;
  private network: NetworkType;
  private auth: string;

  public readonly scallopAxios: ScallopAxios;
  private readonly addressMap = new Map<NetworkType, AddressesInterface>();
  private readonly defaultParamValues = {
    addressId: '67c44a103fe1b8c454eb9699',
    network: 'mainnet' as NetworkType,
  } as const;

  constructor(params: ScallopAddressParams = {}) {
    this.scallopAxios = new ScallopAxios({
      ...this.defaultParamValues,
      baseUrl: params.addressApiUrl || API_BASE_URL,
      ...params,
    });

    this.network = params.network ?? 'mainnet';
    this.addressId = params.addressId ?? this.defaultParamValues.addressId;
    this.auth = params.auth ?? '';

    if (params.forceAddressesInterface) {
      this.initializeForcedAddresses(params.forceAddressesInterface);
    }
  }

  private initializeForcedAddresses(
    forcedAddresses: Partial<Record<NetworkType, AddressesInterface>>
  ): void {
    const validNetworks: NetworkType[] = [
      'localnet',
      'devnet',
      'testnet',
      'mainnet',
    ];

    Object.entries(forcedAddresses).forEach(([network, addresses]) => {
      if (validNetworks.includes(network as NetworkType)) {
        const typedNetwork = network as NetworkType;
        this.addressMap.set(typedNetwork, addresses);

        if (typedNetwork === this.network) {
          this.currentAddresses = addresses;
        }
      }
    });
  }

  get axiosClient() {
    return this.scallopAxios;
  }

  get queryClient() {
    return this.axiosClient.queryClient;
  }

  getId() {
    return this.addressId;
  }

  /**
   * Get the address at the provided path.
   *
   * @param path - The path of the address to get.
   * @return The address at the provided path.
   */
  public get(path: AddressStringPath) {
    if (this.currentAddresses) {
      const value = path
        .split('.')
        .reduce(
          (nestedAddressObj: any, key: string) =>
            typeof nestedAddressObj === 'object'
              ? nestedAddressObj[key]
              : nestedAddressObj,
          this.currentAddresses
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
    if (this.currentAddresses) {
      const keys = path.split('.');
      keys.reduce((nestedAddressObj: any, key: string, index) => {
        if (index === keys.length - 1) {
          nestedAddressObj[key] = address;
        } else {
          return nestedAddressObj[key];
        }
      }, this.currentAddresses);
    }
    return this.currentAddresses;
  }

  /**
   * Synchronize the specified network addresses from the addresses map to the
   * current addresses and change the default network to specified network.
   *
   * @param network - Specifies which network's addresses you want to get.
   * @return Current addresses.
   */
  public switchCurrentAddresses(network: NetworkType) {
    if (this.addressMap.has(network)) {
      this.currentAddresses = this.addressMap.get(network);
      this.network = network;
    }
    return this.currentAddresses;
  }

  /**
   * Get the addresses, If `network` is not provided, returns the current
   * addresses or the default network addresses in the addresses map.
   *
   * @param network - Specifies which network's addresses you want to get.
   */
  public getAddresses(network?: NetworkType) {
    if (network) {
      return this.addressMap.get(network);
    } else {
      return this.currentAddresses ?? this.addressMap.get(this.network);
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
    const targetNetwork = network || this.network;
    if (targetNetwork === this.network) this.currentAddresses = addresses;
    this.addressMap.set(targetNetwork, addresses);
  }

  /**
   * Get all addresses.
   *
   * @return All addresses.
   */
  public getAllAddresses() {
    return Object.fromEntries(this.addressMap);
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
  async create(params?: {
    addresses?: AddressesInterface | undefined;
    network?: NetworkType | undefined;
    auth?: string | undefined;
    memo?: string | undefined;
  }) {
    const { addresses, network, auth, memo } = params ?? {};
    const apiKey = auth || this.auth || undefined;
    const targetNetwork = network || this.network;
    const targetAddresses =
      addresses ||
      this.currentAddresses ||
      this.addressMap.get(targetNetwork) ||
      EMPTY_ADDRESSES;

    if (apiKey !== undefined) {
      this.addressMap.clear();
      this.setAddresses(targetAddresses, targetNetwork);
      const response = await this.axiosClient.post(
        `/addresses`,
        JSON.stringify({ ...Object.fromEntries(this.addressMap), memo }),
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': auth || this.auth,
          },
        }
      );

      if (response.status === 201) {
        for (const [network, addresses] of Object.entries<AddressesInterface>(
          response.data
        )) {
          if (['localnet', 'devnet', 'testnet', 'mainnet'].includes(network)) {
            if (network === this.network) this.currentAddresses = addresses;
            this.addressMap.set(network as NetworkType, addresses);
          }
        }
        this.addressId = response.data.id;
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
  async read(id?: string) {
    const addressId = id || this.addressId || undefined;
    if (addressId !== undefined) {
      const response = await this.axiosClient.get(
        `/addresses/${addressId}`,
        queryKeys.api.getAddresses({ addressId }) as string[]
      );

      if (response.status === 200) {
        for (const [network, addresses] of Object.entries<AddressesInterface>(
          response.data
        )) {
          if (['localnet', 'devnet', 'testnet', 'mainnet'].includes(network)) {
            if (network === this.network) this.currentAddresses = addresses;
            this.addressMap.set(network as NetworkType, addresses);
          }
        }
        this.addressId = response.data.id;
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
  async update(params?: {
    id?: string;
    addresses?: AddressesInterface | undefined;
    network?: NetworkType | undefined;
    auth?: string | undefined;
    memo?: string | undefined;
  }) {
    const { id, addresses, network, auth, memo } = params ?? {};
    const apiKey = auth || this.auth || undefined;
    const targetId = id || this.addressId || undefined;
    const targetNetwork = network || this.network;
    const targetAddresses =
      addresses ||
      this.currentAddresses ||
      this.addressMap.get(targetNetwork) ||
      EMPTY_ADDRESSES;

    if (targetId === undefined)
      throw Error('Require specific addresses id to be updated.');
    if (apiKey !== undefined) {
      if (id !== this.addressId) {
        this.addressMap.clear();
      }
      this.setAddresses(targetAddresses, targetNetwork);
      const response = await this.axiosClient.put(
        `/addresses/${targetId}`,
        JSON.stringify({ ...Object.fromEntries(this.addressMap), memo }),
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': auth || this.auth,
          },
        }
      );

      if (response.status === 200) {
        for (const [network, addresses] of Object.entries<AddressesInterface>(
          response.data
        )) {
          if (['localnet', 'devnet', 'testnet', 'mainnet'].includes(network)) {
            if (network === this.network) this.currentAddresses = addresses;
            this.addressMap.set(network as NetworkType, addresses);
          }
        }
        this.addressId = response.data.id;
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
  async delete(id?: string, auth?: string) {
    const apiKey = auth || this.auth || undefined;
    const targetId = id || this.addressId || undefined;

    if (targetId === undefined)
      throw Error('Require specific addresses id to be deleted.');
    if (apiKey !== undefined) {
      const response = await this.axiosClient.delete(`/addresses/${targetId}`, {
        headers: {
          'Content-Type': 'application/json',
          'api-key': auth || this.auth,
        },
      });

      if (response.status === 200) {
        this.addressId = undefined;
        this.currentAddresses = undefined;
        this.addressMap.clear();
      } else {
        throw Error('Failed to delete addresses.');
      }
    } else {
      throw Error("You don't have permission to access this request.");
    }
  }
}

export default ScallopAddress;
