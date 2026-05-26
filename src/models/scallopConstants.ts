import {
  AddressesInterface,
  AddressStringPath,
  PoolAddress,
  Whitelist,
} from 'src/types/index.js';
import ScallopAddress, { ScallopAddressParams } from './scallopAddress.js';
import { NetworkType, parseStructTag } from '@scallop-io/sui-kit';
import { queryKeys } from 'src/constants/index.js';
import { parseUrl } from 'src/utils/index.js';
import {
  createLiveAddressConfigSource,
  createLivePoolAddressConfigSource,
  createLiveWhitelistConfigSource,
  loadScallopConfigSnapshot,
} from 'src/config/index.js';
import { QueryKey } from '@tanstack/query-core';
import { AxiosRequestConfig } from 'axios';
import { noopLogger, type Logger } from 'src/logger/index.js';

const isEmptyObject = (obj: object) => {
  return Object.keys(obj).length === 0;
};

type CoinName = string;
type CoinType = string;
type SCoinType = string;
type OldMarketCoinType = string;

/**
 *  @description `scallop_sui`, `scallop_usdt`, etc (parsed directly from coin type, ex: `0x...::scallop_sui::SCALLOP_SUI`)
 */
type SCoinRawName = string;

/**
 * @description `ssui`, `susdc`, etc..
 */
type SCoinName = string;

export type ScallopConstantsParams = {
  urls?: {
    poolAddresses?: string[];
    whitelist?: string[];
  };
  forcePoolAddressInterface?: Record<string, PoolAddress>;
  forceWhitelistInterface?: Whitelist | Record<string, any>;
  defaultValues?: {
    poolAddresses?: Record<string, PoolAddress>;
    whitelist?: Whitelist | Record<string, any>;
  };
  /**
   * When true, `init()` throws `ScallopConfigError` at the tail if required
   * core addresses or required whitelist sets are missing/empty. Defaults to
   * false to preserve the existing best-effort behavior.
   */
  strictInit?: boolean;
  /**
   * Optional pre-built ScallopAddress to compose. When omitted, a new
   * ScallopAddress is constructed from the same params object.
   */
  scallopAddress?: ScallopAddress;
} & ScallopAddressParams;

const DEFAULT_WHITELIST = {
  lending: new Set(),
  borrowing: new Set(),
  collateral: new Set(),
  packages: new Set(),
  scoin: new Set(),
  spool: new Set(),
  borrowIncentiveRewards: new Set(),
  rewardsAsPoint: new Set(),
  suiBridge: new Set(),
  wormhole: new Set(),
  layerZero: new Set(),
  oracles: new Set(),
  pythEndpoints: new Set(),
  deprecated: new Set(),
  emerging: new Set(),
} satisfies Whitelist;

const cloneDefaultWhitelist = (): Whitelist =>
  Object.fromEntries(
    Object.entries(DEFAULT_WHITELIST).map(([key, set]) => [key, new Set(set)])
  ) as Whitelist;

const readonlySet = <T>(values: Iterable<T>): Set<T> => {
  const set = new Set(values);
  const throwReadonlyMutation = () => {
    throw new TypeError('Cannot mutate readonly ScallopConstants whitelist');
  };

  Object.defineProperties(set, {
    add: { value: throwReadonlyMutation },
    clear: { value: throwReadonlyMutation },
    delete: { value: throwReadonlyMutation },
  });

  return Object.freeze(set);
};

const freezeWhitelist = (whitelist: Whitelist): Whitelist =>
  Object.freeze(
    Object.fromEntries(
      Object.entries(whitelist).map(([key, value]) => [key, readonlySet(value)])
    ) as Whitelist
  );

const freezePoolAddresses = (
  poolAddresses: Record<string, PoolAddress | undefined>
): Record<string, PoolAddress | undefined> =>
  Object.freeze(
    Object.fromEntries(
      Object.entries(poolAddresses).map(([key, value]) => [
        key,
        value ? Object.freeze({ ...value }) : undefined,
      ])
    )
  ) as Record<string, PoolAddress | undefined>;

const parseWhitelistParams = (
  params: Record<string, any> | Whitelist
): Whitelist => {
  const merged = cloneDefaultWhitelist();
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      merged[key as keyof Whitelist] = new Set(value);
    } else if (value instanceof Set) {
      merged[key as keyof Whitelist] = new Set(value);
    }
  }
  return freezeWhitelist(merged);
};

class ScallopConstants {
  /**
   * Composed address adapter. Owns network/address state, axios client, query
   * client, and the raw REST/HTTP plumbing. Prefer `constants.address.*` going
   * forward; the inline forwarders below exist for v3 API compatibility.
   */
  public readonly address: ScallopAddress;
  public readonly logger: Logger;

  private _poolAddresses: Record<string, PoolAddress | undefined> =
    freezePoolAddresses({});
  private _whitelist: Whitelist = freezeWhitelist(cloneDefaultWhitelist());

  /**
   * @description coin names to coin decimal map
   */
  public coinDecimals: Record<CoinName, number | undefined> = {};
  public coinNameToOldMarketCoinTypeMap: Record<
    CoinName,
    OldMarketCoinType | undefined
  > = {};
  public scoinRawNameToSCoinNameMap: Record<
    SCoinRawName,
    SCoinName | undefined
  > = {};
  public scoinTypeToSCoinNameMap: Record<SCoinType, SCoinName | undefined> = {};
  public wormholeCoinTypeToCoinNameMap: Record<CoinType, CoinName | undefined> =
    {};
  public voloCoinTypeToCoinNameMap: Record<CoinType, CoinName | undefined> = {};
  public suiBridgeCoinTypeToCoinNameMap: Record<
    CoinType,
    CoinName | undefined
  > = {};

  /**
   * @description coin names to coin types map
   */
  public coinTypes: Record<CoinName, CoinType | undefined> = {};

  /**
   * @description scoin names to scoin types map
   */
  public sCoinTypes: Record<SCoinName, SCoinType | undefined> = {};
  public coinTypeToCoinNameMap: Record<CoinType, CoinName | undefined> = {};

  /**
   * @description Supported borrow incentive reward coin names
   */
  public supportedBorrowIncentiveRewards: Set<CoinName> = new Set();

  constructor(public readonly params: ScallopConstantsParams = {}) {
    this.address = params.scallopAddress ?? new ScallopAddress(params);
    this.logger = params.logger ?? noopLogger;
  }

  // ===== Forwarders preserved for backward compatibility =====
  // Prefer `constants.address.*` going forward.

  get queryClient() {
    return this.address.queryClient;
  }

  get axiosClient() {
    return this.address.axiosClient;
  }

  get scallopAxios() {
    return this.address.scallopAxios;
  }

  get axiosInstance() {
    return this.address.scallopAxios.axiosInstance;
  }

  getId() {
    return this.address.getId();
  }

  get(path: AddressStringPath) {
    return this.address.get(path);
  }

  set(path: AddressStringPath, value: string) {
    return this.address.set(path, value);
  }

  getAddresses(network?: NetworkType) {
    return this.address.getAddresses(network);
  }

  setAddresses(addresses: AddressesInterface, network?: NetworkType) {
    return this.address.setAddresses(addresses, network);
  }

  getAllAddresses() {
    return this.address.getAllAddresses();
  }

  switchCurrentAddresses(network: NetworkType) {
    return this.address.switchCurrentAddresses(network);
  }

  // ===== Constants-specific surface =====

  get protocolObjectId() {
    return (
      (this.get('core.object') as string | undefined) ??
      ('0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf' as const)
    );
  }

  get isInitialized() {
    const REQUIRED_WHITELIST_KEYS = [
      'lending',
      'collateral',
      'borrowing',
      'packages',
      'scoin',
      'spool',
      'oracles',
      'pythEndpoints',
      'emerging',
    ] as const;
    return (
      this.isAddressInitialized() && // address is initialized
      !isEmptyObject(this._poolAddresses) && // poolAddresses is initialized
      REQUIRED_WHITELIST_KEYS.every((t) => this._whitelist[t].size > 0) // whitelist is initialized
    );
  }

  /**
   * Immutable snapshot of the whitelist. Always populated for every known key
   * (missing keys default to empty sets) so callers do not need null-checks.
   */
  get whitelist(): Readonly<Whitelist> {
    return this._whitelist;
  }

  /**
   * Immutable snapshot of pool addresses keyed by coin name. Missing entries
   * are `undefined`.
   */
  get poolAddresses(): Readonly<Record<string, PoolAddress | undefined>> {
    return this._poolAddresses;
  }

  get defaultValues() {
    return this.params.defaultValues;
  }

  private isAddressInitialized({
    networkType = 'mainnet',
  }: {
    networkType?: NetworkType;
  } = {}) {
    const addresses = this.address.getAddresses(networkType);
    return !!addresses && !isEmptyObject(addresses);
  }

  parseToOldMarketCoin(coinType: string) {
    return `${this.protocolObjectId}::reserve::MarketCoin<${coinType}>`;
  }

  async init({
    networkType = 'mainnet',
    force = false,
    addressId,
    constantsParams = this.params,
  }: {
    networkType?: NetworkType;
    force?: boolean;
    addressId?: string;
    constantsParams?: Partial<ScallopConstantsParams>;
  } = {}) {
    // check if scallop address is initialized
    const addresses = this.address.getAddresses(networkType);
    if (!addresses || Object.keys(addresses).length === 0 || force) {
      await this.address.read(addressId);
    }

    if (constantsParams.forcePoolAddressInterface) {
      this._poolAddresses = freezePoolAddresses(
        constantsParams.forcePoolAddressInterface
      );
    }

    if (constantsParams.forceWhitelistInterface) {
      this._whitelist = parseWhitelistParams(
        constantsParams.forceWhitelistInterface
      );
    }

    if (this.isInitialized && !force) {
      this.initConstants();
      this.maybeAssertStrictInit();
      return;
    }

    const [whitelistResponse, poolAddressesResponse] = await Promise.all([
      this.readWhiteList(),
      this.readPoolAddresses(),
    ]);

    if (!this.params.forceWhitelistInterface) {
      const merged = cloneDefaultWhitelist();
      for (const key of Object.keys(merged) as (keyof Whitelist)[]) {
        const value = whitelistResponse[key];
        if (value instanceof Set) {
          merged[key] = value;
        } else if (Array.isArray(value)) {
          merged[key] = new Set(value);
        }
      }
      this._whitelist = freezeWhitelist(merged);
    }

    if (!this.params.forcePoolAddressInterface) {
      this._poolAddresses = freezePoolAddresses(
        Object.fromEntries(
          Object.entries(poolAddressesResponse)
            .filter(([key]) =>
              Object.values(this._whitelist).some((set) => set.has(key))
            )
            .filter(
              (entry): entry is [string, PoolAddress] => entry[1] !== undefined
            )
            .map(([key, value]) => {
              const parsedValue = Object.fromEntries(
                Object.entries(value).map(([k, v]) => [
                  k,
                  typeof v === 'boolean' ? (v ?? false) : v || undefined,
                ])
              );
              return [key, parsedValue as PoolAddress];
            })
        )
      );
    }
    this.initConstants();
    this.maybeAssertStrictInit();
  }

  private maybeAssertStrictInit() {
    if (!this.params.strictInit) return;
    loadScallopConfigSnapshot(
      {
        addressSource: createLiveAddressConfigSource(this),
        poolAddressSource: createLivePoolAddressConfigSource(this),
        whitelistSource: createLiveWhitelistConfigSource(this),
      },
      { validate: true }
    );
  }

  private initConstants() {
    this.coinDecimals = Object.fromEntries([
      ...Object.entries(this._poolAddresses)
        .filter(([_, value]) => !!value)
        .map(([key, value]) => [key, value!.decimals]),
      ...Object.entries(this._poolAddresses)
        .filter(([_, value]) => !!value?.sCoinName)
        .map(([_, value]) => [value!.sCoinName, value!.decimals]),
    ]);

    this.coinTypes = Object.fromEntries([
      ...Object.entries(this._poolAddresses)
        .filter(([_, value]) => !!value)
        .map(([key, value]) => [key, value?.coinType]),
      ...Object.entries(this._poolAddresses)
        .filter(([_, value]) => !!value && value.sCoinName && value.sCoinType)
        .map(([_, value]) => [value!.sCoinName, value!.sCoinType]),
    ]);

    this.coinTypeToCoinNameMap = Object.fromEntries(
      Object.entries(this.coinTypes).map(([key, val]) => [val, key])
    );

    this.wormholeCoinTypeToCoinNameMap = Object.fromEntries(
      Object.entries(this._poolAddresses)
        .filter(([key, value]) => !!value && this._whitelist.wormhole.has(key))
        .map(([_, value]) => [value!.coinType, value!.coinName])
    );

    this.coinNameToOldMarketCoinTypeMap = Object.fromEntries(
      Object.entries(this._poolAddresses)
        .filter(([_, value]) => !!value)
        .map(([_, value]) => [
          value!.coinName,
          this.parseToOldMarketCoin(value!.coinType),
        ])
    );

    this.scoinRawNameToSCoinNameMap = Object.fromEntries(
      Object.entries(this._poolAddresses)
        .filter(([_, value]) => !!value && value.sCoinType && value.sCoinName)
        .map(([_, value]) => {
          const scoinRawName = parseStructTag(value!.sCoinType!).name;
          return [scoinRawName, value!.sCoinName!];
        })
    );

    this.scoinTypeToSCoinNameMap = Object.fromEntries(
      Object.entries(this._poolAddresses)
        .filter(([_, value]) => !!value && value.sCoinType && value.sCoinName)
        .map(([_, value]) => [value!.sCoinType!, value!.sCoinName!])
    );

    const vSuiCoinType = this._poolAddresses['vsui']?.coinType;
    if (vSuiCoinType)
      this.voloCoinTypeToCoinNameMap = {
        [vSuiCoinType]: 'vsui',
      };

    this.suiBridgeCoinTypeToCoinNameMap = Object.fromEntries(
      Object.entries(this._poolAddresses)
        .filter(
          ([_, value]) =>
            !!value && this._whitelist.suiBridge.has(value.coinName)
        )
        .map(([_, value]) => [value!.coinType, value!.coinName])
    );

    this.sCoinTypes = Object.fromEntries(
      Object.entries(this._poolAddresses)
        .filter(([_, value]) => !!value && value.sCoinName && value.sCoinType)
        .map(([_, value]) => [value!.sCoinName, value!.sCoinType!])
    );

    this.supportedBorrowIncentiveRewards = new Set([
      ...Object.values(this._poolAddresses)
        .filter((t) => !!t)
        .map((t) => (t.sCoinName ? [t.coinName, t.sCoinName] : [t.coinName]))
        .flat(),
    ]);
  }

  private async readApi<T>({
    url,
    queryKey,
    config,
  }: {
    url: string;
    queryKey: QueryKey;
    config?: AxiosRequestConfig;
  }) {
    const resp = await this.address.axiosClient.get<T>(url, queryKey, config);
    if (resp.status === 200) {
      return resp.data as T;
    }
    throw Error(
      `Error: ${resp.status}; Failed to read ${url} ${resp.statusText}`
    );
  }

  async readWhiteList() {
    const response = await (async () => {
      const urls = (
        this.params.urls?.whitelist ?? [
          `https://sui.apis.scallop.io/pool/whitelist`,
        ]
      ).map(parseUrl);
      for (const url of urls) {
        try {
          return await this.readApi<Record<keyof Whitelist, string[]>>({
            url,
            queryKey: queryKeys.api.getWhiteList(),
          });
        } catch (e) {
          this.logger.warn('whitelist fetch failed; trying next url', {
            url,
            message: (e as Error)?.message,
          });
        }
      }
      return this.defaultValues?.whitelist ?? cloneDefaultWhitelist();
    })();

    return Object.fromEntries(
      Object.entries(response)
        .filter(([_, value]) => Array.isArray(value) || value instanceof Set)
        .map(([key, value]) => [
          key,
          value instanceof Set ? value : new Set(value),
        ])
    ) as Whitelist;
  }

  async readPoolAddresses() {
    const urls = (
      this.params.urls?.poolAddresses ?? [
        `https://sui.apis.scallop.io/pool/addresses`,
      ]
    ).map(parseUrl);
    for (const url of urls) {
      try {
        return await this.readApi<Record<string, PoolAddress>>({
          url,
          queryKey: queryKeys.api.getPoolAddresses(),
        });
      } catch (e) {
        this.logger.warn('poolAddresses fetch failed; trying next url', {
          url,
          message: (e as Error)?.message,
        });
      }
    }
    return freezePoolAddresses(this.defaultValues?.poolAddresses ?? {});
  }
}

export default ScallopConstants;
