import ScallopClient, { ScallopClientParams } from './scallopClient.js';
import {
  createScallopContext,
  type ScallopContext,
} from 'src/context/index.js';

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
 * const scallopConstants = await sdk.getScallopConstants();
 * const scallopBuilder = await sdk.createScallopBuilder();
 * const scallopClient = await sdk.createScallopClient();
 * const scallopIndexer = await sdk.createScallopIndexer();
 * const scallopUtils = await sdk.createScallopUtils();
 * ```
 */

export type ScallopParams = {
  client?: ScallopClient;
} & ScallopClientParams;
class Scallop {
  public readonly client: ScallopClient;
  public constructor(params: ScallopParams = {}) {
    this.client = params.client ?? new ScallopClient(params);
  }

  async init(force: boolean = false) {
    await this.client.init(force);
  }

  /**
   * Create a scallop client instance that already has initial data.
   *
   * @return Scallop Client.
   */
  async createScallopClient() {
    await this.init();
    return this.client;
  }

  /**
   * Create a scallop builder instance that already has initial data.
   *
   * @return Scallop Builder.
   */
  async createScallopBuilder() {
    await this.init();
    return this.client.builder;
  }

  /**
   * Create a scallop query instance.
   *
   * @return Scallop Query.
   */
  async createScallopQuery() {
    await this.init();
    return this.client.query;
  }

  /**
   * Create a scallop utils instance.
   *
   * @return Scallop Utils.
   */
  async createScallopUtils() {
    await this.init();
    return this.client.utils;
  }

  /**
   * Create a scallop indexer instance.
   *
   * @return Scallop Indexer.
   */
  async createScallopIndexer() {
    await this.init();
    return this.client.query.indexer;
  }

  /**
   * Get a scallop constants instance that already has initial data.
   * @returns Scallop Constants
   */
  async getScallopConstants() {
    await this.init();
    return this.client.constants;
  }

  /**
   * Build a lightweight ScallopContext for internal services and tests.
   * Public API still goes through `client.builder/query/utils`; this is
   * additive and does not replace existing constructors.
   */
  async getContext(): Promise<ScallopContext> {
    await this.init();
    const utils = this.client.utils;
    return createScallopContext({
      constants: utils.constants,
      scallopSuiKit: utils.scallopSuiKit,
      indexer: this.client.query.indexer,
      queryClient: utils.queryClient,
      logger: utils.logger,
      walletAddress: utils.walletAddress,
    });
  }
}

export default Scallop;
