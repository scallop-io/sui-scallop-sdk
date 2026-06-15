import type { SuiClientTypes } from '@mysten/sui/client';
import { RateLimiter } from './rateLimiter.js';

const DEFAULT_TOKENS_PER_SECOND = 10;

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
  /** Transport throughput cap (token-bucket). Defaults to 10/s. */
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
        return (...args: unknown[]) => limiter.execute(() => fn(...args));
      }
      return fn;
    },
  });

export class OnChainDataSource {
  public readonly client: OnChainDataSourceClient;
  public readonly url: string;

  constructor({
    client,
    url,
    tokensPerSecond = DEFAULT_TOKENS_PER_SECOND,
  }: OnChainDataSourceParams) {
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
