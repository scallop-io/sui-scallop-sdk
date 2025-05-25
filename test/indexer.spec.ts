import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { ScallopIndexer } from 'src/';

dotenv.config();

const ENABLE_LOG = false;

describe('Test Scallop Indexer', () => {
  const scallopIndexer = new ScallopIndexer({});

  it('Should get market', async () => {
    const market = await scallopIndexer.getMarket();
    if (ENABLE_LOG) console.info('market:', market);
    expect(market).not.toEqual(undefined);
  });

  it('Should get market pools', async () => {
    const marketPools = await scallopIndexer.getMarketPools();
    if (ENABLE_LOG) console.info('market pools:', marketPools);
    expect(marketPools).not.toEqual(undefined);
  });

  it('Should get marke pool', async () => {
    const marketPool = await scallopIndexer.getMarketPool('sui');

    if (ENABLE_LOG) console.info('market pool:', marketPool);
    expect(marketPool).not.toEqual(undefined);
  });

  it('Should get market collaterals', async () => {
    const marketCollaterals = await scallopIndexer.getMarketCollaterals();
    if (ENABLE_LOG) console.info('market collaterals:', marketCollaterals);
    expect(marketCollaterals).not.toEqual(undefined);
  });

  it('Should get marke collateral', async () => {
    const marketCollateral = await scallopIndexer.getMarketCollateral('sui');
    if (ENABLE_LOG) console.info('market collateral:', marketCollateral);
    expect(marketCollateral).not.toEqual(undefined);
  });

  it('Should get spools', async () => {
    const Spools = await scallopIndexer.getSpools();
    if (ENABLE_LOG) console.info('spools:', Spools);
    expect(Spools).not.toEqual(undefined);
  });

  it('Should get spool', async () => {
    const Spool = await scallopIndexer.getSpool('ssui');
    if (ENABLE_LOG) console.info('spool:', Spool);
    expect(Spool).not.toEqual(undefined);
  });

  it.skip('Should get borrow incentive pools', async () => {
    const BorrowIncentivePools = await scallopIndexer.getBorrowIncentivePools();
    if (ENABLE_LOG)
      console.info('borrow incentive pools:', BorrowIncentivePools);
    expect(BorrowIncentivePools).not.toEqual(undefined);
  });

  it.skip('Should get borrow incentive pool', async () => {
    const BorrowIncentivePool =
      await scallopIndexer.getBorrowIncentivePool('sui');
    if (ENABLE_LOG) console.info('borrow incentive pool:', BorrowIncentivePool);
    expect(BorrowIncentivePool).not.toEqual(undefined);
  });

  it('Should get tvl', async () => {
    const tvl = await scallopIndexer.getTotalValueLocked();
    if (ENABLE_LOG) console.info('tvl:', tvl);
    expect(tvl).not.toEqual(undefined);
  });
});
