import { describe, expect, it, vi, beforeEach } from 'vitest';
import { noopLogger } from 'src/logger/index.js';

vi.mock('src/queries/priceQuery.js', async () => {
  const actual = await vi.importActual<
    typeof import('src/queries/priceQuery.js')
  >('src/queries/priceQuery.js');
  return {
    ...actual,
    getAllCoinPrices: vi.fn(async () => ({ sui: 2, sca: 0.5 })),
  };
});

import { PriceService } from 'src/services/PriceService.js';
import * as priceQuery from 'src/queries/priceQuery.js';

const makeIndexer = () => ({
  // Real `ScallopIndexer.getCoinPrice(name)` returns `Promise<number>`.
  getCoinPrice: vi.fn(async (_name: string) => 1.23),
  getCoinPrices: vi.fn(async () => ({ sui: 2, sca: 0.5 })),
});

const makeUtils = () => ({
  getPythPrice: vi.fn(async (name: string) => (name === 'sui' ? 2 : 0)),
  getPythPrices: vi.fn(async (names: string[]) =>
    Object.fromEntries(names.map((n) => [n, n === 'sui' ? 2 : 0]))
  ),
  logger: noopLogger,
});

const makeQuery = () =>
  ({
    indexer: makeIndexer(),
    utils: makeUtils(),
  }) as never;

describe('PriceService', () => {
  beforeEach(() => {
    vi.mocked(priceQuery.getAllCoinPrices).mockClear();
  });

  it('getPriceFromPyth delegates to utils.getPythPrice', async () => {
    const query = makeQuery();
    const service = new PriceService({ query });
    const price = await service.getPriceFromPyth('sui');
    expect(price).toBe(2);
    expect((query as any).utils.getPythPrice).toHaveBeenCalledWith('sui');
  });

  it('getPricesFromPyth delegates to utils.getPythPrices', async () => {
    const query = makeQuery();
    const service = new PriceService({ query });
    const prices = await service.getPricesFromPyth(['sui', 'sca']);
    expect(prices).toEqual({ sui: 2, sca: 0 });
    expect((query as any).utils.getPythPrices).toHaveBeenCalledWith([
      'sui',
      'sca',
    ]);
  });

  it('getCoinPriceByIndexer delegates to indexer.getCoinPrice', async () => {
    const query = makeQuery();
    const service = new PriceService({ query });
    const result = await service.getCoinPriceByIndexer('sui');
    expect(result).toBe(1.23);
    expect((query as any).indexer.getCoinPrice).toHaveBeenCalledWith('sui');
  });

  it('getCoinPricesByIndexer delegates to indexer.getCoinPrices', async () => {
    const query = makeQuery();
    const service = new PriceService({ query });
    const result = await service.getCoinPricesByIndexer();
    expect(result).toEqual({ sui: 2, sca: 0.5 });
    expect((query as any).indexer.getCoinPrices).toHaveBeenCalledOnce();
  });

  it('getAllCoinPrices delegates to the free function with the supplied options', async () => {
    const query = makeQuery();
    const service = new PriceService({ query });
    const prices = await service.getAllCoinPrices({ indexer: true });
    expect(prices).toEqual({ sui: 2, sca: 0.5 });
    const call = vi.mocked(priceQuery.getAllCoinPrices).mock.calls[0];
    expect(call[3]).toBe(true);
  });

  it('respects explicit overrides for indexer and utils', async () => {
    const overrideIndexer = makeIndexer();
    const overrideUtils = makeUtils();
    const query = makeQuery();
    const service = new PriceService({
      query,
      indexer: overrideIndexer as never,
      utils: overrideUtils as never,
    });
    await service.getCoinPricesByIndexer();
    await service.getPriceFromPyth('sui');
    expect(overrideIndexer.getCoinPrices).toHaveBeenCalledOnce();
    expect(overrideUtils.getPythPrice).toHaveBeenCalledWith('sui');
    expect((query as any).indexer.getCoinPrices).not.toHaveBeenCalled();
  });
});
