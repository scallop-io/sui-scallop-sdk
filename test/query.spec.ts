import { describe, it, expect } from 'vitest';
import { isValidSuiAddress } from '@scallop-io/sui-kit';
import { z as zod } from 'zod';
import { scallopSDK } from './scallopSdk';
import { ScallopQuery } from 'src/models';
import BigNumber from 'bignumber.js';

const ENABLE_LOG = false;

let _scallopQuery: ScallopQuery | null = null;
const getScallopQuery = async () => {
  if (!_scallopQuery) {
    _scallopQuery = await scallopSDK.createScallopQuery();
  }
  return _scallopQuery;
};

describe('Test Query Scallop Contract On Chain Data', async () => {
  const scallopQuery = await getScallopQuery();
  console.info('Your wallet:', scallopQuery.walletAddress);

  it('Should query market data', async () => {
    const market = await scallopQuery.queryMarket();
    if (ENABLE_LOG) {
      console.info('Market:');
      console.dir(market, { depth: null, colors: true });
    }
    expect(!!market).toBe(true);
  });

  it('Should get market pools data', async () => {
    const marketPools = await scallopQuery.getMarketPools(['sui', 'wusdc']);

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
      'wusdc',
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
    const usdcPrice = await scallopQuery.getPriceFromPyth('wusdc');

    if (ENABLE_LOG) {
      console.info('Usdc price:', usdcPrice);
    }
    expect(usdcPrice).toBeGreaterThan(0);
  });
});

describe('Test Query Spool Contract On Chain Data', async () => {
  const scallopQuery = await getScallopQuery();

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
  const scallopQuery = await getScallopQuery();

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
  const scallopQuery = await getScallopQuery();
  console.info('Your wallet:', scallopQuery.walletAddress);

  it('Should get user lendings data', async () => {
    const lendings = await scallopQuery.getLendings(['sui', 'wusdc']);

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
      obligations[0].id
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
  const scallopQuery = await getScallopQuery();
  const sender = scallopQuery.walletAddress;
  console.info(`Your Wallet: ${sender}`);

  let obligationId: string | undefined;

  const VE_SCA_KEY =
    '0xad50994e23ae4268fc081f477d0bdc3f1b92c7049c9038dedec5bac725273d18' as const;
  // make sure you test with an account that has binded obligationId to a veScaKey
  it(`Should get binded obligationId of veScaKey ${VE_SCA_KEY}`, async () => {
    const bindedObligationId =
      await scallopQuery.getBindedObligationId(VE_SCA_KEY);

    if (ENABLE_LOG) {
      console.info('Binded Obligation Id:', bindedObligationId);
    }

    if (!bindedObligationId)
      throw new Error(
        `No binded obligationId found for veScaKey ${VE_SCA_KEY}`
      );
    obligationId = bindedObligationId;
    expect(!!bindedObligationId).toBe(true);
  });

  if (obligationId) {
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
  }

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

  it(`Should get veSCA`, async () => {
    const veSca = await scallopQuery.getVeSca(VE_SCA_KEY);
    if (ENABLE_LOG) {
      console.info('VeSca:', veSca);
    }
    expect(!!veSca).toBe(true);

    const veScaSchema = zod.object({
      id: zod.string(),
      keyId: zod.string(),
      lockedScaAmount: zod.string(),
      lockedScaCoin: zod.number(),
      currentVeScaBalance: zod.number(),
      unlockAt: zod.number(),
    });
    expect(veScaSchema.safeParse(veSca).success).toBe(true);
  });

  it(`Should get veSCAs`, async () => {
    const veScas = await scallopQuery.getVeScas({ walletAddress: sender });
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

describe('Test Referral Query', async () => {
  const scallopQuery = await getScallopQuery();
  const sender = scallopQuery.walletAddress;
  console.info(`Your Wallet: ${sender}`);

  it(`Should get referrer veSCA key from a referee address`, async () => {
    const REFEREE_ADDRESS =
      '0xebd7bba0820d6f8ad036929161d9ccb29b4507ffbeb45787b95655bb60785d76' as const;
    const referrerVeScaKey =
      await scallopQuery.getVeScaKeyIdFromReferralBindings(REFEREE_ADDRESS);
    expect(typeof referrerVeScaKey).toBe('string');
    expect(isValidSuiAddress(referrerVeScaKey!)).toBe(true);
  });
});

describe('Test Loyalty Program Query', async () => {
  const scallopQuery = await getScallopQuery();
  const sender = scallopQuery.walletAddress;
  console.info(`Your Wallet: ${sender}`);

  it(`Should get loyalty program information from a user address`, async () => {
    const loyaltyProgramInfoZod = zod.object({
      pendingReward: zod.optional(zod.number()),
      totalPoolReward: zod.number(),
      isClaimEnabled: zod.boolean(),
    });
    const loyaltyProgramInfo = await scallopQuery.getLoyaltyProgramInfos();
    if (ENABLE_LOG) {
      console.info('Loyalty Program Info:', loyaltyProgramInfo);
    }
    expect(!!loyaltyProgramInfo).toBe(true);
    expect(loyaltyProgramInfoZod.safeParse(loyaltyProgramInfo).success).toBe(
      true
    );
  });
});

describe('Test sCoin Query', async () => {
  const scallopQuery = await getScallopQuery();
  const sender = scallopQuery.walletAddress;
  console.info(`Your Wallet: ${sender}`);

  it('Should get total supply of sCoin', async () => {
    const sCoinName = 'ssui';
    const totalSupply = await scallopQuery.getSCoinTotalSupply(sCoinName);
    if (ENABLE_LOG) {
      console.info(`${sCoinName} total supply: ${totalSupply}`);
    }

    expect(typeof totalSupply).toBe('number');
    expect(totalSupply >= 0).toBe(true);
  });

  it('Should get swap rate between sCoin assets', async () => {
    const fromSCoin = 'swusdc';
    const toSCoin = 'ssui';

    const getSCoinSwapRate = await scallopQuery.getSCoinSwapRate(
      fromSCoin,
      toSCoin
    );
    expect(typeof getSCoinSwapRate).toBe('number');
    expect(getSCoinSwapRate > 0).toBe(true);
  });
});

describe('Test Supply Limit Query', async () => {
  const scallopQuery = await getScallopQuery();
  const sender = scallopQuery.walletAddress;
  console.info(`Your Wallet: ${sender}`);

  it('Should get supply limit of a pool', async () => {
    const poolName = 'sui';
    const supplyLimit = await scallopQuery.getPoolSupplyLimit(poolName);
    expect(typeof supplyLimit).toBe('string');
    expect(BigNumber(supplyLimit!).gte(0)).toBe(true);
  });
});

describe('Test Borrow Limit Query', async () => {
  const scallopQuery = await getScallopQuery();
  const sender = scallopQuery.walletAddress;
  console.info(`Your Wallet: ${sender}`);

  it('Should get borrow limit of a pool', async () => {
    const poolName = 'sui';
    const borrowLimit = await scallopQuery.getPoolBorrowLimit(poolName);
    expect(typeof borrowLimit).toBe('string');
    expect(BigNumber(borrowLimit!).gte(0)).toBe(true);
  });
});

describe('Test Isolated Assets', async () => {
  const scallopQuery = await getScallopQuery();
  const sender = scallopQuery.walletAddress;
  console.info(`Your Wallet: ${sender}`);

  it('Should return isolated assets', async () => {
    const isolatedAssets = await scallopQuery.getIsolatedAssets();
    expect(typeof isolatedAssets).toBe('object');
    expect(isolatedAssets.length > 0).toBe(true);
    expect(typeof isolatedAssets[0]).toBe('string');
  });

  it('Should check if an asset is isolated', async () => {
    const isolatedAssetNames = ['fud', 'blub', 'ns'] as string[];
    const isIsolated = (
      await Promise.all(
        isolatedAssetNames.map(
          async (asset) => await scallopQuery.isIsolatedAsset(asset)
        )
      )
    ).every((isIsolated) => isIsolated);
    expect(typeof isIsolated).toBe('boolean');
    expect(isIsolated).toBe(true);

    const notIsolatedAsset = ['sui', 'usdc'];
    const isNotIsolated = (
      await Promise.all(
        notIsolatedAsset.map(
          async (asset) => await scallopQuery.isIsolatedAsset(asset)
        )
      )
    ).every((isIsolated) => isIsolated === false);
    expect(isNotIsolated).toBe(true);
  });
});

describe('Test All Coin Prices Query', async () => {
  it('Should get coin prices', async () => {
    const scallopQuery = await getScallopQuery();
    const coinPrices = await scallopQuery.getAllCoinPrices();
    const swusdcPrice = coinPrices['swusdc'];
    if (ENABLE_LOG) {
      console.info('All coin prices:', coinPrices);
      console.info('Usdc coin price:', swusdcPrice);
    }
    expect(!!coinPrices).toBe(true);
    expect(swusdcPrice).toBeGreaterThanOrEqual(0);
  });
});

describe('Test Address Query', async () => {
  it.skip('Should get pool Addresses', async () => {
    const scallopQuery = await getScallopQuery();
    const poolAddresses = await scallopQuery.getPoolAddresses();
    if (ENABLE_LOG) {
      console.info('Pool addresses:', poolAddresses);
    }
    expect(!!poolAddresses).toBe(true);
  });
});

describe('Test Get Coin Price By Indexer', async () => {
  it('Should get coin price by indexer', async () => {
    const scallopQuery = await getScallopQuery();
    const coinPrice = await scallopQuery.getCoinPriceByIndexer('wusdc');
    if (ENABLE_LOG) {
      console.info('Coin price:', coinPrice);
    }
    expect(coinPrice).toBeGreaterThan(0);
  });
});

describe('Test Get Flashloan Fees', async () => {
  it('Should get flashloan fees', async () => {
    const scallopQuery = await getScallopQuery();
    const flashloanFees = await scallopQuery.getFlashLoanFees();
    if (ENABLE_LOG) {
      console.info('Flashloan fees:', flashloanFees);
    }
    expect(!!flashloanFees).toBe(true);
    expect(Object.keys(flashloanFees).length).toBeGreaterThan(0);
  });
});

describe('Test Get User Portfolio', async () => {
  it('Should get user lendings and borrowings position', async () => {
    const scallopQuery = await getScallopQuery();
    const portfolio = await scallopQuery.getUserPortfolio();
    if (ENABLE_LOG) {
      console.info('User portfolio:', portfolio);
    }

    expect(!!portfolio).toBe(true);
    expect(portfolio.totalSupplyValue > 0).toBe(true);
  });
});
