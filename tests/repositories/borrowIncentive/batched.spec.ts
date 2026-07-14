import { beforeEach, describe, expect, it, vi } from 'vitest';

// Same isolation strategy as the obligation batched spec: stub the PTB builder
// and shared-object resolution, and stub the event parsers so each obligation's
// result is distinguishable by coin key — leaving the event→obligation
// positional mapping and the per-obligation fallback as what's under test.
vi.mock('@scallop-io/sui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@scallop-io/sui-kit')>();
  return {
    ...actual,
    SuiTxBlock: class {
      txBlock = { object: { clock: () => ({ kind: 'clock' }) } };
      moveCall = vi.fn();
    },
  };
});

vi.mock('src/utils/object.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('src/utils/object.js')>();
  return {
    ...actual,
    getSharedObjectData: vi.fn(async () => ({ kind: 'sharedArg' })),
  };
});

vi.mock('src/repositories/borrowIncentive/utils.js', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('src/repositories/borrowIncentive/utils.js')
    >();
  return {
    ...actual,
    // Identity: the mocked event `json` is already the query-data shape.
    mapBorrowIncentiveAccountsEvent: vi.fn((raw: unknown) => raw),
    // Each pool_record carries its own poolType straight through.
    parseOriginBorrowIncentiveAccountData: vi.fn(
      (_parse: unknown, accountData: { poolType: string }) => accountData
    ),
  };
});

import { getBorrowIncentiveAccountsBatchFromOnChain } from 'src/repositories/borrowIncentive/helpers.js';

const OB_A = '0xOBA';
const OB_B = '0xOBB';
const INCENTIVE = '0xINC';

const makeCtx = (simulate: (args: string[]) => unknown) => {
  const fetchWithCache = vi.fn(
    async ({
      queryKey,
    }: {
      queryKey: [string, string, { args?: string[]; objectId?: string }];
    }) => {
      const [, method, props] = queryKey;
      if (method === 'getObject')
        return { object: { objectId: props.objectId } };
      if (method === 'getInspectTxn') return simulate(props.args ?? []);
      throw new Error(`unexpected queryKey method: ${method}`);
    }
  );
  const logger = {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };
  const ctx = {
    onchain: { url: 'mock://node', getObject: vi.fn(), client: {} },
    fetchWithCache,
    logger,
    metadata: {
      addresses: {
        borrowIncentive: { query: '0xq', incentiveAccounts: INCENTIVE },
      },
      // parseCoinNameFromType is identity here, so poolType IS the coin name.
      parseCoinNameFromType: (t: string) => t,
      whitelist: {
        lending: new Set([
          'coin-A',
          'coin-B',
          'coin-only',
          'coin-solo',
          `coin-${OB_A}`,
          `coin-${OB_B}`,
        ]),
      },
    },
  } as never;
  return { ctx, fetchWithCache, logger };
};

// One pool_record whose poolType marks which obligation produced the event.
const event = (tag: string) => ({
  json: { pool_records: [{ poolType: `coin-${tag}` }] },
});
const okTx = (...tags: string[]) => ({
  Transaction: { status: { success: true }, events: tags.map(event) },
});

const inspectCalls = (fetchWithCache: ReturnType<typeof vi.fn>) =>
  fetchWithCache.mock.calls.filter(
    ([{ queryKey }]) => queryKey[1] === 'getInspectTxn'
  );

beforeEach(() => vi.clearAllMocks());

describe('getBorrowIncentiveAccountsBatchFromOnChain', () => {
  it('maps batched events positionally to obligation ids in ONE devInspect', async () => {
    // intent: events[i] must map to obligationIds[i]; a swap here would attribute
    // one obligation's incentive accounts to another.
    const { ctx, fetchWithCache } = makeCtx((args) => {
      expect(args).toEqual([INCENTIVE, OB_A, OB_B]);
      return okTx('A', 'B');
    });

    const result = await getBorrowIncentiveAccountsBatchFromOnChain(ctx, {
      obligationIds: [OB_A, OB_B],
    });

    expect(Object.keys(result[OB_A])).toEqual(['coin-A']);
    expect(Object.keys(result[OB_B])).toEqual(['coin-B']);
    expect(inspectCalls(fetchWithCache)).toHaveLength(1);
  });

  it('falls back to per-obligation queries on an event-count mismatch', async () => {
    const { ctx, logger } = makeCtx(
      (args) =>
        args.length > 2
          ? okTx('only') // 1 event for 2 obligations → mismatch
          : okTx(args[1]) // single fallback: args = [incentiveAccounts, obligationId]
    );

    const result = await getBorrowIncentiveAccountsBatchFromOnChain(ctx, {
      obligationIds: [OB_A, OB_B],
    });

    expect(Object.keys(result[OB_A])).toEqual([`coin-${OB_A}`]);
    expect(Object.keys(result[OB_B])).toEqual([`coin-${OB_B}`]);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('falls back to per-obligation queries when the batch tx aborts', async () => {
    const { ctx, logger } = makeCtx((args) =>
      args.length > 2
        ? {
            FailedTransaction: {
              status: { success: false, error: { message: 'aborted' } },
            },
          }
        : okTx(args[1])
    );

    const result = await getBorrowIncentiveAccountsBatchFromOnChain(ctx, {
      obligationIds: [OB_A, OB_B],
    });

    expect(Object.keys(result[OB_A])).toEqual([`coin-${OB_A}`]);
    expect(Object.keys(result[OB_B])).toEqual([`coin-${OB_B}`]);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('a single obligation skips batching and uses the isolated query path', async () => {
    const { ctx, fetchWithCache } = makeCtx((args) => {
      expect(args).toEqual([INCENTIVE, OB_A]);
      return okTx('solo');
    });

    const result = await getBorrowIncentiveAccountsBatchFromOnChain(ctx, {
      obligationIds: [OB_A],
    });

    expect(Object.keys(result[OB_A])).toEqual(['coin-solo']);
    expect(inspectCalls(fetchWithCache)).toHaveLength(1);
  });
});
