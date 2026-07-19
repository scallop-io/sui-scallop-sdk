import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/query-core';
import { GraphQLDataSource } from 'src/datasources/graphql.js';
import { ScallopRpcError } from 'src/errors/index.js';

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
});
