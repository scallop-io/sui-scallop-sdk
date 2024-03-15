import { SuiKit } from '@scallop-io/sui-kit';
import { ScallopAddress } from './scallopAddress';
import { ScallopClient } from './scallopClient';
import { ScallopBuilder } from './scallopBuilder';
import { ScallopQuery } from './scallopQuery';
import { ScallopUtils } from './scallopUtils';
import { ADDRESSES_ID } from '../constants';
import type { ScallopParams } from '../types/';
import { ScallopIndexer } from './scallopIndexer';
import { ScallopCache } from './scallopCache';

/**
 * @description
 * The main instance that controls interaction with the Scallop contract.
 *
 * @example
 * ```typescript
 * const sdk = new Scallop(<parameters>);
 * const scallopAddress = await sdk.getScallopAddress();
 * const scallopBuilder = await sdk.createScallopBuilder();
 * const scallopClient = await sdk.createScallopClient();
 * const scallopIndexer= await sdk.createScallopIndexer();
 * const scallopUtils= await sdk.createScallopUtils();
 * ```
 */
export class Scallop {
  public params: ScallopParams;
  public suiKit: SuiKit;

  private _address: ScallopAddress;
  private _cache: ScallopCache;

  public constructor(params: ScallopParams, cache?: ScallopCache) {
    this.params = params;
    this.suiKit = new SuiKit(params);
    this._cache = cache ?? new ScallopCache();
    this._address = new ScallopAddress(
      {
        id: params?.addressesId || ADDRESSES_ID,
        network: params?.networkType,
      },
      this._cache
    );
  }

  /**
   * Get a scallop address instance that already has read addresses.
   *
   * @param id - The API id of the addresses.
   * @return Scallop Address.
   */
  public async getScallopAddress(id?: string) {
    await this._address.read(id);

    return this._address;
  }

  /**
   * Create a scallop builder instance that already has initial data.
   *
   * @return Scallop Builder.
   */
  public async createScallopBuilder() {
    if (!this._address.getAddresses()) await this._address.read();
    const scallopBuilder = new ScallopBuilder(this.params, {
      suiKit: this.suiKit,
      address: this._address,
      cache: this._cache,
    });

    return scallopBuilder;
  }

  /**
   * Create a scallop client instance that already has initial data.
   *
   * @param walletAddress - When user cannot provide a secret key or mnemonic, the scallop client cannot directly derive the address of the transaction the user wants to sign. This argument specifies the wallet address for signing the transaction.
   * @return Scallop Client.
   */
  public async createScallopClient(walletAddress?: string) {
    if (!this._address.getAddresses()) await this._address.read();
    const scallopClient = new ScallopClient(
      { ...this.params, walletAddress },
      { suiKit: this.suiKit, address: this._address, cache: this._cache }
    );

    return scallopClient;
  }

  /**
   * Create a scallop query instance.
   *
   * @return Scallop Query.
   */
  public async createScallopQuery() {
    if (!this._address.getAddresses()) await this._address.read();
    const scallopQuery = new ScallopQuery(this.params, {
      suiKit: this.suiKit,
      address: this._address,
      cache: this._cache,
    });

    return scallopQuery;
  }

  /**
   * Create a scallop indexer instance.
   *
   * @return Scallop Indexer.
   */
  public async createScallopIndexer() {
    const scallopIndexer = new ScallopIndexer(this.params, {
      cache: this._cache,
    });

    return scallopIndexer;
  }

  /**
   * Create a scallop utils instance.
   *
   * @return Scallop Utils.
   */
  public async createScallopUtils() {
    if (!this._address.getAddresses()) await this._address.read();
    const scallopUtils = new ScallopUtils(this.params, {
      suiKit: this.suiKit,
      address: this._address,
      cache: this._cache,
    });

    return scallopUtils;
  }
}
