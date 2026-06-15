import { describe, expect, it, vi } from 'vitest';
import { createScallopContext } from 'src/context/index.js';
import { noopLogger } from 'src/logger/index.js';

describe('ScallopContext', () => {
  const stubQueryClient = {} as unknown as ReturnType<
    typeof createScallopContext
  >['queryClient'];

  const stubConstants = {
    queryClient: stubQueryClient,
  } as unknown as ReturnType<typeof createScallopContext>['constants'];

  const stubSuiKit = {
    currentAddress: '0xabc',
  } as unknown as ReturnType<typeof createScallopContext>['suiKit'];

  const stubExecutor = {} as unknown as ReturnType<
    typeof createScallopContext
  >['executor'];

  it('defaults to noopLogger when none is provided', () => {
    const context = createScallopContext({
      constants: stubConstants,
      suiKit: stubSuiKit,
      executor: stubExecutor,
    });
    expect(context.logger).toBe(noopLogger);
  });

  it('uses provided wallet address override', () => {
    const context = createScallopContext({
      constants: stubConstants,
      suiKit: stubSuiKit,
      executor: stubExecutor,
      walletAddress: '0xfeed',
    });
    expect(context.walletAddress).toBe('0xfeed');
  });

  it('falls back to suiKit.currentAddress', () => {
    const context = createScallopContext({
      constants: stubConstants,
      suiKit: stubSuiKit,
      executor: stubExecutor,
    });
    expect(context.walletAddress).toBe('0xabc');
  });

  it('exposes injected logger and indexer', () => {
    const logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const indexer = {} as unknown as ReturnType<
      typeof createScallopContext
    >['indexer'];
    const context = createScallopContext({
      constants: stubConstants,
      suiKit: stubSuiKit,
      executor: stubExecutor,
      logger,
      indexer,
    });
    expect(context.logger).toBe(logger);
    expect(context.indexer).toBe(indexer);
  });

  it('prefers explicit queryClient over constants.queryClient', () => {
    const alt = {} as unknown as ReturnType<
      typeof createScallopContext
    >['queryClient'];
    const context = createScallopContext({
      constants: stubConstants,
      suiKit: stubSuiKit,
      executor: stubExecutor,
      queryClient: alt,
    });
    expect(context.queryClient).toBe(alt);
  });
});
