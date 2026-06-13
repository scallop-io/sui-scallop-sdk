import { describe, expect, it, vi } from 'vitest';
import {
  createIndexerMarketRepository,
  createRpcMarketRepository,
  createScallopQueryMarketRepository,
  createScallopQueryObligationRepository,
} from 'src/repositories/index.js';
import type ScallopQuery from 'src/models/scallopQuery.js';

vi.mock('src/queries/coreQuery.js', async () => {
  const actual = await vi.importActual<
    typeof import('src/queries/coreQuery.js')
  >('src/queries/coreQuery.js');
  return {
    ...actual,
    getMarketPools: vi.fn(async () => ({ pools: {}, collaterals: {} })),
  };
});

import * as coreQuery from 'src/queries/coreQuery.js';

describe('repository adapters', () => {
  it('delegates market calls through ScallopQuery compatibility API', async () => {
    const query = {
      queryMarket: vi.fn(async () => ({ pools: {}, collaterals: {} })),
      getMarketPools: vi.fn(async () => ({ pools: {}, collaterals: {} })),
      getMarketPool: vi.fn(async () => undefined),
      getMarketCollaterals: vi.fn(async () => ({})),
      getMarketCollateral: vi.fn(async () => undefined),
    } as unknown as ScallopQuery;
    const repo = createScallopQueryMarketRepository(query);

    await repo.getMarket({ indexer: true });
    await repo.getMarketPools(['sui'], { indexer: false });
    await repo.getMarketPool('sui');
    await repo.getMarketCollaterals(['sui']);
    await repo.getMarketCollateral('sui');

    expect(query.queryMarket).toHaveBeenCalledWith({
      coinPrices: undefined,
      indexer: true,
      source: undefined,
    });
    expect(query.getMarketPools).toHaveBeenCalledWith(['sui'], {
      coinPrices: undefined,
      indexer: false,
      source: undefined,
    });
    expect(query.getMarketPool).toHaveBeenCalledWith('sui', {
      coinPrice: undefined,
      indexer: undefined,
      source: undefined,
    });
  });

  it('delegates obligation calls through ScallopQuery compatibility API', async () => {
    const query = {
      getObligations: vi.fn(async () => []),
      queryObligation: vi.fn(async () => undefined),
    } as unknown as ScallopQuery;
    const repo = createScallopQueryObligationRepository(query);

    await repo.getObligations('0x1');
    await repo.queryObligation('0x2');

    expect(query.getObligations).toHaveBeenCalledWith('0x1');
    expect(query.queryObligation).toHaveBeenCalledWith('0x2');
  });

  it('creates forced-RPC market data repositories', async () => {
    const query = {
      constants: {
        whitelist: {
          lending: new Set(['sui']),
          collateral: new Set(['sui']),
        },
      },
    } as unknown as ScallopQuery;
    const repo = createRpcMarketRepository(query);

    await repo.getMarketPools(['sui'], { indexer: true });

    expect(coreQuery.getMarketPools).toHaveBeenCalledWith(
      query,
      ['sui'],
      false,
      undefined
    );
  });

  it('creates indexer-backed market data repositories with coin filters', async () => {
    const indexer = {
      getMarket: vi.fn(async () => ({
        pools: { sui: { coinName: 'sui' }, usdc: { coinName: 'usdc' } },
        collaterals: { sui: { coinName: 'sui' } },
      })),
      getMarketPool: vi.fn(async () => ({ coinName: 'sui' })),
      getMarketCollaterals: vi.fn(async () => ({
        sui: { coinName: 'sui' },
        usdc: { coinName: 'usdc' },
      })),
      getMarketCollateral: vi.fn(async () => ({ coinName: 'sui' })),
    };
    const repo = createIndexerMarketRepository(indexer as any);

    const market = await repo.getMarketPools(['sui']);
    const collaterals = await repo.getMarketCollaterals(['sui']);

    expect(Object.keys(market.pools)).toEqual(['sui']);
    expect(Object.keys(collaterals)).toEqual(['sui']);
  });
});
