import type { SuiKit } from '@scallop-io/sui-kit';
import { OnChainDataSource } from 'src/datasources/onchain.js';
import { IndexerDataSource } from 'src/datasources/indexer.js';

/**
 * SuiKit's current fullnode url, used in RPC cache keys. Returns `''` for
 * custom-client setups (a SuiKit built from `suiClients` has no readable
 * fullnode) — preserving the old `ScallopSuiKit.currentFullNode` behavior.
 */
const currentFullNode = (suiKit: SuiKit): string => {
  try {
    return suiKit.suiInteractor.currentFullNode;
  } catch {
    return '';
  }
};

/**
 * Build the repositories' on-chain datasource from a raw `SuiKit`. This is the
 * only place that knows how a `SuiKit` maps onto an `OnChainDataSource`
 * (new-gen client + node url for cache keys + throughput cap). Repos never
 * touch the models directly.
 */
export const createOnChainDataSource = (
  suiKit: SuiKit,
  options?: { tokensPerSecond?: number }
): OnChainDataSource =>
  new OnChainDataSource({
    // new-gen transport methods (getObjects/simulateTransaction/…) live on `.core`
    client: suiKit.client.core,
    url: currentFullNode(suiKit),
    // The datasource is now the single rate-limit point for every repo read
    // (the old ScallopSuiKit query path is gone).
    tokensPerSecond: options?.tokensPerSecond,
  });

/**
 * The indexer base URL defaults to `SDK_API_BASE_URL` inside `IndexerDataSource`.
 * Pass `url` only to point at a non-default indexer.
 */
export const createIndexerDataSource = (url?: string): IndexerDataSource =>
  new IndexerDataSource({ url });
