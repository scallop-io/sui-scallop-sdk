/**
 * Opt-in debug accounting for read-transport volume, shared by every datasource.
 *
 * The {@link GrpcDataSource} rate-limit proxy and the {@link GraphQLDataSource}
 * limiter both call {@link recordRpcCall} on every throttled request, so a
 * maintainer can answer "which transport method spent the budget, how many
 * requests, and how much did they wait on the limiter" — and, via
 * {@link collectRpcStats}, "which facade call emitted them" — without a HAR.
 *
 * Always counting is negligible (a couple of Map writes) and records nothing
 * sensitive: only the transport, the method name, counts, wait time, and a
 * coarse cardinality (how many object ids / coin types a request carried). No
 * addresses, object ids, headers, or payloads. Not part of the public API.
 */

/** Which datasource emitted the call. */
export type RpcTransport = 'onchain' | 'graphql';

export type RpcCallStat = {
  /** Number of throttled requests. */
  calls: number;
  /** Total time (ms) spent waiting on the rate limiter across those requests. */
  waitMs: number;
  /**
   * Summed request cardinality — object ids for `getObjects`, coin types for a
   * balance query, `1` for a single-item request. Distinguishes "one batched
   * request of 50" from "50 requests of 1".
   */
  cardinality: number;
};

/** Stable stat key, e.g. `onchain:getObjects` / `graphql:multiGetBalances`. */
const statKey = (transport: RpcTransport, method: string): string =>
  `${transport}:${method}`;

const globalStats = new Map<string, RpcCallStat>();

/**
 * Stack of active {@link collectRpcStats} scopes. A recorded call updates the
 * global map AND every scope currently on the stack, so nested facade scopes each
 * see the calls made within them.
 */
const scopeStack: Map<string, RpcCallStat>[] = [];

const bump = (
  map: Map<string, RpcCallStat>,
  key: string,
  waitMs: number,
  cardinality: number
): void => {
  const stat = map.get(key) ?? { calls: 0, waitMs: 0, cardinality: 0 };
  stat.calls += 1;
  stat.waitMs += waitMs;
  stat.cardinality += cardinality;
  map.set(key, stat);
};

export const recordRpcCall = (
  transport: RpcTransport,
  method: string,
  waitMs: number,
  cardinality = 1
): void => {
  const key = statKey(transport, method);
  bump(globalStats, key, waitMs, cardinality);
  for (const scope of scopeStack) bump(scope, key, waitMs, cardinality);
};

/** Snapshot the global accounting (deep-copied so callers can't mutate it). */
export const getRpcStats = (): Map<string, RpcCallStat> =>
  new Map([...globalStats].map(([k, v]) => [k, { ...v }]));

export const resetRpcStats = (): void => globalStats.clear();

/**
 * Run `fn` with a fresh accounting scope active and return its result alongside
 * the stats for exactly the calls made inside it — the attribution primitive for
 * a logical facade call (e.g. wrap `getUserPortfolio()` to see its per-transport
 * request breakdown). Scopes nest; the global map keeps accumulating in parallel.
 */
export const collectRpcStats = async <T>(
  fn: () => Promise<T>
): Promise<{ result: T; stats: Map<string, RpcCallStat> }> => {
  const scope = new Map<string, RpcCallStat>();
  scopeStack.push(scope);
  try {
    const result = await fn();
    return { result, stats: scope };
  } finally {
    scopeStack.pop();
  }
};
