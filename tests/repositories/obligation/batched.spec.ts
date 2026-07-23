import { beforeEach, describe, expect, it, vi } from 'vitest';

// The batched query builds a real PTB (SuiTxBlock) and resolves shared-object
// args via getSharedObjectData. Neither is what these specs exercise — we pin
// the event→obligation positional mapping and the per-obligation fallback — so
// both are stubbed to keep the test at the batching/parsing layer.
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

import { queryObligationsData } from 'src/repositories/obligation/helpers.js';

const OB_A = '0xOBA';
const OB_B = '0xOBB';
const VERSION = '0xVER';
const MARKET = '0xMKT';

// Drives fetchWithCache by query-key type: object reads resolve a stub object;
// the devInspect read defers to `simulate`, which inspects the query args (so a
// test can return different results for the batched call vs the per-obligation
// fallback calls, distinguished by args length).
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
    grpc: { url: 'mock://node', getObject: vi.fn(), client: {} },
    fetchWithCache,
    metadata: {
      addresses: { queryPackageId: '0xq', version: VERSION, market: MARKET },
    },
    logger,
  } as never;
  return { ctx, fetchWithCache, logger };
};

// A minimal obligation_data event payload; `tag` is an inert marker used to
// assert which obligation a result maps back to.
const event = (tag: string) => ({ json: { collaterals: [], debts: [], tag } });
const okTx = (...tags: string[]) => ({
  Transaction: { status: { success: true }, events: tags.map(event) },
});

// `tag` is an inert marker not on the real MappedObligationQueryData type;
// read it through a cast for the positional-mapping assertions.
const tagOf = (data: unknown) => (data as { tag?: string } | undefined)?.tag;

const inspectCalls = (fetchWithCache: ReturnType<typeof vi.fn>) =>
  fetchWithCache.mock.calls.filter(
    ([{ queryKey }]) => queryKey[1] === 'getInspectTxn'
  );

beforeEach(() => vi.clearAllMocks());

describe('queryObligationsData', () => {
  it('returns {} without any RPC for an empty id list', async () => {
    const { ctx, fetchWithCache } = makeCtx(() => okTx());
    expect(await queryObligationsData(ctx, [])).toEqual({});
    expect(fetchWithCache).not.toHaveBeenCalled();
  });

  it('maps batched events positionally to obligation ids in ONE devInspect', async () => {
    // intent: N obligations → one simulateTransaction; events[i] must land on
    // obligationIds[i]. Reordering here would silently cross-assign balances.
    const { ctx, fetchWithCache } = makeCtx((args) => {
      // batched call carries all obligation ids after [version, market]
      expect(args).toEqual([VERSION, MARKET, OB_A, OB_B]);
      return okTx('A', 'B');
    });

    const result = await queryObligationsData(ctx, [OB_A, OB_B]);

    expect(tagOf(result[OB_A])).toBe('A');
    expect(tagOf(result[OB_B])).toBe('B');
    // exactly one devInspect for the whole batch
    expect(inspectCalls(fetchWithCache)).toHaveLength(1);
  });

  it('falls back to per-obligation queries on an event-count mismatch', async () => {
    // intent: if the batch returns fewer events than obligations, positional
    // mapping is unsafe → must re-query each obligation in isolation.
    const { ctx, logger } = makeCtx((args) =>
      args.length > 3
        ? okTx('only-one') // 1 event for 2 obligations → mismatch
        : // per-obligation fallback: args = [version, market, obligationId]
          okTx(args[2])
    );

    const result = await queryObligationsData(ctx, [OB_A, OB_B]);

    expect(tagOf(result[OB_A])).toBe(OB_A);
    expect(tagOf(result[OB_B])).toBe(OB_B);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('falls back to per-obligation queries when the batch tx aborts', async () => {
    // intent: one bad obligation aborts the whole PTB; fallback restores the
    // isolation the caller relied on so the others still resolve.
    const { ctx, logger } = makeCtx((args) =>
      args.length > 3
        ? {
            FailedTransaction: {
              status: { success: false, error: { message: 'aborted' } },
            },
          }
        : okTx(args[2])
    );

    const result = await queryObligationsData(ctx, [OB_A, OB_B]);

    expect(tagOf(result[OB_A])).toBe(OB_A);
    expect(tagOf(result[OB_B])).toBe(OB_B);
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });

  it('a single obligation skips batching and uses the isolated query path', async () => {
    // intent: no batch upside for one obligation — go straight to the single
    // devInspect (args length 3), never the batched shape.
    const { ctx, fetchWithCache } = makeCtx((args) => {
      expect(args).toEqual([VERSION, MARKET, OB_A]);
      return okTx('solo');
    });

    const result = await queryObligationsData(ctx, [OB_A]);

    expect(tagOf(result[OB_A])).toBe('solo');
    expect(inspectCalls(fetchWithCache)).toHaveLength(1);
  });
});
