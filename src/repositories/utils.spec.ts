import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  logError,
  runWithDataSourceFallback,
  isObjectNotFoundError,
  getDynamicFieldWithCache,
  getDynamicFieldOrNull,
} from './utils.js';

const makeLogger = () => ({
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('logError', () => {
  it('logs via logger.error and returns an Error carrying the message', () => {
    const logger = makeLogger();
    const ctx = { foo: 'bar' };
    const err = logError(logger as never, 'boom', ctx);

    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('boom');
    expect(logger.error).toHaveBeenCalledWith('boom', ctx);
  });

  it('does not throw when no logger is supplied', () => {
    const err = logError(undefined, 'no-logger');
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('no-logger');
  });
});

describe('runWithDataSourceFallback', () => {
  it("source 'api' calls api() only", async () => {
    const api = vi.fn().mockResolvedValue('API');
    const onchain = vi.fn().mockResolvedValue('CHAIN');

    const res = await runWithDataSourceFallback({
      source: 'api',
      label: 't',
      api,
      onchain,
    });

    expect(res).toBe('API');
    expect(api).toHaveBeenCalledOnce();
    expect(onchain).not.toHaveBeenCalled();
  });

  it("source 'onchain' calls onchain() only", async () => {
    const onchain = vi.fn().mockResolvedValue('CHAIN');

    const res = await runWithDataSourceFallback({
      source: 'onchain',
      label: 't',
      onchain,
    });

    expect(res).toBe('CHAIN');
    expect(onchain).toHaveBeenCalledOnce();
  });

  it('defaults to onchain() when no source given', async () => {
    const onchain = vi.fn().mockResolvedValue('CHAIN');

    const res = await runWithDataSourceFallback({ label: 't', onchain });

    expect(res).toBe('CHAIN');
    expect(onchain).toHaveBeenCalledOnce();
  });

  it("source 'api-first' returns api() result when api succeeds", async () => {
    const api = vi.fn().mockResolvedValue('API');
    const onchain = vi.fn().mockResolvedValue('CHAIN');

    const res = await runWithDataSourceFallback({
      source: 'api-first',
      label: 't',
      api,
      onchain,
    });

    expect(res).toBe('API');
    expect(onchain).not.toHaveBeenCalled();
  });

  it("source 'api-first' falls back to onchain() and warns when api throws", async () => {
    const logger = makeLogger();
    const api = vi.fn().mockRejectedValue(new Error('api down'));
    const onchain = vi.fn().mockResolvedValue('CHAIN');

    const res = await runWithDataSourceFallback({
      source: 'api-first',
      label: 'MyRepo.getX',
      logger: logger as never,
      api,
      onchain,
    });

    expect(res).toBe('CHAIN');
    expect(api).toHaveBeenCalledOnce();
    expect(onchain).toHaveBeenCalledOnce();
    expect(logger.warn).toHaveBeenCalledOnce();
    expect(logger.warn).toHaveBeenCalledWith(
      '[MyRepo.getX] api failed, falling back to onchain',
      { cause: 'api down' }
    );
  });

  it("source 'api-first' stringifies a non-Error api rejection in the warn cause", async () => {
    const logger = makeLogger();
    const api = vi.fn().mockRejectedValue('plain string');
    const onchain = vi.fn().mockResolvedValue('CHAIN');

    await runWithDataSourceFallback({
      source: 'api-first',
      label: 'L',
      logger: logger as never,
      api,
      onchain,
    });

    expect(logger.warn).toHaveBeenCalledWith(
      '[L] api failed, falling back to onchain',
      { cause: 'plain string' }
    );
  });
});

describe('isObjectNotFoundError', () => {
  it('returns false for non-Error values', () => {
    expect(isObjectNotFoundError('notExists')).toBe(false);
    expect(isObjectNotFoundError(null)).toBe(false);
    expect(isObjectNotFoundError(undefined)).toBe(false);
    expect(isObjectNotFoundError({ code: 'notExists' })).toBe(false);
  });

  it('returns true for an ObjectError-like .code (jsonRpc)', () => {
    for (const code of ['notExists', 'dynamicFieldNotFound', 'deleted']) {
      const err = Object.assign(new Error('unrelated message'), { code });
      expect(isObjectNotFoundError(err)).toBe(true);
    }
  });

  it('returns true for a not-found message (gRPC generic Error)', () => {
    expect(isObjectNotFoundError(new Error('Object 0x1 does not exist'))).toBe(
      true
    );
    expect(isObjectNotFoundError(new Error('dynamic field not present'))).toBe(
      true
    );
    expect(isObjectNotFoundError(new Error('object was deleted'))).toBe(true);
  });

  it('returns false for a real transport error (no code, no match)', () => {
    expect(isObjectNotFoundError(new Error('network timeout'))).toBe(false);
    const err = Object.assign(new Error('boom'), { code: 'internalError' });
    expect(isObjectNotFoundError(err)).toBe(false);
  });
});

describe('getDynamicFieldWithCache', () => {
  const options = { parentId: '0xparent', name: { type: 'u64', bcs: 'AQ==' } };

  it('delegates to ctx.fetchWithCache and returns its result', async () => {
    const fetchWithCache = vi.fn().mockResolvedValue('CACHED');
    const ctx = {
      onchain: { url: 'mock://node', client: { getDynamicField: vi.fn() } },
      fetchWithCache,
    };

    const res = await getDynamicFieldWithCache(ctx as never, options as never);

    expect(res).toBe('CACHED');
    expect(fetchWithCache).toHaveBeenCalledOnce();
  });

  it('queryFn fetches via onchain.client.getDynamicField with the options', async () => {
    const getDynamicField = vi.fn().mockResolvedValue('DF');
    // Execute the queryFn the cache layer would otherwise run.
    const fetchWithCache = vi.fn(
      async ({ queryFn }: { queryFn: () => unknown }) => queryFn()
    );
    const ctx = {
      onchain: { url: 'mock://node', client: { getDynamicField } },
      fetchWithCache,
    };

    const res = await getDynamicFieldWithCache(ctx as never, options as never);

    expect(res).toBe('DF');
    expect(getDynamicField).toHaveBeenCalledWith(options);
  });
});

describe('getDynamicFieldOrNull', () => {
  const options = { parentId: '0xparent', name: { type: 'u64', bcs: 'AQ==' } };

  it('returns the field when present', async () => {
    const ctx = {
      onchain: { url: 'mock://node', client: { getDynamicField: vi.fn() } },
      fetchWithCache: vi.fn().mockResolvedValue('FIELD'),
    };

    expect(await getDynamicFieldOrNull(ctx as never, options as never)).toBe(
      'FIELD'
    );
  });

  it('returns null when the field is absent (not-found code)', async () => {
    const ctx = {
      onchain: { url: 'mock://node', client: { getDynamicField: vi.fn() } },
      fetchWithCache: vi
        .fn()
        .mockRejectedValue(
          Object.assign(new Error('x'), { code: 'dynamicFieldNotFound' })
        ),
    };

    expect(
      await getDynamicFieldOrNull(ctx as never, options as never)
    ).toBeNull();
  });

  it('returns null when the field is absent (not-found message)', async () => {
    const ctx = {
      onchain: { url: 'mock://node', client: { getDynamicField: vi.fn() } },
      fetchWithCache: vi
        .fn()
        .mockRejectedValue(new Error('Object does not exist')),
    };

    expect(
      await getDynamicFieldOrNull(ctx as never, options as never)
    ).toBeNull();
  });

  it('rethrows a real (non-not-found) error', async () => {
    const ctx = {
      onchain: { url: 'mock://node', client: { getDynamicField: vi.fn() } },
      fetchWithCache: vi.fn().mockRejectedValue(new Error('network timeout')),
    };

    await expect(
      getDynamicFieldOrNull(ctx as never, options as never)
    ).rejects.toThrow('network timeout');
  });
});
