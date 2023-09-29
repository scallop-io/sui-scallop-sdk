import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { Scallop, SUPPORT_SPOOLS } from '../src';
import type { NetworkType } from '@scallop-io/sui-kit';

dotenv.config();

const ENABLE_LOG = true;

const NETWORK: NetworkType = 'mainnet';

describe('Test Query Scallop Contract On Chain Data', async () => {
  const scallopSDK = new Scallop({
    secretKey: process.env.SECRET_KEY,
    networkType: NETWORK,
  });
  const scallopQuery = await scallopSDK.createScallopQuery();

  it('Should get market data', async () => {
    const marketData = await scallopQuery.getMarket();
    if (ENABLE_LOG) {
      console.info('MarketData:');
      console.dir(marketData, { depth: null, colors: true });
    }
    expect(!!marketData).toBe(true);
  });

  it('Should get obligations and its all obligation data', async () => {
    const obligations = await scallopQuery.getObligations();

    if (ENABLE_LOG) {
      console.info('Obligations', obligations);
    }
    expect(!!obligations).toBe(true);

    for (const { id } of obligations) {
      const obligationData = await scallopQuery.getObligation(id);

      if (ENABLE_LOG) {
        console.info('Id:', id);
        console.info('ObligationData:');
        console.dir(obligationData, { depth: null, colors: true });
      }
      expect(!!obligationData).toBe(true);
    }
  });

  it('Should get all stake accounts data', async () => {
    const allStakeAccounts = await scallopQuery.getAllStakeAccounts();

    if (ENABLE_LOG) {
      console.info('All stake accounts:');
      console.dir(allStakeAccounts, { depth: null, colors: true });
    }
    expect(!!allStakeAccounts).toBe(true);
  });

  it('Should get all stake pool data', async () => {
    for (const marketCoinName of SUPPORT_SPOOLS) {
      const stakePool = await scallopQuery.getStakePool(marketCoinName);

      if (ENABLE_LOG) {
        console.info('MarketCoinName:', marketCoinName);
        console.info('StakePool:');
        console.dir(stakePool, { depth: null, colors: true });
      }
      expect(!!stakePool).toBe(true);
    }
  });

  it('Should get all reward pool data', async () => {
    for (const marketCoinName of SUPPORT_SPOOLS) {
      const rewardPool = await scallopQuery.getRewardPool(marketCoinName);

      if (ENABLE_LOG) {
        console.info('MarketCoinName:', marketCoinName);
        console.info('RewardPool:');
        console.dir(rewardPool, { depth: null, colors: true });
      }
      expect(!!rewardPool).toBe(true);
    }
  });

  it('Should get pyth price data', async () => {
    const coinName = 'usdc';
    const usdcPrice = await scallopQuery.getPriceFromPyth(coinName);

    if (ENABLE_LOG) {
      console.info('Coin name:', coinName);
      console.info('Usdc price:', usdcPrice);
    }
    expect(usdcPrice).toBeGreaterThan(0);
  });
});
