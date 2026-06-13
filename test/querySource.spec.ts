import { describe, expect, it } from 'vitest';
import { resolveQuerySource, runWithSourceFallback } from 'src/utils/index.js';

describe('query source strategy', () => {
  it('keeps legacy indexer option as indexer-first', () => {
    expect(resolveQuerySource({ indexer: true })).toBe('indexer-first');
    expect(resolveQuerySource({ indexer: false })).toBe('rpc');
    expect(resolveQuerySource({ source: 'indexer' })).toBe('indexer');
  });

  it('falls back to rpc only for indexer-first', async () => {
    const fallback = await runWithSourceFallback({
      source: 'api-first',
      label: 'test',
      indexer: async () => {
        throw new Error('indexer down');
      },
      rpc: async () => 'rpc',
    });

    await expect(
      runWithSourceFallback({
        source: 'indexer',
        label: 'test',
        indexer: async () => {
          throw new Error('indexer down');
        },
        rpc: async () => 'rpc',
      })
    ).rejects.toThrow('indexer down');
    expect(fallback).toBe('rpc');
  });
});
