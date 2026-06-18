import ScallopAddress from '../scallopAddress/index.js';
import { deriveConstants, type DerivedConstants } from './deriveConstants.js';
import {
  createLiveConstantsSource,
  type ConstantsSource,
} from './constantsSource.js';
import {
  loadConstantsState,
  REQUIRED_WHITELIST_KEYS,
  type ConstantsState,
} from './loadConstantsState.js';
import {
  createLiveAddressConfigSource,
  createLivePoolAddressConfigSource,
  createLiveWhitelistConfigSource,
  loadScallopConfigSnapshot,
} from './config/index.js';
import { noopLogger, type Logger } from 'src/logger/index.js';
import type {
  AddressesInterface,
  AddressStringPath,
} from '../scallopAddress/types.js';
import { ScallopConstantsConstructorParams, Whitelist } from './types.js';
import { PoolAddress } from 'src/repositories/poolAddresses/types.js';
import {
  cloneDefaultWhitelist,
  freezePoolAddresses,
  freezeWhitelist,
  isEmptyObject,
} from './utils.js';
import { SuiClientTypes } from '@mysten/sui/client';

/** Empty, fully-frozen state used before `init()` populates real data. */
const createInitialState = (): ConstantsState => {
  const whitelist = freezeWhitelist(cloneDefaultWhitelist());
  const poolAddresses = freezePoolAddresses({});
  return {
    whitelist,
    poolAddresses,
    derived: deriveConstants({
      poolAddresses,
      whitelist,
      parseToOldMarketCoin: () => '',
    }),
  };
};

class ScallopConstants {
  /**
   * Composed address adapter. Owns network/address state, axios client, query
   * client, and the raw REST/HTTP plumbing. Prefer `constants.address.*` going
   * forward; the inline forwarders below exist for v3 API compatibility.
   */
  public readonly address: ScallopAddress;
  public readonly logger: Logger;
  public readonly params: ScallopConstantsConstructorParams;

  /** I/O port: address read + whitelist/pool-address fetch (see constantsSource.ts). */
  private readonly source: ConstantsSource;

  /**
   * The single immutable snapshot holding whitelist + poolAddresses + all
   * derived lookup maps. Replaced wholesale on each `init()`. Every public
   * accessor below is a read-through view onto this.
   */
  private _state: ConstantsState = createInitialState();

  // ===== Derived lookup maps (read-through to the current snapshot) =====
  /** @description coin names to coin decimal map */
  get coinDecimals(): DerivedConstants['coinDecimals'] {
    return this._state.derived.coinDecimals;
  }
  get coinNameToOldMarketCoinTypeMap(): DerivedConstants['coinNameToOldMarketCoinTypeMap'] {
    return this._state.derived.coinNameToOldMarketCoinTypeMap;
  }
  get scoinRawNameToSCoinNameMap(): DerivedConstants['scoinRawNameToSCoinNameMap'] {
    return this._state.derived.scoinRawNameToSCoinNameMap;
  }
  get scoinTypeToSCoinNameMap(): DerivedConstants['scoinTypeToSCoinNameMap'] {
    return this._state.derived.scoinTypeToSCoinNameMap;
  }
  get wormholeCoinTypeToCoinNameMap(): DerivedConstants['wormholeCoinTypeToCoinNameMap'] {
    return this._state.derived.wormholeCoinTypeToCoinNameMap;
  }
  get voloCoinTypeToCoinNameMap(): DerivedConstants['voloCoinTypeToCoinNameMap'] {
    return this._state.derived.voloCoinTypeToCoinNameMap;
  }
  get suiBridgeCoinTypeToCoinNameMap(): DerivedConstants['suiBridgeCoinTypeToCoinNameMap'] {
    return this._state.derived.suiBridgeCoinTypeToCoinNameMap;
  }
  /** @description coin names to coin types map */
  get coinTypes(): DerivedConstants['coinTypes'] {
    return this._state.derived.coinTypes;
  }
  /** @description scoin names to scoin types map */
  get sCoinTypes(): DerivedConstants['sCoinTypes'] {
    return this._state.derived.sCoinTypes;
  }
  get coinTypeToCoinNameMap(): DerivedConstants['coinTypeToCoinNameMap'] {
    return this._state.derived.coinTypeToCoinNameMap;
  }
  /** @description Supported borrow incentive reward coin names */
  get supportedBorrowIncentiveRewards(): DerivedConstants['supportedBorrowIncentiveRewards'] {
    return this._state.derived.supportedBorrowIncentiveRewards;
  }

  constructor(params: ScallopConstantsConstructorParams) {
    const {
      logger = noopLogger,
      scallopAddress,
      defaultValues,
      forcePoolAddressInterface: _forcePoolAddressInterface,
      forceWhitelistInterface: _forceWhitelistInterface,
      strictInit: _strictInit,
      urls: _urls,
      ...scallopAddressArgs
    } = params;
    this.address =
      scallopAddress ??
      new ScallopAddress({
        ...scallopAddressArgs,
        defaultValues: defaultValues?.addresses
          ? { addresses: defaultValues.addresses }
          : undefined,
      });
    this.logger = logger;
    this.params = params;
    this.source =
      params.constantsSource ??
      createLiveConstantsSource({
        address: this.address,
        logger: this.logger,
        defaultValues,
      });
  }

  get url() {
    return this.address.url;
  }

  // ===== Constants-specific surface =====

  get protocolObjectId() {
    return (
      (this.address.get('core.object') as string | undefined) ??
      ('0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf' as const)
    );
  }

  get isInitialized() {
    return this.isInitializedFor('mainnet');
  }

  /**
   * Immutable snapshot of the whitelist. Always populated for every known key
   * (missing keys default to empty sets) so callers do not need null-checks.
   */
  get whitelist(): Readonly<Whitelist> {
    return this._state.whitelist;
  }

  /**
   * Immutable snapshot of pool addresses keyed by coin name. Missing entries
   * are `undefined`.
   */
  get poolAddresses(): Readonly<Record<string, PoolAddress | undefined>> {
    return this._state.poolAddresses;
  }

  get(path: AddressStringPath) {
    return this.address.get(path);
  }

  set(path: AddressStringPath, address: string) {
    return this.address.set(path, address);
  }

  getAddresses(
    network?: SuiClientTypes.Network
  ): AddressesInterface | undefined {
    return this.address.getAddresses(network);
  }

  getAllAddresses() {
    return this.address.getAllAddresses();
  }

  switchCurrentAddresses(network: SuiClientTypes.Network) {
    return this.address.switchCurrentAddresses(network);
  }

  private isAddressInitialized({
    network = 'mainnet',
  }: {
    network?: SuiClientTypes.Network;
  } = {}) {
    const addresses = this.address.getAddresses(network);
    return !!addresses && !isEmptyObject(addresses);
  }

  parseToOldMarketCoin(coinType: string) {
    return `${this.protocolObjectId}::reserve::MarketCoin<${coinType}>`;
  }

  private isInitializedFor(network: SuiClientTypes.Network) {
    return (
      this.isAddressInitialized({ network }) &&
      !isEmptyObject(this._state.poolAddresses) &&
      REQUIRED_WHITELIST_KEYS.every((t) => this._state.whitelist[t].size > 0)
    );
  }

  async init({
    network = 'mainnet',
    force = false,
    addressId,
    constantsParams = this.params,
  }: {
    network?: SuiClientTypes.Network;
    force?: boolean;
    addressId?: string;
    constantsParams?: Partial<ScallopConstantsConstructorParams>;
  } = {}) {
    // The whole acquire → override → (maybe) fetch → filter → freeze → derive
    // pipeline lives in `loadConstantsState`; the facade just holds the result.
    this._state = await loadConstantsState({
      source: this.source,
      network,
      force,
      addressId,
      overrides: {
        forcePoolAddressInterface: constantsParams.forcePoolAddressInterface,
        forceWhitelistInterface: constantsParams.forceWhitelistInterface,
      },
      current: {
        whitelist: this._state.whitelist,
        poolAddresses: this._state.poolAddresses,
      },
      parseToOldMarketCoin: (coinType) => this.parseToOldMarketCoin(coinType),
    });
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
}

export default ScallopConstants;
