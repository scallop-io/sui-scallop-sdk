import type { SuiClientTypes } from '@mysten/sui/client';
import { RateLimiter } from './rateLimiter.js';

const _METHODS = [
  'getObjects',
  'listOwnedObjects',
  'listCoins',
  'listDynamicFields',
  'getDynamicField',
  'getBalance',
  'listBalances',
  'getCoinMetadata',
  'getTransaction',
  'getReferenceGasPrice',
  'getCurrentSystemState',
  'getProtocolConfig',
  'getChainIdentifier',
  'defaultNameServiceName',
  'getMoveFunction',
  'simulateTransaction',
] as const satisfies readonly (keyof SuiClientTypes.TransportMethods)[];

type OnChainDataSourceClient = Pick<
  SuiClientTypes.TransportMethods,
  (typeof _METHODS)[number]
>;

type OnChainDataSourceParams = {
  client: OnChainDataSourceClient;
  url: string;
  /**
   * Transport throughput cap (token-bucket). The SDK's policy default lives in
   * `ScallopUtils` and is forwarded here by `wiring/datasources.ts`. When omitted
   * (direct/standalone construction), `RateLimiter`'s own default applies.
   */
  tokensPerSecond?: number;
};

/**
 * Wrap every allowlisted transport method in a shared rate limiter. This is the
 * single throttle point for ALL on-chain reads — both `onchain.client.<m>(...)`
 * call sites and the convenience `onchain.getObject` (which routes through
 * `this.client.getObjects`). Transport-agnostic: it wraps whatever client the
 * datasource was given (jsonRpc or gRPC), so the limiter applies regardless of
 * the underlying SDK transport.
 */
const RATE_LIMITED_METHODS = new Set<string>(_METHODS);

/**
 * Opt-in debug accounting for on-chain RPC volume. The proxy records, per
 * transport method, how many throttled calls were made and how long they spent
 * waiting on the rate limiter. Always counting is negligible overhead (a Map
 * write); read it from tests via {@link getRpcStats} to find which queries spend
 * the token budget, then {@link resetRpcStats} between cases. Not part of the
 * public API surface.
 */
export type RpcCallStat = { calls: number; waitMs: number };
const rpcStats = new Map<string, RpcCallStat>();
export const getRpcStats = (): Map<string, RpcCallStat> =>
  new Map([...rpcStats].map(([k, v]) => [k, { ...v }]));
export const resetRpcStats = (): void => rpcStats.clear();
const recordRpcCall = (method: string, waitMs: number) => {
  const stat = rpcStats.get(method) ?? { calls: 0, waitMs: 0 };
  stat.calls += 1;
  stat.waitMs += waitMs;
  rpcStats.set(method, stat);
};

const withRateLimit = (
  client: OnChainDataSourceClient,
  limiter: RateLimiter
): OnChainDataSourceClient =>
  new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (typeof value !== 'function') return value;
      const fn = (value as (...args: unknown[]) => Promise<unknown>).bind(
        target
      );
      // Only the allowlisted transport methods are throttled; anything else on
      // the client passes through (still `this`-bound).
      if (typeof prop === 'string' && RATE_LIMITED_METHODS.has(prop)) {
        return (...args: unknown[]) => {
          const start = Date.now();
          return limiter.execute(() => {
            // Time from call to token acquisition = throttle wait for this call.
            recordRpcCall(prop, Date.now() - start);
            return fn(...args);
          });
        };
      }
      return fn;
    },
  });

export class OnChainDataSource {
  public readonly client: OnChainDataSourceClient;
  public readonly url: string;

  constructor({ client, url, tokensPerSecond }: OnChainDataSourceParams) {
    this.client = withRateLimit(client, new RateLimiter(tokensPerSecond));
    this.url = url;
  }

  async getObject<Include extends SuiClientTypes.ObjectInclude = {}>(
    options: SuiClientTypes.GetObjectOptions<Include>
  ): Promise<SuiClientTypes.GetObjectResponse<Include>> {
    const { objectId } = options;
    const {
      objects: [result],
    } = await this.client.getObjects({
      objectIds: [objectId],
      signal: options.signal,
      include: options.include,
    });
    if (result instanceof Error) {
      throw result;
    }
    return { object: result };
  }
}
