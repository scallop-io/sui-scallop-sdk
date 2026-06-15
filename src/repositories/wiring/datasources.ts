import ScallopSuiKit from 'src/models/scallopSuiKit.js';
import { OnChainDataSource } from 'src/datasources/onchain.js';
import { IndexerDataSource } from 'src/datasources/indexer.js';

/**
 * Build the repositories datasources from the existing models. This is the
 * only place that knows how a `ScallopSuiKit` maps onto an `OnChainDataSource`
 * (new-gen client + node url for cache keys) and how the Scallop indexer maps
 * onto an `IndexerDataSource`. Repos never touch the models directly.
 */
export const createOnChainDataSource = (
  scallopSuiKit: ScallopSuiKit
): OnChainDataSource =>
  new OnChainDataSource({
    // new-gen transport methods (getObjects/simulateTransaction/…) live on `.core`
    client: scallopSuiKit.client.core,
    url: scallopSuiKit.currentFullNode,
  });

/**
 * The indexer base URL defaults to `SDK_API_BASE_URL` inside `IndexerDataSource`.
 * Pass `url` only to point at a non-default indexer.
 */
export const createIndexerDataSource = (url?: string): IndexerDataSource =>
  new IndexerDataSource({ url });
