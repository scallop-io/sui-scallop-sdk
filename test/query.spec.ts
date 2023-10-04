import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { Scallop } from '../src';
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

  it('Should get market pools data', async () => {
    const marketPools = await scallopQuery.getMarketPools(['sui', 'usdc']);

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
    const marketCollaterals = await scallopQuery.getMarketCollaterals([
      'sui',
      'usdc',
    ]);

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

  it('Should get coin amounts', async () => {
    const coinAmounts = await scallopQuery.getCoinAmounts();

    if (ENABLE_LOG) {
      console.info('Coin amounts:');
      console.dir(coinAmounts, { depth: null, colors: true });
    }
    expect(!!coinAmounts).toBe(true);
  });

  it('Should get coin amount', async () => {
    const coinAmount = await scallopQuery.getCoinAmount('sui');

    if (ENABLE_LOG) {
      console.info('Coin amount:', coinAmount);
    }
    expect(!!coinAmount).toBe(true);
  });

  it('Should get market coin amounts', async () => {
    const marketCoinAmounts = await scallopQuery.getMarketCoinAmounts();

    if (ENABLE_LOG) {
      console.info('Market coin amounts:');
      console.dir(marketCoinAmounts, { depth: null, colors: true });
    }
    expect(!!marketCoinAmounts).toBe(true);
  });

  it('Should get market coin amount', async () => {
    const marketCoinAmount = await scallopQuery.getMarketCoinAmount('ssui');

    if (ENABLE_LOG) {
      console.info('Market coin amount:', marketCoinAmount);
    }
    expect(!!marketCoinAmount).toBe(true);
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

describe('Test Query Spool Contract On Chain Data', async () => {
  const scallopSDK = new Scallop({
    secretKey: process.env.SECRET_KEY,
    networkType: NETWORK,
  });
  const scallopQuery = await scallopSDK.createScallopQuery();

  it('Should get spools data', async () => {
    const spools = await scallopQuery.getSpools();

    if (ENABLE_LOG) {
      console.info('Spools:');
      console.dir(spools, { depth: null, colors: true });
    }
    expect(!!spools).toBe(true);
  });

  it('Should get spool data', async () => {
    const ssuiSpool = await scallopQuery.getSpool('ssui');

    if (ENABLE_LOG) {
      console.info('sSUI spool:');
      console.dir(ssuiSpool, { depth: null, colors: true });
    }
    expect(!!ssuiSpool).toBe(true);
  });

  it('Should get all stake accounts data', async () => {
    const allStakeAccounts = await scallopQuery.getAllStakeAccounts();

    if (ENABLE_LOG) {
      console.info('All stake accounts:');
      console.dir(allStakeAccounts, { depth: null, colors: true });
    }
    expect(!!allStakeAccounts).toBe(true);
  });

  it('Should get all stake pools data', async () => {
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
      console.info('sSui stake pool:');
      console.dir(suiStakePool, { depth: null, colors: true });
    }
    expect(!!suiStakePool).toBe(true);
  });

  it('Should get all reward pools data', async () => {
    const rewardPools = await scallopQuery.getRewardPools();

    if (ENABLE_LOG) {
      console.info('Reward pools:');
      console.dir(rewardPools, { depth: null, colors: true });
    }
    expect(!!rewardPools).toBe(true);
  });

  it('Should get all reward pool data', async () => {
    const rewardPool = await scallopQuery.getRewardPool('ssui');

    if (ENABLE_LOG) {
      console.info('sSui Reward pool:');
      console.dir(rewardPool, { depth: null, colors: true });
    }
    expect(!!rewardPool).toBe(true);
  });
});

describe('Test Portfolio Query', async () => {
  const scallopSDK = new Scallop({
    secretKey: process.env.SECRET_KEY,
    networkType: NETWORK,
  });
  const scallopQuery = await scallopSDK.createScallopQuery();

  it('Should get user lendings data', async () => {
    const lendings = await scallopQuery.getLendings(['sui', 'usdc']);

    if (ENABLE_LOG) {
      console.info('User lendings:', lendings);
    }
    expect(!!lendings).toBe(true);
  }, 120000);

  it('Should get user lending data', async () => {
    const lending = await scallopQuery.getLending('sui');

    if (ENABLE_LOG) {
      console.info('User lending:', lending);
    }
    expect(!!lending).toBe(true);
  });

  it('Should get all obligation accounts', async () => {
    const obligationAccounts = await scallopQuery.getObligationAccounts();
    if (ENABLE_LOG) {
      console.info('Obligation accounts:');
      console.dir(obligationAccounts, { depth: null, colors: true });
    }
    expect(!!obligationAccounts).toBe(true);
  });

  it('Should get obligation account', async () => {
    const obligations = await scallopQuery.getObligations();

    if (ENABLE_LOG) {
      console.info('Obligations', obligations);
    }
    expect(obligations.length).toBeGreaterThan(0);

    const obligationAccount = await scallopQuery.getObligationAccount(
      obligations[0].id
    );
    if (ENABLE_LOG) {
      console.info('Obligation account:');
      console.dir(obligationAccount, { depth: null, colors: true });
    }
    expect(!!obligationAccount).toBe(true);
  });
});
