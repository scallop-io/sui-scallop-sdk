import axios, { AxiosInstance } from 'axios';
import { queryKeys } from 'src/constants';
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
import { parseStructTag } from '@scallop-io/sui-kit';

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

  private _poolAddresses: Record<string, PoolAddress | undefined> = {};
  private _whitelist: Whitelist = {
    lending: new Set(),
    borrowing: new Set(),
    collateral: new Set(),
    packages: new Set(),
    scoin: new Set(),
    spool: new Set(),
    borrowIncentiveRewards: new Set(),
    suiBridge: new Set(),
    wormhole: new Set(),
    oracles: new Set(),
    pythEndpoints: new Set(),
    deprecated: new Set(),
  };

  private _coinDecimals: Record<string, number | undefined> = {};
  private _coinNameToOldMarketCoinTypeMap: Record<string, string | undefined> =
    {};
  private _scoinRawNameToSCoinNameMap: Record<string, string | undefined> = {};
  private _scoinTypeToSCoinNameMap: Record<string, string | undefined> = {};
  private _wormholeCoinTypeToCoinNameMap: Record<string, string | undefined> =
    {};
  private _voloCoinTypeToCoinNameMap: Record<string, string | undefined> = {};
  private _suiBridgeCoinTypeToCoinNameMap: Record<string, string | undefined> =
    {};
  private _coinTypes: Record<string, string | undefined> = {};
  private _sCoinTypes: Record<string, string | undefined> = {};
  private _coinTypeToCoinNameMap: Record<string, string | undefined> = {};

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
      instance?.cache ??
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

  get isAddressInitialized() {
    return !this.isEmptyObject(this.address.getAllAddresses());
  }

  get isInitialized() {
    return (
      !this.isEmptyObject(this._poolAddresses) &&
      Object.values(this._whitelist).every((t) => t.size > 0) &&
      this.isAddressInitialized
    );
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

  parseToOldMarketCoin(coinType: string) {
    return `${this.protocolObjectId}::reserve::MarketCoin<${coinType}>`;
  }

  get protocolObjectId() {
    return (
      (this.address.get('core.object') as string | undefined) ??
      ('0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf' as const)
    );
  }

  get coinDecimals() {
    if (this.isEmptyObject(this._coinDecimals)) {
      this._coinDecimals = Object.fromEntries([
        ...Object.entries(this.poolAddresses)
          .filter(([_, value]) => !!value)
          .map(([key, value]) => [key, value!.decimals]),
        ...Object.entries(this.poolAddresses)
          .filter(([_, value]) => !!value?.sCoinName)
          .map(([_, value]) => [value!.sCoinName, value!.decimals]),
      ]);
    }
    return this._coinDecimals;
  }

  get coinTypes() {
    if (this.isEmptyObject(this._coinTypes))
      this._coinTypes = Object.fromEntries([
        ...Object.entries(this.poolAddresses)
          .filter(([_, value]) => !!value)
          .map(([key, value]) => [key, value?.coinType]),
        ...Object.entries(this.poolAddresses)
          .filter(([_, value]) => !!value && value.sCoinName && value.sCoinType)
          .map(([_, value]) => [value!.sCoinName, value!.sCoinType]),
      ]);
    return this._coinTypes;
  }

  get wormholeCoinTypeToCoinName() {
    if (this.isEmptyObject(this._wormholeCoinTypeToCoinNameMap))
      this._wormholeCoinTypeToCoinNameMap = Object.fromEntries(
        Object.entries(this.poolAddresses)
          .filter(([key, value]) => !!value && this.whitelist.wormhole.has(key))
          .map(([_, value]) => [value!.coinType, value!.coinName])
      );
    return this._wormholeCoinTypeToCoinNameMap;
  }

  get coinTypeToCoinNameMap() {
    if (this.isEmptyObject(this._coinTypeToCoinNameMap))
      this._coinTypeToCoinNameMap = Object.fromEntries(
        Object.entries(this.coinTypes).map(([key, val]) => [val, key])
      );
    return this._coinTypeToCoinNameMap;
  }

  get coinNameToOldMarketCoinTypeMap() {
    if (this.isEmptyObject(this._coinNameToOldMarketCoinTypeMap))
      this._coinNameToOldMarketCoinTypeMap = Object.fromEntries(
        Object.entries(this.poolAddresses)
          .filter(([_, value]) => !!value && value.spool)
          .map(([_, value]) => [
            value!.coinName,
            this.parseToOldMarketCoin(value!.coinType),
          ])
      );
    return this._coinNameToOldMarketCoinTypeMap;
  }

  get sCoinRawNameToScoinNameMap() {
    if (this.isEmptyObject(this._scoinRawNameToSCoinNameMap))
      this._scoinRawNameToSCoinNameMap = Object.fromEntries(
        Object.entries(this.poolAddresses)
          .filter(([_, value]) => !!value && value.sCoinType && value.sCoinName)
          .map(([_, value]) => {
            const scoinRawName = parseStructTag(value!.sCoinType!).name;
            return [scoinRawName, value!.sCoinName!];
          })
      );

    return this._scoinRawNameToSCoinNameMap;
  }

  get sCoinTypeToSCoinNameMap() {
    if (this.isEmptyObject(this._scoinTypeToSCoinNameMap))
      this._scoinTypeToSCoinNameMap = Object.fromEntries(
        Object.entries(this.poolAddresses)
          .filter(([_, value]) => !!value && value.sCoinType && value.sCoinName)
          .map(([_, value]) => [value!.sCoinType!, value!.sCoinName!])
      );

    return this._scoinTypeToSCoinNameMap;
  }

  get voloCoinTypeToCoinNameMap() {
    if (this.isEmptyObject(this._voloCoinTypeToCoinNameMap))
      this._voloCoinTypeToCoinNameMap = {
        [this.poolAddresses['vsui']!.coinType]: 'vsui',
      };
    return this._voloCoinTypeToCoinNameMap;
  }

  get suiBridgeCoinTypeToCoinNameMap() {
    if (this.isEmptyObject(this._suiBridgeCoinTypeToCoinNameMap))
      this._suiBridgeCoinTypeToCoinNameMap = Object.fromEntries(
        Object.entries(this.poolAddresses)
          .filter(
            ([_, value]) =>
              !!value && this.whitelist.suiBridge.has(value.coinName)
          )
          .map(([_, value]) => [value!.coinType, value!.coinName])
      );
    return this._suiBridgeCoinTypeToCoinNameMap;
  }

  get sCoinTypes() {
    if (this.isEmptyObject(this._sCoinTypes))
      this._sCoinTypes = Object.fromEntries(
        Object.entries(this.poolAddresses)
          .filter(([_, value]) => !!value && value.sCoinName && value.sCoinType)
          .map(([_, value]) => [value!.sCoinName, value!.sCoinType!])
      );

    return this._sCoinTypes;
  }

  get supportedBorrowIncentiveRewards() {
    return new Set([
      ...Object.values(this.poolAddresses)
        .filter((t) => !!t)
        .map((t) => t?.coinName),
    ]);
  }

  private isEmptyObject(obj: Record<string, unknown>) {
    return Object.keys(obj).length === 0;
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
    const response = await this.readApi<Record<keyof Whitelist, string[]>>({
      url:
        this.params.whitelistApiUrl ??
        `https://sui.apis.scallop.io/pool/whitelist/${this.params.whitelistId}`,
      queryKey: queryKeys.api.getWhiteList(),
    });

    return Object.fromEntries(
      Object.entries(response).map(([key, value]) => [key, new Set(value)])
    ) as Whitelist;
  }

  async readPoolAddresses() {
    return await this.readApi<Record<string, PoolAddress>>({
      url:
        this.params.poolAddressesApiUrl ??
        `https://sui.apis.scallop.io/pool/addresses`,
      queryKey: queryKeys.api.getPoolAddresses(),
    });
  }

  async init(params?: Partial<ScallopConstantsParams>) {
    if (!this.isAddressInitialized) {
      await this.address.read();
    }

    if (params?.forcePoolAddressInterface) {
      this._poolAddresses = params?.forcePoolAddressInterface;
    }

    if (params?.forceWhitelistInterface) {
      this._whitelist = params?.forceWhitelistInterface;
    }

    console.log({
      isAddressInitialized: this.isAddressInitialized,
      a: params?.forcePoolAddressInterface,
      b: params?.forceWhitelistInterface,
      isInitialized: this.isInitialized,
    });
    if (this.isInitialized) return;

    const [whitelistResponse, poolAddressesResponse] = await Promise.all([
      this.readWhiteList(),
      this.readPoolAddresses(),
    ]);

    if (!this.params.forceWhitelistInterface) {
      this._whitelist = Object.fromEntries(
        Object.entries(whitelistResponse)
          .filter(([key]) => key !== 'id')
          .map(([key, value]) => [
            key as keyof Whitelist,
            key !== 'id' ? new Set(value) : value,
          ])
      ) as Whitelist;
    }
    if (!this.params.forcePoolAddressInterface)
      this._poolAddresses = Object.fromEntries(
        Object.entries(poolAddressesResponse)
          .filter(([key]) =>
            Object.values(this.whitelist).some((set) => set.has(key))
          )
          .map(([key, value]) => {
            const parsedValue = Object.fromEntries(
              Object.entries(value).map(([k, v]) => [k, v || undefined])
            );
            return [key, parsedValue as PoolAddress];
          })
      );
    console.log({ p: this._poolAddresses });
  }
}
