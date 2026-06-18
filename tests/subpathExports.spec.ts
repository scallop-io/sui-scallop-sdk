import { describe, expect, it } from 'vitest';

/**
 * Smoke tests that each declared subpath entry resolves and exposes the
 * expected top-level symbols. Vitest resolves these via `src/` (path alias),
 * so tree-shaking can't accidentally hide a re-export.
 */
describe('subpath exports', () => {
  it('src/errors exposes typed error classes', async () => {
    const mod = await import('src/errors/index.js');
    expect(typeof mod.ScallopError).toBe('function');
    expect(typeof mod.ScallopRpcError).toBe('function');
    expect(typeof mod.ScallopIndexerError).toBe('function');
    expect(typeof mod.ScallopParseError).toBe('function');
    expect(typeof mod.ScallopConfigError).toBe('function');
    expect(typeof mod.ScallopTransactionBuildError).toBe('function');
  });

  it('src/logger exposes loggers and the Logger interface', async () => {
    const mod = await import('src/logger/index.js');
    expect(typeof mod.noopLogger).toBe('object');
    expect(typeof mod.noopLogger.warn).toBe('function');
    expect(typeof mod.consoleLogger).toBe('object');
    expect(typeof mod.consoleLogger.warn).toBe('function');
  });

  it('src/client exposes ScallopClient', async () => {
    const mod = await import('src/client/index.js');
    expect(typeof mod.ScallopClient).toBe('function');
  });

  it('src/query exposes ScallopQuery', async () => {
    const mod = await import('src/query/index.js');
    expect(typeof mod.ScallopQuery).toBe('function');
  });

  it('src/builder exposes ScallopBuilder and tx-block factory', async () => {
    const mod = await import('src/builder/index.js');
    expect(typeof mod.ScallopBuilder).toBe('function');
    expect(typeof mod.newScallopTxBlock).toBe('function');
  });

  it('root src exposes facade + all subpath symbols', async () => {
    const mod = await import('src/index.js');
    // facade
    expect(typeof mod.Scallop).toBe('function');
    // errors
    expect(typeof mod.ScallopError).toBe('function');
    // logger
    expect(typeof mod.noopLogger).toBe('object');
    // config
    expect(typeof mod.createScallopConfigSnapshot).toBe('function');
  });

  it('src/types/public resolves as a type-only module', async () => {
    const mod = await import('src/types/public/index.js');
    // Type-only re-exports produce an empty runtime namespace, but the module
    // must still load without throwing.
    expect(mod).toBeDefined();
  });

  it('src/types/internal resolves separately from the public surface', async () => {
    const mod = await import('src/types/internal/index.js');
    expect(mod).toBeDefined();
  });
});
