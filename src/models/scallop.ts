import ScallopClient from './scallopClient/index.js';
import {
  ScallopClientConstructorParams,
  type ScallopClientParamsFor,
} from './scallopClient/types.js';
import type { ReadTransport } from './scallopQuery/types.js';
import type { DistributiveMerge } from 'src/types/utils.js';
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
 * const scallopUtils = await sdk.createScallopUtils();
 * ```
 */

// `DistributiveMerge` keeps the `readTransport` transport union at the top level
// so `readTransport: 'graphql'` + `suiClient` (and vice-versa) is rejected here
// at the public entry point. See `src/types/utils.ts`.
export type ScallopConstructorParams = DistributiveMerge<
  ScallopClientConstructorParams,
  {
    client?: ScallopClient<ReadTransport>;
  }
>;

/** `ScallopConstructorParams` carrying the `readTransport` inference site. */
type ScallopParamsFor<T extends ReadTransport> = DistributiveMerge<
  ScallopConstructorParams,
  { readTransport?: T; client?: ScallopClient<T> }
>;

/**
 * `T` is inferred from `readTransport` (omitted ⇒ `'grpc'`), so everything the
 * factory methods hand back — down to `coreClient` — is typed for the transport
 * this instance was configured with.
 */
class Scallop<T extends ReadTransport = 'grpc'> {
  public readonly client: ScallopClient<T>;
  public constructor({ client, ...scallopClientArgs }: ScallopParamsFor<T>) {
    // Cast: the object rest above widens the `readTransport` discriminant — see
    // the matching note in `ScallopClient`.
    this.client =
      client ??
      new ScallopClient(scallopClientArgs as ScallopClientParamsFor<T>);
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
   * Get a scallop constants instance that already has initial data.
   * @returns Scallop Constants
   */
  async getScallopConstants() {
    await this.init();
    return this.client.constants;
  }
}

export default Scallop;
