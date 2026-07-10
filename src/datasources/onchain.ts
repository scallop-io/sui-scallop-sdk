import type { SuiClientTypes } from '@mysten/sui/client';
import { RateLimiter } from './rateLimiter.js';
import { partitionArray } from 'src/utils/array.js';
import type { SuiObjectData } from 'src/types/index.js';

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
  /**
   * How long the `getObject` coalescer accumulates reads before flushing one
   * batched `getObjects`. A single `queueMicrotask` window (`null`) only merges
   * reads enqueued in the exact same microtask, so reads scattered across
   * `await` continuations (the common case once `fetchWithCache` interposes)
   * each became their own `getObjects`-of-1. A small timer window instead
   * flushes after the current event-loop turn drains, catching same-turn reads
   * that land in different microtasks — at the cost of ~one macrotask (<1ms) of
   * latency per read. Default {@link DEFAULT_OBJECT_BATCH_WINDOW_MS}.
   */
  objectBatchWindowMs?: number | null;
};

/**
 * Default coalescing window (ms). `0` flushes on the next macrotask
 * (`setTimeout(…, 0)`) — strictly wider than a microtask, so same-turn reads
 * split across `await` continuations still merge into one batch. Raise it to
 * catch reads spread over a few ms; set to `null` for microtask-only (legacy).
 */
export const DEFAULT_OBJECT_BATCH_WINDOW_MS = 0;

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

/**
 * multiGetObjects caps a single request at 50 ids. `getObject` coalescing chunks
 * deduped ids to this bound before issuing each batch.
 */
const MAX_OBJECTS_PER_BATCH = 50;

/**
 * A single queued `getObject` read awaiting the next microtask flush. `resolve`
 * receives the raw per-object result (data or `Error`); `getObject` unwraps it.
 */
type PendingObjectRead = {
  objectId: string;
  include: SuiClientTypes.ObjectInclude | undefined;
  includeKey: string;
  resolve: (result: SuiObjectData | Error) => void;
  reject: (reason: unknown) => void;
};

/**
 * Canonical, order-independent signature of an `include` selection. Reads only
 * coalesce into the same `getObjects` call when they request identical fields —
 * `getObjects` carries one `include` per request — so `{json:true,type:true}`
 * and `{type:true,json:true}` must produce the same key, while a differing
 * selection stays in its own batch.
 */
const includeSignature = (
  include: SuiClientTypes.ObjectInclude | undefined
): string => {
  if (!include) return '';
  const record = include as Record<string, unknown>;
  return JSON.stringify(
    Object.keys(record)
      .sort()
      .map((key) => [key, record[key]])
  );
};

export class OnChainDataSource {
  public readonly client: OnChainDataSourceClient;
  public readonly url: string;

  /**
   * DataLoader-style coalescing buffer for single-object reads. Every signal-less
   * `getObject` enqueues here and a single microtask flush deduplicates ids and
   * issues one batched `getObjects` per `include` group (≤50 ids each). Without
   * this, N single reads in one tick became N BatchGetObjects-of-1 calls —
   * including byte-identical duplicates that the query-key cache missed because
   * their `include`/key differed.
   */
  private pendingObjectReads: PendingObjectRead[] = [];
  private objectFlushScheduled = false;
  private readonly objectBatchWindowMs: number | null;

  constructor({
    client,
    url,
    tokensPerSecond,
    objectBatchWindowMs = DEFAULT_OBJECT_BATCH_WINDOW_MS,
  }: OnChainDataSourceParams) {
    this.client = withRateLimit(client, new RateLimiter(tokensPerSecond));
    this.url = url;
    this.objectBatchWindowMs = objectBatchWindowMs;
  }

  /**
   * Schedule the next coalescing flush, once per pending batch. A `null` window
   * preserves the legacy microtask flush; a numeric window (default `0`) defers
   * to a macrotask so reads split across `await` continuations in the same turn
   * still batch together.
   */
  private scheduleObjectFlush(): void {
    if (this.objectFlushScheduled) return;
    this.objectFlushScheduled = true;
    if (this.objectBatchWindowMs === null) {
      queueMicrotask(() => this.flushObjectReads());
    } else {
      setTimeout(() => this.flushObjectReads(), this.objectBatchWindowMs);
    }
  }

  async getObject<Include extends SuiClientTypes.ObjectInclude = {}>(
    options: SuiClientTypes.GetObjectOptions<Include>
  ): Promise<SuiClientTypes.GetObjectResponse<Include>> {
    const { objectId, include, signal } = options;

    // Reads carrying an AbortSignal bypass coalescing: a shared batch can't honor
    // one caller's abort without affecting the others, so keep the original
    // single-read path to preserve per-caller cancellation semantics.
    if (signal) {
      const {
        objects: [result],
      } = await this.client.getObjects({
        objectIds: [objectId],
        signal,
        include,
      });
      if (result instanceof Error) {
        throw result;
      }
      return { object: result } as SuiClientTypes.GetObjectResponse<Include>;
    }

    const result = await new Promise<SuiObjectData | Error>(
      (resolve, reject) => {
        this.pendingObjectReads.push({
          objectId,
          include,
          includeKey: includeSignature(include),
          resolve,
          reject,
        });
        this.scheduleObjectFlush();
      }
    );
    if (result instanceof Error) {
      throw result;
    }
    return { object: result } as SuiClientTypes.GetObjectResponse<Include>;
  }

  /**
   * Drain the current tick's queued reads: group by `include` signature, then
   * dispatch each group as deduped, ≤50-id batched `getObjects` calls. Runs once
   * per microtask; reads enqueued after this fires belong to the next batch.
   */
  private flushObjectReads(): void {
    this.objectFlushScheduled = false;
    const batch = this.pendingObjectReads;
    this.pendingObjectReads = [];

    const groups = new Map<string, PendingObjectRead[]>();
    for (const read of batch) {
      const group = groups.get(read.includeKey);
      if (group) {
        group.push(read);
      } else {
        groups.set(read.includeKey, [read]);
      }
    }

    for (const group of groups.values()) {
      void this.dispatchObjectGroup(group);
    }
  }

  /**
   * Fetch one `include` group. Duplicate ids share a single result; ids are
   * chunked to {@link MAX_OBJECTS_PER_BATCH} and each chunk is one `getObjects`
   * call. A chunk-level failure rejects only that chunk's waiters, mirroring the
   * per-object `Error` handling of the original single read.
   */
  private async dispatchObjectGroup(group: PendingObjectRead[]): Promise<void> {
    const include = group[0].include;
    const waitersById = new Map<string, PendingObjectRead[]>();
    for (const read of group) {
      const waiters = waitersById.get(read.objectId);
      if (waiters) {
        waiters.push(read);
      } else {
        waitersById.set(read.objectId, [read]);
      }
    }

    const uniqueIds = [...waitersById.keys()];
    for (const chunk of partitionArray(uniqueIds, MAX_OBJECTS_PER_BATCH)) {
      try {
        const { objects } = await this.client.getObjects({
          objectIds: chunk,
          include,
        });
        chunk.forEach((objectId, index) => {
          const result =
            objects[index] ??
            new Error(`Object ${objectId} missing from batch response`);
          for (const waiter of waitersById.get(objectId) ?? []) {
            waiter.resolve(result);
          }
        });
      } catch (error) {
        for (const objectId of chunk) {
          for (const waiter of waitersById.get(objectId) ?? []) {
            waiter.reject(error);
          }
        }
      }
    }
  }
}
