import axios, { AxiosInstance } from 'axios';
import { queryKeys, SDK_API_BASE_URL } from 'src/constants';
import {
  PoolAddress,
  ScallopConstantsInstanceParams,
  ScallopConstantsParams,
  Whitelist,
} from 'src/types';
import { ScallopCache } from './scallopCache';
import { QueryKey } from '@tanstack/query-core';
import { newSuiKit } from './suiKit';
import { ScallopAddress } from './scallopAddress';

/**
 * @description
 * It provides methods to construct constants for Scallop SDK instances.
 *
 * @example
 * ```typescript
 * const scallopConstants = new ScallopConstants();
 * await scallopConstants.init();
 * ```
 */
export class ScallopConstants {
  private readonly _requestClient: AxiosInstance;
  public address: ScallopAddress;
  public cache: ScallopCache;

  private _poolAddresses: Record<string, PoolAddress> = {};
  private _whitelist: Whitelist = {
    lending: new Set(),
    borrowing: new Set(),
    collateral: new Set(),
    packages: new Set(),
    scoin: new Set(),
    spool: new Set(),
  };

  constructor(
    public readonly params: ScallopConstantsParams,
    instance?: ScallopConstantsInstanceParams
  ) {
    this.params = params;
    this._requestClient = axios.create({
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 8000,
    });

    this.cache =
      instance?.address?.cache ??
      new ScallopCache(this.params, {
        suiKit: newSuiKit(this.params),
      });

    this.address =
      instance?.address ??
      new ScallopAddress(this.params, {
        cache: this.cache,
      });

    if (params.forcePoolAddressInterface) {
      this._poolAddresses = params.forcePoolAddressInterface;
    }

    if (params.forceWhitelistInterface) {
      this._whitelist = params.forceWhitelistInterface;
    }
  }

  get queryClient() {
    return this.cache.queryClient;
  }

  get poolAddresses() {
    return this._poolAddresses;
  }

  get whitelist() {
    return this._whitelist;
  }

  get protocolObjectId() {
    return (
      (this.address.get('core.object') as string | undefined) ??
      ('0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf' as const)
    );
  }

  private async readApi<T>({
    url,
    queryKey,
  }: {
    url: string;
    queryKey: QueryKey;
  }) {
    const resp = await this.queryClient.fetchQuery({
      queryKey,
      queryFn: async () => {
        return await this._requestClient.get(url);
      },
    });

    if (resp.status === 200) {
      return resp.data as T;
    } else {
      throw Error(
        `Error: ${resp.status}; Failed to read ${url} ${resp.statusText}`
      );
    }
  }

  async readWhiteList() {
    return await this.readApi<Whitelist>({
      url: this.params.whitelistApiUrl ?? '', // @TODO: add whitelist url default
      queryKey: queryKeys.api.getWhiteList(),
    });
  }

  async readPoolAddresses() {
    return await this.readApi<Record<string, PoolAddress>>({
      url:
        this.params.poolAddressesApiUrl ??
        `${SDK_API_BASE_URL}/api/market/coinPoolInfo`,
      queryKey: queryKeys.api.getPoolAddresses(),
    });
  }

  async init() {
    const [whitelistResponse, poolAddressesResponse] = await Promise.all([
      this.readWhiteList(),
      this.readPoolAddresses(),
    ]);
    if (!this.params.forceWhitelistInterface) {
      this._whitelist = whitelistResponse;
    }
    if (!this.params.forcePoolAddressInterface)
      this._poolAddresses = Object.fromEntries(
        Object.entries(poolAddressesResponse).filter(([key]) =>
          Object.values(this.whitelist).some((set) => set.has(key))
        )
      );
  }
}
