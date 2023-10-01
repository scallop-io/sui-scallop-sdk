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

  it('Should query market data', async () => {
    const market = await scallopQuery.queryMarket();
    if (ENABLE_LOG) {
      console.info('Market:');
      console.dir(market, { depth: null, colors: true });
    }
    expect(!!market).toBe(true);
  });

  it('Should get obligations and its all obligation data', async () => {
    const obligations = await scallopQuery.getObligations();

    if (ENABLE_LOG) {
      console.info('Obligations', obligations);
    }
    expect(!!obligations).toBe(true);

    for (const { id } of obligations) {
      const obligationData = await scallopQuery.queryObligation(id);

      if (ENABLE_LOG) {
        console.info('Id:', id);
        console.info('Obligation:');
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
    const stakePools = await scallopQuery.getStakePools();

    if (ENABLE_LOG) {
      console.info('Stake pools:');
      console.dir(stakePools, { depth: null, colors: true });
    }
    expect(!!stakePools).toBe(true);
  });

  it('Should get stake pool data', async () => {
    const suiStakePool = await scallopQuery.getStakePool('ssui');

    if (ENABLE_LOG) {
      console.info('Sui stake pool:');
      console.dir(suiStakePool, { depth: null, colors: true });
    }
    expect(!!suiStakePool).toBe(true);
  });

  it('Should get all reward pool data', async () => {
    for (const marketCoinName of SUPPORT_SPOOLS) {
      const rewardPool = await scallopQuery.getRewardPool(marketCoinName);

      if (ENABLE_LOG) {
        console.info('Market coin name:', marketCoinName);
        console.info('Reward pool:');
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

  it('Should get market pools data', async () => {
    const marketPools = await scallopQuery.getMarketPools();

    if (ENABLE_LOG) {
      console.info('Market:');
      console.dir(marketPools, { depth: null, colors: true });
    }
    expect(!!marketPools).toBe(true);
  });

  it('Should get market pool data', async () => {
    const suiMarketPool = await scallopQuery.getMarketPool('sui');

    if (ENABLE_LOG) {
      console.info('Sui market pool:');
      console.dir(suiMarketPool, { depth: null, colors: true });
    }
    expect(!!suiMarketPool).toBe(true);
  });

  it('Should get market collaterals data', async () => {
    const marketCollaterals = await scallopQuery.getMarketCollaterals();

    if (ENABLE_LOG) {
      console.info('Market collaterasl:');
      console.dir(marketCollaterals, { depth: null, colors: true });
    }
    expect(!!marketCollaterals).toBe(true);
  });

  it('Should get market collateral data', async () => {
    const suiMarketCollateral = await scallopQuery.getMarketCollateral('sui');

    if (ENABLE_LOG) {
      console.info('Sui market collateral:');
      console.dir(suiMarketCollateral, { depth: null, colors: true });
    }
    expect(!!suiMarketCollateral).toBe(true);
  });

  it('Should get coins amount', async () => {
    const coinsAmount = await scallopQuery.getCoinAmounts();

    if (ENABLE_LOG) {
      console.info('Coins amount:');
      console.dir(coinsAmount, { depth: null, colors: true });
    }
    expect(!!coinsAmount).toBe(true);
  });

  it('Should get coin amount', async () => {
    const coinAmount = await scallopQuery.getCoinAmount('sui');

    if (ENABLE_LOG) {
      console.info('Coin amount:', coinAmount);
    }
    expect(!!coinAmount).toBe(true);
  });

  it('Should get market coins amount', async () => {
    const marketCoinsAmount = await scallopQuery.getMarketCoinAmounts();

    if (ENABLE_LOG) {
      console.info('Market coins amount:');
      console.dir(marketCoinsAmount, { depth: null, colors: true });
    }
    expect(!!marketCoinsAmount).toBe(true);
  });

  it('Should get market coin amount', async () => {
    const marketCoinAmount = await scallopQuery.getMarketCoinAmount('ssui');

    if (ENABLE_LOG) {
      console.info('Market coin amount:', marketCoinAmount);
    }
    expect(!!marketCoinAmount).toBe(true);
  });
});
