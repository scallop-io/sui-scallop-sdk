import { SuiClientTypes } from '@mysten/sui/client';
import { API_BASE_URL } from 'src/constants/index.js';
import { ApiDataSource } from 'src/datasources/api.js';
import { noopLogger, type Logger } from 'src/logger/index.js';
import { AddressApiRepository } from 'src/repositories/addressApi/index.js';
import {
  AddressesInterface,
  AddressPathValue,
  AddressStringPath,
  ScallopAddressConstructorParams,
} from './types.js';

class ScallopAddress {
  public readonly url: string;
  public readonly addressId: string;
  public readonly addressApiRepo: AddressApiRepository;

  private network: SuiClientTypes.Network;
  private logger: Logger;
  private currentAddresses?: AddressesInterface;
  private readonly addressMap = new Map<
    SuiClientTypes.Network,
    AddressesInterface
  >();

  constructor({
    addressId,
    apiDataSourceUrl = API_BASE_URL,
    timeout,
    httpClient,
    network = 'mainnet',
    logger = noopLogger,
    forceAddressesInterface,
  }: ScallopAddressConstructorParams) {
    this.url = apiDataSourceUrl;
    this.addressId = addressId;
    this.network = network;
    this.logger = logger;
    this.addressApiRepo = new AddressApiRepository({
      api: new ApiDataSource({ url: apiDataSourceUrl, timeout, httpClient }),
    });

    if (forceAddressesInterface) {
      this.initializeForcedAddresses(forceAddressesInterface);
    }
  }

  private initializeForcedAddresses(
    forcedAddresses: Partial<Record<SuiClientTypes.Network, AddressesInterface>>
  ): void {
    const validNetworks: SuiClientTypes.Network[] = [
      'localnet',
      'devnet',
      'testnet',
      'mainnet',
    ];

    Object.entries(forcedAddresses).forEach(([network, addresses]) => {
      if (!addresses) {
        this.logger.warn(
          `No addresses provided for network: ${network}. Skipping initialization for this network.`
        );
        return;
      }

      if (validNetworks.includes(network as SuiClientTypes.Network)) {
        const typedNetwork = network as SuiClientTypes.Network;
        this.addressMap.set(typedNetwork, addresses);

        if (typedNetwork === this.network) {
          this.currentAddresses = addresses;
        }
      }
    });
  }

  /**
   * Read and synchronizes all addresses from the API into instance.
   *
   * @param id - The id of the addresses to get.
   * @return All addresses.
   */
  async read(addressId: string = this.addressId) {
    const response = await this.addressApiRepo.read(addressId);

    const isNetworkValid = (
      network: string
    ): network is SuiClientTypes.Network =>
      ['localnet', 'devnet', 'testnet', 'mainnet'].includes(network);

    for (const [network, addresses] of Object.entries(response)) {
      if (isNetworkValid(network) && typeof addresses === 'object') {
        if (network === this.network) this.currentAddresses = addresses;

        this.addressMap.set(network, addresses);
      }
    }
    if (this.addressId !== response.id) {
      this.logger.warn(
        `The addressId provided (${this.addressId}) does not match the id returned from the API (${response.id}).`
      );
    }
    return this.getAllAddresses();
  }

  /**
   * Get the address at the provided path.
   *
   * @param path - The path of the address to get.
   * @return The address at the provided path.
   */
  // Generic over the specific `path` so the return type is the precise value at
  // that path (a leaf `string`, or a sub-object) instead of `any`. This is what
  // makes a structural misuse — e.g. dropping a leaf string into a metadata field
  // typed as `{ registryTableId: string }` — a compile error rather than a silent
  // runtime `undefined`. The `any`/cast inside is confined to the dynamic dotted
  // traversal, which no static type can express; only the *return* is recovered.
  public get<P extends AddressStringPath>(
    path: P
  ): AddressPathValue<AddressesInterface, P> {
    type Value = AddressPathValue<AddressesInterface, P>;
    if (this.currentAddresses) {
      const value = path
        .split('.')
        .reduce(
          (nestedAddressObj: any, key: string) =>
            typeof nestedAddressObj === 'object'
              ? nestedAddressObj[key]
              : nestedAddressObj,
          this.currentAddresses as any
        );
      return (value || undefined) as Value;
    } else {
      return undefined as Value;
    }
  }

  /**
   * Sets the address for the specified path, it does not interact with the API.
   *
   * @param path - The path of the address to set.
   * @param address - The address to be set to the target path.
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
  public switchCurrentAddresses(network: SuiClientTypes.Network) {
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
  public getAddresses(network?: SuiClientTypes.Network) {
    if (network) {
      return this.addressMap.get(network);
    } else {
      return this.currentAddresses ?? this.addressMap.get(this.network);
    }
  }

  /**
   * Get all addresses.
   *
   * @return All addresses.
   */
  public getAllAddresses() {
    return Object.fromEntries(this.addressMap);
  }
}

export default ScallopAddress;
