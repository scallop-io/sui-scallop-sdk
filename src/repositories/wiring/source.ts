import type { QuerySource } from '../utils.js';

/**
 * The legacy facade-level data-source flags. These remain the public arg shape
 * that backwards-compatible `ScallopQuery` read methods accept; `fromQueryOptions`
 * maps them onto the repositories' `QuerySource`. (The values are the pre-v4
 * vocabulary — `'rpc' | 'indexer' | 'indexer-first'` — deliberately distinct from
 * the repos `QuerySource`.)
 */
export type LegacyQuerySource = 'rpc' | 'indexer' | 'indexer-first';

export type QueryOptions = {
  source?: LegacyQuerySource;
  indexer?: boolean;
};

/**
 * Legacy ScallopQuery read methods expressed data-source choice three different
 * ways: a `QueryOptions.source`, an `indexer: boolean`, or a
 * `useOnChainQuery: boolean`. The repositories layer speaks a single
 * `QuerySource`. `toQuerySource` is the one adapter that normalises the old
 * flags so the facade can stay backwards-compatible while delegating to repos.
 *
 * Precedence: an explicit `source` wins; then `useOnChainQuery`; then `indexer`;
 * otherwise default to `'api-first'` (indexer with onchain fallback) for
 * dual-source domains.
 */
export type SourceFlags = {
  source?: QuerySource;
  indexer?: boolean;
  useOnChainQuery?: boolean;
};

export const toQuerySource = (flags: SourceFlags = {}): QuerySource => {
  if (flags.source) return flags.source;
  if (flags.useOnChainQuery !== undefined) {
    return flags.useOnChainQuery ? 'onchain' : 'api-first';
  }
  if (flags.indexer !== undefined) {
    return flags.indexer ? 'api-first' : 'onchain';
  }
  return 'api-first';
};

const LEGACY_SOURCE: Record<
  NonNullable<QueryOptions['source']>,
  QuerySource
> = {
  rpc: 'onchain',
  indexer: 'api',
  'indexer-first': 'api-first',
};

/**
 * Map a legacy `QueryOptions` ({ source?: 'rpc' | 'indexer' | 'indexer-first',
 * indexer? }) to the repos' `QuerySource`: an explicit legacy `source` wins;
 * else `indexer` → 'api-first', otherwise 'onchain'.
 */
export const fromQueryOptions = (options?: QueryOptions): QuerySource => {
  if (options?.source) return LEGACY_SOURCE[options.source];
  return options?.indexer ? 'api-first' : 'onchain';
};
