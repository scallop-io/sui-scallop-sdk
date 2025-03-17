import { SuiKit } from '@scallop-io/sui-kit';
import { ScallopAddress } from './scallopAddress';
import { ScallopClient } from './scallopClient';
import { ScallopBuilder } from './scallopBuilder';
import { ScallopQuery } from './scallopQuery';
import { ScallopUtils } from './scallopUtils';
import type {
  ScallopBuilderParams,
  ScallopClientParams,
  ScallopConstantsParams,
  ScallopParams,
  ScallopQueryParams,
  ScallopUtilsParams,
} from '../types/';
import { ScallopIndexer } from './scallopIndexer';
import { ScallopCache } from './scallopCache';
import { QueryClientConfig } from '@tanstack/query-core';
import { newSuiKit } from './suiKit';
import { ScallopConstants } from './scallopConstants';
import type { QueryClient } from '@tanstack/query-core';

/**
 * @argument params - The parameters for the Scallop instance.
 * @argument cacheOptions - The cache options for the QueryClient.
 *
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
  public cache: ScallopCache;

  private address: ScallopAddress;
  private constants: ScallopConstants;

  public constructor(
    params: ScallopParams,
    cacheOptions?: QueryClientConfig,
    queryClient?: QueryClient
  ) {
    this.params = params;
    this.suiKit = newSuiKit(params);
    this.cache = new ScallopCache(
      {
        ...this.params,
        cacheOptions,
      },
      {
        suiKit: this.suiKit,
        queryClient,
      }
    );

    this.address = new ScallopAddress(params, {
      cache: this.cache,
    });
    this.constants = new ScallopConstants(params, { address: this.address });
  }

  private async initConstants(params?: Partial<ScallopConstantsParams>) {
    if (!this.constants.isInitialized) await this.constants.init(params);
  }

  /**
   * Get a scallop address instance that already has read addresses.
   *
   * @param id - The API id of the addresses.
   * @return Scallop Address.
   */
  public async getScallopAddress(id?: string) {
    await this.address.read(id);

    return this.address;
  }

  /**
   * Create a scallop builder instance that already has initial data.
   *
   * @return Scallop Builder.
   */
  public async createScallopBuilder(params?: Partial<ScallopBuilderParams>) {
    await this.initConstants(params);
    const builderParams = {
      ...this.params,
      ...params,
    };
    const scallopBuilder = new ScallopBuilder(builderParams, {
      query: await this.createScallopQuery(builderParams),
    });

    return scallopBuilder;
  }

  /**
   * Create a scallop client instance that already has initial data.
   *
   * @param walletAddress - When user cannot provide a secret key or mnemonic, the scallop client cannot directly derive the address of the transaction the user wants to sign. This argument specifies the wallet address for signing the transaction.
   * @return Scallop Client.
   */
  public async createScallopClient(params?: Partial<ScallopClientParams>) {
    await this.initConstants(params);
    const clientParams = {
      ...this.params,
      ...params,
    };
    const scallopClient = new ScallopClient(clientParams, {
      builder: await this.createScallopBuilder(clientParams),
    });

    return scallopClient;
  }

  /**
   * Create a scallop query instance.
   *
   * @return Scallop Query.
   */
  public async createScallopQuery(params?: Partial<ScallopQueryParams>) {
    await this.initConstants(params);
    const queryParams = {
      ...this.params,
      ...params,
    };

    const scallopQuery = new ScallopQuery(queryParams, {
      utils: await this.createScallopUtils(queryParams),
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
      cache: this.cache,
    });

    return scallopIndexer;
  }

  /**
   * Create a scallop utils instance.
   *
   * @return Scallop Utils.
   */
  public async createScallopUtils(params?: Partial<ScallopUtilsParams>) {
    await this.initConstants(params);
    const scallopUtils = new ScallopUtils(
      {
        ...this.params,
        ...params,
      },
      {
        constants: this.constants,
        suiKit: this.suiKit,
      }
    );

    return scallopUtils;
  }
}
