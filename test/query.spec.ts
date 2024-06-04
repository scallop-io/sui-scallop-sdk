import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { Scallop } from '../src';
import type { NetworkType } from '@scallop-io/sui-kit';
import { getVescaKeys } from 'src/queries';
import { z as zod } from 'zod';
dotenv.config();

const ENABLE_LOG = true;

const NETWORK: NetworkType = 'mainnet';

describe('Test Query Scallop Contract On Chain Data', async () => {
  const scallopSDK = new Scallop({
    secretKey: process.env.SECRET_KEY,
    networkType: NETWORK,
  });
  const scallopQuery = await scallopSDK.createScallopQuery();
  console.info('Your wallet:', scallopQuery.suiKit.currentAddress());

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
      console.info('Market pool:');
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
    expect(coinAmount).toBeGreaterThanOrEqual(0);
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
    expect(marketCoinAmount).toBeGreaterThanOrEqual(0);
  });

  it('Should get pyth price data', async () => {
    const usdcPrice = await scallopQuery.getPriceFromPyth('usdc');

    if (ENABLE_LOG) {
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

  it('Should get stake accounts data', async () => {
    const stakeAccounts = await scallopQuery.getStakeAccounts('ssui');

    if (ENABLE_LOG) {
      console.info('Stake accounts:');
      console.dir(stakeAccounts, { depth: null, colors: true });
    }
    expect(!!stakeAccounts).toBe(true);
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

  it('Should get all stake reward pools data', async () => {
    const stakeRewardPools = await scallopQuery.getStakeRewardPools();

    if (ENABLE_LOG) {
      console.info('Reward pools:');
      console.dir(stakeRewardPools, { depth: null, colors: true });
    }
    expect(!!stakeRewardPools).toBe(true);
  });

  it('Should get all stake reward pool data', async () => {
    const stakeRewardPool = await scallopQuery.getStakeRewardPool('ssui');

    if (ENABLE_LOG) {
      console.info('sSui Reward pool:');
      console.dir(stakeRewardPool, { depth: null, colors: true });
    }
    expect(!!stakeRewardPool).toBe(true);
  });
});

describe('Test Query Borrow Incentive Contract On Chain Data', async () => {
  const scallopSDK = new Scallop({
    secretKey: process.env.SECRET_KEY,
    networkType: NETWORK,
  });
  const scallopQuery = await scallopSDK.createScallopQuery();

  it('Should get borrow incentive pools data', async () => {
    const borrowIncentivePools = await scallopQuery.getBorrowIncentivePools();

    if (ENABLE_LOG) {
      console.info('BorrowIncentive pools:');
      console.dir(borrowIncentivePools, { depth: null, colors: true });
    }
    expect(!!borrowIncentivePools).toBe(true);
  });

  it('Should get borrow incentive accounts data', async () => {
    const obligations = await scallopQuery.getObligations();

    if (ENABLE_LOG) {
      console.info('Obligations', obligations);
    }
    expect(obligations.length).toBeGreaterThan(0);

    const borrowIncentiveAccounts =
      await scallopQuery.getBorrowIncentiveAccounts(obligations[0].id);

    if (ENABLE_LOG) {
      console.info('BorrowIncentive accounts:');
      console.dir(borrowIncentiveAccounts, { depth: null, colors: true });
    }
    expect(!!borrowIncentiveAccounts).toBe(true);
  });
});

describe('Test Portfolio Query', async () => {
  const scallopSDK = new Scallop({
    secretKey: process.env.SECRET_KEY,
    networkType: NETWORK,
  });
  const scallopQuery = await scallopSDK.createScallopQuery();
  console.info('Your wallet:', scallopQuery.suiKit.currentAddress());

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
  }, 120000);

  it('Should get obligation account', async () => {
    const obligations = await scallopQuery.getObligations();

    if (ENABLE_LOG) {
      console.info('Obligations', obligations);
    }
    expect(obligations.length).toBeGreaterThan(0);

    const obligationAccount = await scallopQuery.getObligationAccount(
      obligations[0].id,
      scallopQuery.suiKit.currentAddress()
    );
    if (ENABLE_LOG) {
      console.info('Obligation account:');
      console.dir(obligationAccount, { depth: null, colors: true });
    }
    expect(!!obligationAccount).toBe(true);
  });

  it('Should get total value locked', async () => {
    const tvl = await scallopQuery.getTvl();
    if (ENABLE_LOG) {
      console.info('Scallop tvl:', tvl);
    }
    expect(!!tvl).toBe(true);
  });
});

describe('Test VeSca Query', async () => {
  const scallopSDK = new Scallop({
    secretKey: process.env.SECRET_KEY,
    networkType: NETWORK,
  });

  const scallopQuery = await scallopSDK.createScallopQuery();
  const sender = scallopQuery.suiKit.currentAddress();
  console.info(`Your Wallet: ${sender}`);

  const veScaKeys = await getVescaKeys(scallopQuery, sender);
  let obligationId: string | undefined;
  if (veScaKeys.length === 0)
    throw new Error(`No VeSca keys found in ${sender}`);

  it(`Should get binded obligationId of veScaKey ${veScaKeys[0]}`, async () => {
    const bindedObligationId = await scallopQuery.getBindedObligationId(
      veScaKeys[0].objectId
    );

    if (ENABLE_LOG) {
      console.info('Binded Obligation Id:', bindedObligationId);
    }

    if (!bindedObligationId)
      throw new Error(
        `No binded obligationId found for veScaKey ${veScaKeys[0]}`
      );
    obligationId = bindedObligationId;
    expect(!!bindedObligationId).toBe(true);
  });

  it(`Should get veScaKeyId of obligationId ${obligationId}`, async () => {
    if (!obligationId) {
      throw new Error('No obligationId found');
    }
    const bindedVeScaKeyId = await scallopQuery.getBindedVeScaKey(
      obligationId!
    );

    if (ENABLE_LOG) {
      console.info('Binded VeSca Key Id:', bindedVeScaKeyId);
    }

    expect(!!bindedVeScaKeyId).toBe(true);
  });

  it(`Should get veSCA treasury info`, async () => {
    const totalVeScaTreasury = await scallopQuery.getVeScaTreasuryInfo();
    if (ENABLE_LOG) {
      console.info('Total VeSca Treasury:', totalVeScaTreasury);
    }
    const treasuryInfoSchema = zod.object({
      totalLockedSca: zod.number(),
      totalVeSca: zod.number(),
      averageLockingPeriod: zod.number(),
      averageLockingPeriodUnit: zod.string(),
    });
    expect(treasuryInfoSchema.safeParse(totalVeScaTreasury).success).toBe(true);
  });

  it(`Should get veSCAs`, async () => {
    const veScas = await scallopQuery.getVeScas(sender);
    if (ENABLE_LOG) {
      console.info('VeSca keys:', veScas);
    }
    expect(veScas.length).toBeGreaterThan(0);
    const veScaSchema = zod.object({
      id: zod.string(),
      keyId: zod.string(),
      lockedScaAmount: zod.string(),
      lockedScaCoin: zod.number(),
      currentVeScaBalance: zod.number(),
      unlockAt: zod.number(),
    });
    const arrOfVeSca = zod.array(veScaSchema);
    expect(arrOfVeSca.safeParse(veScas).success).toBe(true);
  });
});
