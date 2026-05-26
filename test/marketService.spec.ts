import { describe, expect, it, vi, beforeEach } from 'vitest';
import { noopLogger } from 'src/logger/index.js';

// Mock the underlying free RPC functions so MarketService can route to a
// deterministic value without a real ScallopQuery / network.
vi.mock('src/queries/coreQuery.js', async () => {
  const actual = await vi.importActual<
    typeof import('src/queries/coreQuery.js')
  >('src/queries/coreQuery.js');
  return {
    ...actual,
    queryMarket: vi.fn(async () => ({
      pools: { rpcPool: { coinName: 'rpcPool' } },
      collaterals: { rpcCol: { coinName: 'rpcCol' } },
    })),
    getMarketPools: vi.fn(async () => ({
      pools: { rpcPool: { coinName: 'rpcPool' } },
      collaterals: {},
    })),
    getMarketCollaterals: vi.fn(async () => ({
      rpcCol: { coinName: 'rpcCol' },
    })),
    getMarketCollateral: vi.fn(async () => ({ coinName: 'rpcCol' })),
  };
});

import { MarketService } from 'src/services/MarketService.js';
import * as coreQuery from 'src/queries/coreQuery.js';

const makeIndexer = () => ({
  getMarket: vi.fn(async () => ({
    pools: { idxPool: { coinName: 'idxPool' } },
    collaterals: { idxCol: { coinName: 'idxCol' } },
  })),
  getMarketPool: vi.fn(async () => ({ coinName: 'idxPool' })),
  getMarketCollaterals: vi.fn(async () => ({
    idxCol: { coinName: 'idxCol' },
  })),
  getMarketCollateral: vi.fn(async () => ({ coinName: 'idxCol' })),
});

const makeQuery = (indexer = makeIndexer()) =>
  ({
    indexer,
    constants: {
      whitelist: {
        lending: new Set<string>(['rpcPool', 'idxPool']),
        collateral: new Set<string>(['rpcCol', 'idxCol']),
      },
    },
    utils: { logger: noopLogger },
  }) as never;

describe('MarketService', () => {
  beforeEach(() => {
    vi.mocked(coreQuery.queryMarket).mockClear();
    vi.mocked(coreQuery.getMarketPools).mockClear();
    vi.mocked(coreQuery.getMarketCollaterals).mockClear();
    vi.mocked(coreQuery.getMarketCollateral).mockClear();
  });

  it('queryMarket(source: rpc) calls underlying queryMarket and never the indexer', async () => {
    const indexer = makeIndexer();
    const service = new MarketService({
      query: makeQuery(indexer),
      indexer: indexer as never,
    });

    const market = await service.queryMarket({ source: 'rpc' });

    expect(coreQuery.queryMarket).toHaveBeenCalledOnce();
    expect(indexer.getMarket).not.toHaveBeenCalled();
    expect(Object.keys(market.pools)).toEqual(['rpcPool']);
  });

  it('queryMarket(source: indexer) uses IndexerMarketRepository', async () => {
    const indexer = makeIndexer();
    const service = new MarketService({
      query: makeQuery(indexer),
      indexer: indexer as never,
    });

    const market = await service.queryMarket({ source: 'indexer' });

    expect(indexer.getMarket).toHaveBeenCalledOnce();
    expect(coreQuery.queryMarket).not.toHaveBeenCalled();
    expect(Object.keys(market.pools)).toEqual(['idxPool']);
  });

  it('queryMarket(source: indexer-first) falls back to RPC when indexer throws', async () => {
    const indexer = makeIndexer();
    indexer.getMarket = vi.fn(async () => {
      throw new Error('indexer boom');
    }) as never;
    const service = new MarketService({
      query: makeQuery(indexer),
      indexer: indexer as never,
    });

    const market = await service.queryMarket({ source: 'indexer-first' });

    expect(indexer.getMarket).toHaveBeenCalledOnce();
    expect(coreQuery.queryMarket).toHaveBeenCalledOnce();
    expect(Object.keys(market.pools)).toEqual(['rpcPool']);
  });

  it('getMarketPools defaults to lending whitelist coin names', async () => {
    const indexer = makeIndexer();
    const service = new MarketService({
      query: makeQuery(indexer),
      indexer: indexer as never,
    });

    await service.getMarketPools(undefined, { source: 'rpc' });

    const call = vi.mocked(coreQuery.getMarketPools).mock.calls[0];
    // arg 1 is the names array
    expect(call[1]).toEqual(['rpcPool', 'idxPool']);
  });

  it('getMarketCollaterals(source: rpc) delegates to underlying free function', async () => {
    const indexer = makeIndexer();
    const service = new MarketService({
      query: makeQuery(indexer),
      indexer: indexer as never,
    });

    const collaterals = await service.getMarketCollaterals(['rpcCol'], {
      source: 'rpc',
    });

    expect(coreQuery.getMarketCollaterals).toHaveBeenCalledOnce();
    expect(Object.keys(collaterals)).toEqual(['rpcCol']);
  });

  it('getMarketCollateral(source: indexer) hits indexer.getMarketCollateral', async () => {
    const indexer = makeIndexer();
    const service = new MarketService({
      query: makeQuery(indexer),
      indexer: indexer as never,
    });

    const c = await service.getMarketCollateral('idxCol', {
      source: 'indexer',
    });

    expect(indexer.getMarketCollateral).toHaveBeenCalledWith('idxCol');
    expect(coreQuery.getMarketCollateral).not.toHaveBeenCalled();
    expect(c?.coinName).toBe('idxCol');
  });
});
