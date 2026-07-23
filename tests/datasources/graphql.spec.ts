import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/query-core';
import { GraphQLDataSource } from 'src/datasources/graphql/index.js';
import { ScallopRpcError } from 'src/errors/index.js';
import { getRpcStats, resetRpcStats } from 'src/datasources/rpcStats.js';

// A fake SuiGraphQLClient — only `.query` is exercised. Cast to the client shape
// at the constructor call site.
const makeClient = (impl: (...args: unknown[]) => unknown) => ({
  query: vi.fn(impl),
});

// staleTime Infinity so a second identical read is served from cache (lets us
// assert the datasource self-caches instead of re-querying the transport).
const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { staleTime: Infinity, retry: false } },
  });

const balanceNode = (repr: string, total: string) => ({
  coinType: { repr },
  totalBalance: total,
  coinBalance: total,
  addressBalance: total,
});

const makeDs = (client: ReturnType<typeof makeClient>) =>
  new GraphQLDataSource({
    client: client as never,
    url: 'mock://graphql',
    queryClient: makeQueryClient(),
    tokensPerSecond: 1000,
  });

describe('GraphQLDataSource.multiGetBalances', () => {
  beforeEach(() => vi.clearAllMocks());

  it('short-circuits an empty coinTypes list without hitting the transport', async () => {
    // intent: no query round trip should happen when there is nothing to fetch
    const client = makeClient(() => ({ data: null }));
    const res = await makeDs(client).multiGetBalances('0xA', []);
    expect(res).toEqual({});
    expect(client.query).not.toHaveBeenCalled();
  });

  it('maps multiGetBalances into a Balance map keyed by normalized coin type', async () => {
    // intent: `.balance` mirrors totalBalance so downstream reads match the gRPC listBalances shape
    const client = makeClient(() => ({
      data: {
        address: { multiGetBalances: [balanceNode('0x2::sui::SUI', '42')] },
      },
    }));
    const res = await makeDs(client).multiGetBalances('0xA', ['0x2::sui::SUI']);
    const [key] = Object.keys(res);
    expect(key).toContain('::sui::SUI');
    expect(res[key]).toMatchObject({
      balance: '42',
      coinBalance: '42',
      addressBalance: '42',
    });
  });

  it('throws a ScallopRpcError when the GraphQL response carries errors', async () => {
    // intent: fail loud — callers/fallbacks depend on a typed throw, not a silent empty map
    const client = makeClient(() => ({ errors: [{ message: 'boom' }] }));
    await expect(
      makeDs(client).multiGetBalances('0xA', ['0x2::sui::SUI'])
    ).rejects.toBeInstanceOf(ScallopRpcError);
  });

  it('self-caches: a second identical read is served without re-querying', async () => {
    // intent: the datasource owns its fetchWithCache, so repeated reads coalesce to one transport call
    const client = makeClient(() => ({
      data: {
        address: { multiGetBalances: [balanceNode('0x2::sui::SUI', '1')] },
      },
    }));
    const ds = makeDs(client);
    await ds.multiGetBalances('0xA', ['0x2::sui::SUI']);
    await ds.multiGetBalances('0xA', ['0x2::sui::SUI']);
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  it('records the request under the graphql transport with coin-type cardinality', async () => {
    // intent: GraphQL reads must show up in the shared accounting under their own
    // transport (not the on-chain one), so a portfolio scope can attribute them.
    resetRpcStats();
    const client = makeClient(() => ({
      data: {
        address: { multiGetBalances: [balanceNode('0x2::sui::SUI', '1')] },
      },
    }));
    await makeDs(client).multiGetBalances('0xA', [
      '0x2::sui::SUI',
      '0x2::coin::FOO',
    ]);

    const stat = getRpcStats().get('graphql:multiGetBalances');
    expect(stat?.calls).toBe(1);
    expect(stat?.cardinality).toBe(2);
    expect(getRpcStats().get('onchain:multiGetBalances')).toBeUndefined();
  });
});

// A valid 32-byte Sui address — deriveDynamicFieldID normalizes the parent id.
const PARENT_ID =
  '0x0000000000000000000000000000000000000000000000000000000000000002';
// valid base64 for a dynamic-field name key (deriveDynamicFieldID needs to
// decode name.bcs); exact bytes are irrelevant to these assertions.
const NAME_BCS = 'AQID';
const moveValueNode = (repr: string, json: unknown) => ({
  name: { bcs: NAME_BCS, type: { repr: '0x1::type_name::TypeName' } },
  value: {
    __typename: 'MoveValue',
    bcs: NAME_BCS,
    json,
    type: { repr },
  },
});
const moveObjectNode = (repr: string, address: string) => ({
  name: { bcs: NAME_BCS, type: { repr: '0x1::type_name::TypeName' } },
  value: {
    __typename: 'MoveObject',
    address,
    contents: { bcs: NAME_BCS, json: { k: 1 }, type: { repr } },
  },
});
const page = (
  nodes: unknown[],
  { hasNextPage = false, endCursor = null as string | null } = {}
) => ({
  data: {
    address: { dynamicFields: { pageInfo: { hasNextPage, endCursor }, nodes } },
  },
});

describe('GraphQLDataSource.listDynamicFieldsWithValues', () => {
  beforeEach(() => vi.clearAllMocks());

  it('normalizes MoveValue and MoveObject nodes with inline values', async () => {
    // intent: values come back inline (no separate getObjects); object fields expose childId
    const client = makeClient(() =>
      page([
        moveValueNode('bool', true),
        moveObjectNode('0x2::coin::Coin', '0xchild'),
      ])
    );
    const fields = await makeDs(client).listDynamicFieldsWithValues(PARENT_ID);

    expect(fields).toHaveLength(2);
    expect(fields[0]).toMatchObject({
      valueType: 'bool',
      isDynamicObject: false,
      valueJson: true,
    });
    expect(typeof fields[0].fieldId).toBe('string');
    expect(fields[1]).toMatchObject({
      isDynamicObject: true,
      childId: '0xchild',
      valueType: '0x2::coin::Coin',
    });
  });

  it('pages the connection until hasNextPage is false', async () => {
    // intent: a full table walk follows the cursor, concatenating every page
    const client = makeClient((arg: unknown) => {
      const { variables } = arg as { variables: { cursor: string | null } };
      return variables.cursor === null
        ? page([moveValueNode('bool', true)], {
            hasNextPage: true,
            endCursor: 'c1',
          })
        : page([moveValueNode('bool', false)], { hasNextPage: false });
    });
    const fields = await makeDs(client).listDynamicFieldsWithValues(PARENT_ID);
    expect(fields).toHaveLength(2);
    expect(client.query).toHaveBeenCalledTimes(2);
  });

  it('throws a ScallopRpcError when the GraphQL response carries errors', async () => {
    // intent: fail loud so the GraphQL-fallback layer switches to the gRPC path
    const client = makeClient(() => ({ errors: [{ message: 'boom' }] }));
    await expect(
      makeDs(client).listDynamicFieldsWithValues(PARENT_ID)
    ).rejects.toBeInstanceOf(ScallopRpcError);
  });
});

describe('GraphQLDataSource.multiGetDynamicFields', () => {
  beforeEach(() => vi.clearAllMocks());

  const name = (bcsB64: string) => ({ type: '0x2::object::ID', bcs: bcsB64 });

  it('returns results aligned to input order, null for a missing field', async () => {
    // intent: aliases map back to positions; an absent field (null alias) → null
    const client = makeClient(() => ({
      data: {
        address: {
          f0: moveValueNode('0x1::string::String', 'alpha'),
          f1: null,
        },
      },
    }));
    const res = await makeDs(client).multiGetDynamicFields(PARENT_ID, [
      name(NAME_BCS),
      name('BQYH'),
    ]);
    expect(res).toHaveLength(2);
    expect(res[0]).toMatchObject({ valueJson: 'alpha' });
    expect(res[1]).toBeNull();
  });

  it('short-circuits an empty names list without hitting the transport', async () => {
    const client = makeClient(() => ({ data: null }));
    const res = await makeDs(client).multiGetDynamicFields(PARENT_ID, []);
    expect(res).toEqual([]);
    expect(client.query).not.toHaveBeenCalled();
  });

  it('throws a ScallopRpcError when the GraphQL response carries errors', async () => {
    const client = makeClient(() => ({ errors: [{ message: 'boom' }] }));
    await expect(
      makeDs(client).multiGetDynamicFields(PARENT_ID, [name(NAME_BCS)])
    ).rejects.toBeInstanceOf(ScallopRpcError);
  });
});
