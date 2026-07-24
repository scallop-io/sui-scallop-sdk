import { Logger } from 'src/logger/Logger.js';
import { BaseContext, DataSourceFallbackArgs } from './types.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import { SuiClientTypes } from '@mysten/sui/client';
import { ScallopError } from 'src/errors/index.js';
import { GrpcDataSource } from 'src/datasources/grpc.js';

// Shared context slice for helpers that perform a gRPC read (`grpc` +
// `fetchWithCache`); exported so per-domain helpers reuse it.
export type GrpcReadContext = Pick<BaseContext, 'fetchWithCache'> & {
  grpc: GrpcDataSource;
};

// Re-export so `import { QuerySource, runWithDataSourceFallback } from
// '../utils.js'` call sites resolve; `QuerySource` is defined in `./types.js`.
export type { QuerySource } from './types.js';

/**
 * Logs the given `error` via the injected `ctx.logger` (if any) and returns it
 * so the caller can `throw` it: `throw logError(ctx.logger, new ScallopRpcError(msg))`.
 * Helpers route their failure throws through this so every failure is surfaced
 * through the SDK's logger before it propagates. Returning (rather than throwing)
 * keeps TypeScript's control-flow narrowing working at the `throw` site.
 *
 * Pass a typed `Scallop*Error` (`ScallopRpcError` / `ScallopIndexerError` /
 * `ScallopParseError`); its `context` is forwarded to the logger automatically.
 */
export const logError = <E extends Error>(
  logger: Logger | undefined,
  error: E
): E => {
  const context = error instanceof ScallopError ? error.context : undefined;
  logger?.error(error.message, context);
  return error;
};

/**
 * Runs `api()` and `onchain()` according to `source`:
 * - `'api'`: runs `api()` only.
 * - `'api-first'` (default): tries `api()`, falls back to `onchain()` if `api()`
 *   throws.
 * - `'onchain'`: runs `onchain()` only.
 *
 * Logs any API failure that triggers a fallback via the injected `logger` (if
 * any).
 */
export const runWithDataSourceFallback = async <T>(
  args: DataSourceFallbackArgs<T>
): Promise<T> => {
  if (args.source === 'api') {
    return args.api();
  }

  if (args.source === 'api-first') {
    try {
      return await args.api();
    } catch (cause) {
      args.logger?.warn(`[${args.label}] api failed, falling back to onchain`, {
        cause: cause instanceof Error ? cause.message : String(cause),
      });
      return args.onchain();
    }
  }

  return args.onchain();
};

export type ReadTransportArgs<T> = {
  /**
   * Whether the GraphQL read transport is active. When `true` (and a `graphql`
   * fn is supplied) the native GraphQL path runs; otherwise `onchain()` runs.
   * Wired from `readTransport === 'graphql'`.
   */
  preferGraphql?: boolean;
  /** Native nested-GraphQL implementation (fewer round trips). Optional. */
  graphql?: () => Promise<T>;
  /** gRPC/Core multi-call implementation — the default (grpc-transport) path. */
  onchain: () => Promise<T>;
  /** Retained for call-site clarity and future diagnostics (see below). */
  label: string;
  /**
   * Retained for parity with {@link DataSourceFallbackArgs} and future
   * diagnostics. Unused today: without a fallback there is nothing to warn
   * about — a failing transport propagates its own error.
   */
  logger?: Logger;
};

/**
 * Select the read path strictly by transport: the native GraphQL query when the
 * GraphQL transport is active (and a `graphql` fn is supplied), else the
 * gRPC/Core `onchain()` path. There is **no automatic fallback** — a failing
 * GraphQL query propagates its error rather than silently degrading to the Core
 * multi-call path, so `readTransport: 'graphql'` means all-GraphQL and
 * `'grpc'` means all-gRPC. Failing loud surfaces a broken native query instead
 * of masking it as a silent perf regression. (`label` is retained for call-site
 * clarity and future diagnostics.)
 */
export const runByReadTransport = async <T>(
  args: ReadTransportArgs<T>
): Promise<T> => {
  if (args.preferGraphql && args.graphql) {
    return args.graphql();
  }
  return args.onchain();
};

export const getDynamicFieldWithCache = async (
  ctx: GrpcReadContext,
  options: SuiClientTypes.GetDynamicFieldOptions
) => {
  return ctx.fetchWithCache({
    queryKey: queryKeys.rpc.getDynamicFieldObject({
      ...options,
      node: ctx.grpc.url,
    }),
    queryFn: () => ctx.grpc.client.getDynamicField(options),
  });
};

/** One dynamic-field entry with its value resolved inline (`value.bcs`). */
export type DynamicFieldWithValue = SuiClientTypes.DynamicFieldEntry & {
  value: SuiClientTypes.DynamicFieldValue;
};

/** One page of {@link DynamicFieldWithValue} entries from `listDynamicFields`. */
export type DynamicFieldsWithValuePage = {
  dynamicFields: DynamicFieldWithValue[];
  hasNextPage: boolean;
  cursor: string | null;
};

/**
 * List ALL dynamic fields of `parentId` with their values inline, paging the
 * Core `listDynamicFields` connection internally with `include: { value: true }`.
 * Transport-agnostic: on the gRPC transport the value rides in the gRPC response;
 * on GraphQL the Core client resolves it via the SDK's own paged query — so this
 * needs no bespoke GraphQL query. The whole scan is memoised under one stable
 * cache key so repeated table walks in a tick share it, and each page is
 * throttled by the datasource's shared rate limiter.
 */
export const listDynamicFieldsWithValues = async (
  ctx: GrpcReadContext,
  parentId: string,
  { pageLimit = 50 }: { pageLimit?: number } = {}
): Promise<DynamicFieldWithValue[]> =>
  ctx.fetchWithCache({
    queryKey: queryKeys.rpc.getDynamicFieldsWithValues({
      node: ctx.grpc.url,
      parentId,
      includeValue: true,
    }),
    queryFn: async () => {
      const fields: DynamicFieldWithValue[] = [];
      let cursor: string | null = null;
      do {
        const resp: DynamicFieldsWithValuePage =
          await ctx.grpc.client.listDynamicFields<{ value: true }>({
            parentId,
            limit: pageLimit,
            cursor,
            include: { value: true },
          });
        fields.push(...resp.dynamicFields);
        cursor = resp.hasNextPage ? resp.cursor : null;
      } while (cursor);
      return fields;
    },
  });

/**
 * Object-level "not found" codes the Sui client raises on a missing object /
 * dynamic field.
 */
const OBJECT_NOT_FOUND_CODES = new Set([
  'notExists',
  'dynamicFieldNotFound',
  'deleted',
]);

/**
 * True when `error` represents a *missing* object / dynamic field, as opposed
 * to a transport / RPC failure. Lets callers map "not present on chain" to
 * `null` while letting real failures propagate (fail-loud).
 *
 * - **jsonRpc**: raises an `ObjectError` carrying a structured `.code`
 *   (authoritative). We duck-type `.code` rather than `instanceof` because the
 *   class isn't part of `@mysten/sui`'s public export surface.
 * - **gRPC**: maps a per-object error to a generic `Error(message)` (see
 *   `@mysten/sui` `grpc/core.ts` — its own "improve error handling" TODO). A
 *   per-object error only appears inside a *successful* batch response, so a
 *   transport failure rejects the whole call and never reaches here; we still
 *   match the message conservatively.
 *
 * NOTE: the gRPC message branch is the one spot guarding the not-found→null
 * contract for the gRPC transport. Confirm the exact message against a mainnet
 * probe of a known-unbound key and tighten if needed.
 */
export const isObjectNotFoundError = (error: unknown): boolean => {
  if (!(error instanceof Error)) return false;
  const code = (error as { code?: unknown }).code;
  if (typeof code === 'string' && OBJECT_NOT_FOUND_CODES.has(code)) return true;
  return /does not exist|not exist|not found|dynamic field|deleted/i.test(
    error.message
  );
};

/**
 * `getDynamicFieldWithCache` that resolves to `null` when the dynamic field is
 * absent instead of throwing. Real RPC/transport failures still propagate. Use
 * for "is X bound?"-style reads whose public contract is value-or-`null`.
 */
export const getDynamicFieldOrNull = async (
  ctx: GrpcReadContext,
  options: SuiClientTypes.GetDynamicFieldOptions
) => {
  try {
    return await getDynamicFieldWithCache(ctx, options);
  } catch (error) {
    if (isObjectNotFoundError(error)) return null;
    throw error;
  }
};
