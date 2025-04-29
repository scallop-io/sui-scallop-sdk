import ScallopClient, { ScallopClientParams } from './scallopClient';

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

export type ScallopParams = {
  client?: ScallopClient;
} & ScallopClientParams;
class Scallop {
  public readonly client: ScallopClient;
  public constructor(params: ScallopParams) {
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
  public async createScallopClient() {
    await this.init();
    return this.client;
  }

  /**
   * Create a scallop builder instance that already has initial data.
   *
   * @return Scallop Builder.
   */
  public async createScallopBuilder() {
    await this.init();
    return this.client.builder;
  }

  /**
   * Create a scallop query instance.
   *
   * @return Scallop Query.
   */
  public async createScallopQuery() {
    await this.init();
    return this.client.query;
  }

  /**
   * Create a scallop utils instance.
   *
   * @return Scallop Utils.
   */
  public async createScallopUtils() {
    await this.init();
    return this.client.utils;
  }

  /**
   * Create a scallop indexer instance.
   *
   * @return Scallop Indexer.
   */
  public async createScallopIndexer() {
    await this.init();
    return this.client.query.indexer;
  }

  /**
   * Get a scallop constants instance that already has initial data.
   * @returns Scallop Constants
   */
  public async getScallopConstants() {
    await this.init();
    return this.client.constants;
  }
}

export default Scallop;
