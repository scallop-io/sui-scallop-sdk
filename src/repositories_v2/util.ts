import { Logger } from 'src/logger/Logger.js';

export type QuerySource = 'onchain' | 'api' | 'api-first';

/**
 * Logs an error via the injected `ctx.logger` (if any) and returns the built
 * `Error` so the caller can `throw` it: `throw logError(ctx.logger, msg)`.
 * Helpers route their failure throws through this so failures are surfaced
 * through the SDK's logger instead of being silently thrown. Returning (rather
 * than throwing) keeps TypeScript's control-flow narrowing working at the
 * `throw` site.
 */
export const logError = (
  logger: Logger | undefined,
  message: string,
  context?: Record<string, unknown>
): Error => {
  logger?.error(message, context);
  return new Error(message);
};

type OnChainOnlyFallbackArgs<T> = {
  source?: 'onchain';
  onchain: () => Promise<T>;
  label: string;
  logger?: Logger;
};

type ApiFallbackArgs<T> = {
  source: 'api' | 'api-first';
  api: () => Promise<T>;
  onchain: () => Promise<T>;
  label: string;
  logger?: Logger;
};

type DataSourceFallbackArgs<T> =
  | OnChainOnlyFallbackArgs<T>
  | ApiFallbackArgs<T>;

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
