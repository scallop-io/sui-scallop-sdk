import { Logger } from 'src/logger/Logger.js';
import { BaseContext, DataSourceFallbackArgs } from './types.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import { SuiClientTypes } from '@mysten/sui/client';
import { ScallopError } from 'src/errors/index.js';

// Re-export so the many `import { QuerySource, runWithDataSourceFallback }
// from '../utils.js'` call sites keep resolving after QuerySource moved to
// `./types.js` (the `util.ts`→`utils.ts`/`type.ts`→`types.ts` split).
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

export const getDynamicFieldWithCache = async (
  ctx: Pick<BaseContext, 'onchain' | 'fetchWithCache'>,
  options: SuiClientTypes.GetDynamicFieldOptions
) => {
  return ctx.fetchWithCache({
    queryKey: queryKeys.rpc.getDynamicFieldObject({
      ...options,
      node: ctx.onchain.url,
    }),
    queryFn: () => ctx.onchain.client.getDynamicField(options),
  });
};

/**
 * Object-level "not found" codes the new-gen Sui client raises on a missing
 * object / dynamic field.
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
  ctx: Pick<BaseContext, 'onchain' | 'fetchWithCache'>,
  options: SuiClientTypes.GetDynamicFieldOptions
) => {
  try {
    return await getDynamicFieldWithCache(ctx, options);
  } catch (error) {
    if (isObjectNotFoundError(error)) return null;
    throw error;
  }
};
