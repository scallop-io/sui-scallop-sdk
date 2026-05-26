import type { Logger } from 'src/logger/index.js';

export type QuerySource = 'rpc' | 'indexer' | 'indexer-first';

export type QueryOptions = {
  source?: QuerySource;
  indexer?: boolean;
};

export const resolveQuerySource = (options?: QueryOptions): QuerySource => {
  if (options?.source) return options.source;
  return options?.indexer ? 'indexer-first' : 'rpc';
};

export const runWithSourceFallback = async <T>({
  source,
  indexer,
  rpc,
  label,
  logger,
}: {
  source?: QuerySource;
  indexer: () => Promise<T>;
  rpc: () => Promise<T>;
  label: string;
  logger?: Logger;
}): Promise<T> => {
  switch (source ?? 'rpc') {
    case 'indexer':
      return indexer();
    case 'indexer-first':
      try {
        return await indexer();
      } catch (cause) {
        logger?.warn(`[${label}] indexer failed, falling back to rpc`, {
          cause: cause instanceof Error ? cause.message : String(cause),
        });
        return rpc();
      }
    case 'rpc':
      return rpc();
  }
};
