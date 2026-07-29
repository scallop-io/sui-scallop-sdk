import { ClientWithCoreApi } from '@mysten/sui/client';
import { SuiGrpcClient } from '@mysten/sui/grpc';

/**
 * Core read methods an on-chain datasource must expose through its `client`.
 * Used as the datasource's runtime self-check (see `GrpcDataSource`) — a fast
 * fail if it is handed a client missing one of these transport reads.
 */
const CORE_METHODS = [
  'getObjects',
  'listOwnedObjects',
  'listCoins',
  'listDynamicFields',
  'getDynamicField',
] as const;

/**
 * Shape of an on-chain datasource. It holds a full transport `client` (all reads
 * go through `.client.<method>` — e.g. the include-capable
 * `client.listDynamicFields`) plus its own cache-key `url`, and exposes a
 * `getObject` convenience. `GrpcDataSource` overrides `getObject` with a
 * request-coalescing implementation rather than a plain client delegation.
 *
 * NOTE: intentionally does NOT `extends SuiClientTypes.TransportMethods` — the
 * datasource is not itself a transport (it wraps one via `client`); forcing it
 * to reimplement all ~20 transport members would defeat having `client`.
 */
interface OnChainDataSource<Client extends ClientWithCoreApi> {
  client: Client;
  url: string;
  getObject: SuiGrpcClient['getObject'];
}

export { CORE_METHODS };
export type { OnChainDataSource };
