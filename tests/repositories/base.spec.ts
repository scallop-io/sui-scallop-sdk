import { describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/query-core';
import { BaseRepository } from 'src/repositories/base.js';

// Minimal concrete subclass — BaseRepository is abstract on `context`.
class TestRepository extends BaseRepository<{ extra: string }> {
  get context() {
    return { ...this.baseContext, extra: 'x' };
  }
}

const fakeQueryClient = (fetchQuery: unknown) =>
  ({ fetchQuery }) as unknown as QueryClient;

describe('BaseRepository', () => {
  describe('baseContext', () => {
    it('exposes logger, metadata, and a bound fetchWithCache (no onchain coupling)', () => {
      const logger = {
        warn: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
      };
      const metadata = { tag: 'META' };
      const repo = new TestRepository({
        logger: logger as never,
        metadata,
      });
      const ctx = repo.baseContext;
      // The base intentionally has no `onchain` — repos opt into datasources.
      expect('onchain' in ctx).toBe(false);
      expect(ctx.logger).toBe(logger);
      expect(ctx.metadata).toBe(metadata);
      expect(typeof ctx.fetchWithCache).toBe('function');
    });
  });

  describe('fetchWithCache', () => {
    it('delegates to queryClient.fetchQuery and returns its result', async () => {
      // intent: every network read funnels through here; it must pass options through and return the value
      const fetchQuery = vi.fn().mockResolvedValue('CACHED');
      const repo = new TestRepository({
        queryClient: fakeQueryClient(fetchQuery),
        metadata: {},
      });

      const options = { queryKey: ['k'], queryFn: async () => 'CACHED' };
      const result = await repo.baseContext.fetchWithCache(options as never);

      expect(result).toBe('CACHED');
      expect(fetchQuery).toHaveBeenCalledWith(options);
    });

    it('logs the failing queryKey and rethrows on error (fails loud, not silent)', async () => {
      // intent: a cache/fetch failure must surface — both to the logger and to the caller
      const boom = new Error('fetch failed');
      const fetchQuery = vi.fn().mockRejectedValue(boom);
      const logger = {
        warn: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
      };
      const repo = new TestRepository({
        queryClient: fakeQueryClient(fetchQuery),
        logger: logger as never,
        metadata: {},
      });

      await expect(
        repo.baseContext.fetchWithCache({
          queryKey: ['boom-key'],
          queryFn: async () => 1,
        } as never)
      ).rejects.toBe(boom);

      expect(logger.error).toHaveBeenCalledWith('Error fetching query', {
        queryKey: ['boom-key'],
      });
    });
  });
});
