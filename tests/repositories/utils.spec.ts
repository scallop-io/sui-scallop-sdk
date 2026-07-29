import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  logError,
  runWithDataSourceFallback,
  runByReadTransport,
  isObjectNotFoundError,
  getDynamicFieldWithCache,
  getDynamicFieldOrNull,
  getDynamicFieldValueBcsOrNull,
  listDynamicFieldsWithValues,
} from 'src/repositories/utils.js';
import { deriveDynamicFieldID } from '@mysten/sui/utils';
import { ScallopRpcError } from 'src/errors/index.js';

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
  it('logs the typed error via logger.error (forwarding its context) and returns it', () => {
    const logger = makeLogger();
    const error = new ScallopRpcError('boom', { context: { foo: 'bar' } });
    const returned = logError(logger as never, error);

    // returns the SAME instance so callers can `throw logError(...)`
    expect(returned).toBe(error);
    expect(returned).toBeInstanceOf(ScallopRpcError);
    expect(logger.error).toHaveBeenCalledWith('boom', { foo: 'bar' });
  });

  it('logs a plain Error with undefined context and returns it', () => {
    const logger = makeLogger();
    const error = new Error('plain');
    const returned = logError(logger as never, error);

    expect(returned).toBe(error);
    expect(logger.error).toHaveBeenCalledWith('plain', undefined);
  });

  it('does not throw when no logger is supplied', () => {
    const error = new ScallopRpcError('no-logger');
    const returned = logError(undefined, error);
    expect(returned).toBe(error);
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

describe('runByReadTransport', () => {
  it('runs onchain() only when preferGraphql is false', async () => {
    const graphql = vi.fn().mockResolvedValue('GQL');
    const onchain = vi.fn().mockResolvedValue('CHAIN');

    const res = await runByReadTransport({
      preferGraphql: false,
      label: 't',
      graphql,
      onchain,
    });

    expect(res).toBe('CHAIN');
    expect(graphql).not.toHaveBeenCalled();
    expect(onchain).toHaveBeenCalledOnce();
  });

  it('runs onchain() when preferGraphql is true but no graphql fn is given', async () => {
    const onchain = vi.fn().mockResolvedValue('CHAIN');

    const res = await runByReadTransport({
      preferGraphql: true,
      label: 't',
      onchain,
    });

    expect(res).toBe('CHAIN');
    expect(onchain).toHaveBeenCalledOnce();
  });

  it('returns graphql() result when preferGraphql and graphql succeeds', async () => {
    const graphql = vi.fn().mockResolvedValue('GQL');
    const onchain = vi.fn().mockResolvedValue('CHAIN');

    const res = await runByReadTransport({
      preferGraphql: true,
      label: 't',
      graphql,
      onchain,
    });

    expect(res).toBe('GQL');
    expect(onchain).not.toHaveBeenCalled();
  });

  it('propagates a graphql error WITHOUT falling back to onchain (fail loud)', async () => {
    // intent: strict transport — on the graphql transport a failed native query
    // surfaces its error instead of silently degrading to the Core path, so a
    // broken query is visible rather than masked as a perf regression.
    const graphql = vi.fn().mockRejectedValue(new Error('graphql down'));
    const onchain = vi.fn().mockResolvedValue('CHAIN');

    await expect(
      runByReadTransport({
        preferGraphql: true,
        label: 'PoolAddresses.get',
        graphql,
        onchain,
      })
    ).rejects.toThrow('graphql down');

    expect(graphql).toHaveBeenCalledOnce();
    expect(onchain).not.toHaveBeenCalled();
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
      grpc: { url: 'mock://node', client: { getDynamicField: vi.fn() } },
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
      grpc: { url: 'mock://node', client: { getDynamicField } },
      fetchWithCache,
    };

    const res = await getDynamicFieldWithCache(ctx as never, options as never);

    expect(res).toBe('DF');
    expect(getDynamicField).toHaveBeenCalledWith(options);
  });
});

describe('listDynamicFieldsWithValues', () => {
  const entry = (fieldId: string) => ({
    $kind: 'DynamicField',
    fieldId,
    type: '0x2::dynamic_field::Field<u64,bool>',
    name: { type: 'u64', bcs: new Uint8Array([1]) },
    valueType: 'bool',
    value: { type: 'bool', bcs: new Uint8Array([1]) },
  });

  it('pages listDynamicFields until hasNextPage is false, concatenating entries', async () => {
    // intent: a full table walk follows the cursor across pages
    const listDynamicFields = vi
      .fn()
      .mockResolvedValueOnce({
        dynamicFields: [entry('0xa')],
        hasNextPage: true,
        cursor: 'c1',
      })
      .mockResolvedValueOnce({
        dynamicFields: [entry('0xb')],
        hasNextPage: false,
        cursor: null,
      });
    // passthrough cache: run the queryFn the cache layer would memoize
    const fetchWithCache = vi.fn(
      async ({ queryFn }: { queryFn: () => unknown }) => queryFn()
    );
    const ctx = {
      grpc: { url: 'mock://node', client: { listDynamicFields } },
      fetchWithCache,
    };

    const fields = await listDynamicFieldsWithValues(ctx as never, '0xparent');

    expect(fields.map((f) => f.fieldId)).toEqual(['0xa', '0xb']);
    expect(listDynamicFields).toHaveBeenCalledTimes(2);
  });

  it('requests values inline via include: { value: true }', async () => {
    // intent: the scan must carry the inline value so callers avoid a second getObjects
    const listDynamicFields = vi.fn().mockResolvedValue({
      dynamicFields: [entry('0xa')],
      hasNextPage: false,
      cursor: null,
    });
    const fetchWithCache = vi.fn(
      async ({ queryFn }: { queryFn: () => unknown }) => queryFn()
    );
    const ctx = {
      grpc: { url: 'mock://node', client: { listDynamicFields } },
      fetchWithCache,
    };

    await listDynamicFieldsWithValues(ctx as never, '0xparent');

    expect(listDynamicFields).toHaveBeenCalledWith(
      expect.objectContaining({
        parentId: '0xparent',
        include: { value: true },
      })
    );
  });
});

describe('getDynamicFieldOrNull', () => {
  const options = { parentId: '0xparent', name: { type: 'u64', bcs: 'AQ==' } };

  it('returns the field when present', async () => {
    const ctx = {
      grpc: { url: 'mock://node', client: { getDynamicField: vi.fn() } },
      fetchWithCache: vi.fn().mockResolvedValue('FIELD'),
    };

    expect(await getDynamicFieldOrNull(ctx as never, options as never)).toBe(
      'FIELD'
    );
  });

  it('returns null when the field is absent (not-found code)', async () => {
    const ctx = {
      grpc: { url: 'mock://node', client: { getDynamicField: vi.fn() } },
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
      grpc: { url: 'mock://node', client: { getDynamicField: vi.fn() } },
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
      grpc: { url: 'mock://node', client: { getDynamicField: vi.fn() } },
      fetchWithCache: vi.fn().mockRejectedValue(new Error('network timeout')),
    };

    await expect(
      getDynamicFieldOrNull(ctx as never, options as never)
    ).rejects.toThrow('network timeout');
  });
});

describe('getDynamicFieldValueBcsOrNull', () => {
  const PARENT_ID = `0x${'ab'.repeat(32)}`;
  const NAME_TYPE = 'address';
  // Arbitrary bytes standing in for a serialized field name.
  const NAME_BCS = new Uint8Array([1, 2, 3]);
  const VALUE_BCS = new Uint8Array([9, 8, 7, 6]);

  const options = {
    parentId: PARENT_ID,
    name: { type: NAME_TYPE, bcs: NAME_BCS },
  };

  /** `Field<Name, Value>` content: 32-byte UID, then name, then value. */
  const makeContent = (nameBcs: Uint8Array, valueBcs: Uint8Array) =>
    new Uint8Array([...new Uint8Array(32).fill(7), ...nameBcs, ...valueBcs]);

  const makeCtx = (
    getObject: ReturnType<typeof vi.fn>,
    getDynamicField = vi.fn()
  ) => ({
    grpc: {
      url: 'https://node.example',
      getObject,
      client: { getDynamicField },
    },
    fetchWithCache: (o: { queryFn: () => unknown }) => o.queryFn(),
  });

  it('reads the derived field object via the coalescer, not getDynamicField', async () => {
    const getObject = vi.fn().mockResolvedValue({
      object: { content: makeContent(NAME_BCS, VALUE_BCS) },
    });
    const getDynamicField = vi.fn();
    const ctx = makeCtx(getObject, getDynamicField);

    const result = await getDynamicFieldValueBcsOrNull(
      ctx as never,
      options as never
    );

    // The whole point of F4: the read goes through `grpc.getObject` so it joins the
    // shared batch, instead of becoming its own single-object request.
    expect(getObject).toHaveBeenCalledTimes(1);
    expect(getDynamicField).not.toHaveBeenCalled();
    expect(result).toEqual(VALUE_BCS);

    // And it must ask for the locally derived child id — the same id the transport
    // would have resolved server-side.
    const expectedId = deriveDynamicFieldID(PARENT_ID, NAME_TYPE, NAME_BCS);
    expect(getObject.mock.calls[0][0]).toMatchObject({ objectId: expectedId });
  });

  it('slices the value at 32 + name length, so name size shifts the offset', async () => {
    // A longer name must push the value start out by exactly that much; a fixed
    // offset would silently return the wrong bytes here.
    const longName = new Uint8Array([1, 2, 3, 4, 5, 6, 7]);
    const getObject = vi.fn().mockResolvedValue({
      object: { content: makeContent(longName, VALUE_BCS) },
    });

    const result = await getDynamicFieldValueBcsOrNull(
      makeCtx(getObject) as never,
      { parentId: PARENT_ID, name: { type: NAME_TYPE, bcs: longName } } as never
    );

    expect(result).toEqual(VALUE_BCS);
  });

  it('falls back to the transport when content is shorter than the offset', async () => {
    // Layout is not what we assume — correctness must win over batching.
    const getObject = vi
      .fn()
      .mockResolvedValue({ object: { content: new Uint8Array(4) } });
    const getDynamicField = vi
      .fn()
      .mockResolvedValue({ dynamicField: { value: { bcs: VALUE_BCS } } });

    const result = await getDynamicFieldValueBcsOrNull(
      makeCtx(getObject, getDynamicField) as never,
      options as never
    );

    expect(getDynamicField).toHaveBeenCalledTimes(1);
    expect(result).toEqual(VALUE_BCS);
  });

  it('resolves to null when the field object does not exist', async () => {
    const getObject = vi
      .fn()
      .mockRejectedValue(new Error('Object does not exist'));

    const result = await getDynamicFieldValueBcsOrNull(
      makeCtx(getObject) as never,
      options as never
    );

    expect(result).toBeNull();
  });

  it('propagates real transport failures instead of reporting absence', async () => {
    const getObject = vi.fn().mockRejectedValue(new Error('network timeout'));

    await expect(
      getDynamicFieldValueBcsOrNull(
        makeCtx(getObject) as never,
        options as never
      )
    ).rejects.toThrow('network timeout');
  });
});
