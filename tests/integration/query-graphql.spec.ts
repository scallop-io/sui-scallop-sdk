import { isValidSuiAddress } from '@scallop-io/sui-kit';
import { BigNumber } from 'bignumber.js';
import { ScallopQuery } from 'src/models/index.js';
import type { SuiObjectData } from 'src/types/index.js';
import { encodeDynamicFieldNameForV2 } from 'src/utils/dynamicField.js';
import { parseObjectAs } from 'src/utils/object.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { z as zod } from 'zod';
import { graphQLScallopSDK } from '../scallopSdk.js';

const ENABLE_LOG = false;
// let obligationId: string | null;

const VE_SCA_KEY =
  '0xad50994e23ae4268fc081f477d0bdc3f1b92c7049c9038dedec5bac725273d18' as const;
const obligationId =
  '0x98bcdfb4bf5ced4ebe8a490f9dc19f67ecf9bbe2a76b71d8400e344306deed42';
// make sure you test with an account that has binded obligationId to a veScaKey
let scallopQuery: ScallopQuery;
let sender: string;

beforeAll(async () => {
  console.log('start beforeAll');
  scallopQuery = await graphQLScallopSDK.createScallopQuery();
  sender = scallopQuery.walletAddress;
  console.log('end beforeAll');
  console.log(`Your wallet: ${sender}`);
});

// --- RPC accounting: print per-test on-chain call volume + throttle wait so we
// can see which queries spend the rate-limit budget. ---
// beforeEach(() => resetRpcStats());
// afterEach(() => {
//   const stats = getRpcStats();
//   const totalCalls = [...stats.values()].reduce((a, s) => a + s.calls, 0);
//   const totalWaitMs = [...stats.values()].reduce((a, s) => a + s.waitMs, 0);
//   const name = expect.getState().currentTestName;
//   const perMethod = [...stats.entries()]
//     .sort((a, b) => b[1].calls - a[1].calls)
//     .map(([m, s]) => `${m}=${s.calls}`)
//     .join(' ');
//   console.log(
//     `[rpc] ${name}: ${totalCalls} calls, ${Math.round(totalWaitMs)}ms throttle-wait | ${perMethod}`
//   );
// });

describe('Test Query Scallop Contract On Chain Data', () => {
  it('Should get market pools data', async () => {
    const marketPools = await scallopQuery.getMarketPools(['sui', 'wusdc']);

    if (ENABLE_LOG) {
      console.info('Market pool:');
      console.dir(marketPools, { depth: null, colors: true });
    }
    expect(marketPools).toBeTruthy();
  });

  it('Should get market pool data', async () => {
    const suiMarketPool = await scallopQuery.getMarketPool('sui');

    if (ENABLE_LOG) {
      console.info('Sui market pool:');
      console.dir(suiMarketPool, { depth: null, colors: true });
    }
    expect(suiMarketPool).toBeTruthy();
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
    expect(marketCollaterals).toBeTruthy();
  });

  it('Should get market collateral data', async () => {
    const suiMarketCollateral = await scallopQuery.getMarketCollateral('sui');

    if (ENABLE_LOG) {
      console.info('Sui market collateral:');
      console.dir(suiMarketCollateral, { depth: null, colors: true });
    }
    expect(suiMarketCollateral).toBeTruthy();
  });

  it('Should get obligations and its all obligation data', async () => {
    const obligations = await scallopQuery.getObligations();

    if (ENABLE_LOG) {
      console.info('Obligations', obligations);
    }
    expect(obligations).toBeTruthy();

    for (const { id } of obligations) {
      const obligationData = await scallopQuery.queryObligation(id);

      if (ENABLE_LOG) {
        console.info('Id:', id);
        console.info('Obligation:');
        console.dir(obligationData, { depth: null, colors: true });
      }
      expect(obligationData).toBeTruthy();
    }
  });

  it('Should get coin amounts', async () => {
    const coinAmounts = await scallopQuery.getCoinAmounts();

    if (ENABLE_LOG) {
      console.info('Coin amounts:');
      console.dir(coinAmounts, { depth: null, colors: true });
    }
    expect(coinAmounts).toBeTruthy();
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
    expect(marketCoinAmounts).toBeTruthy();
  });

  it('Should get market coin amount', async () => {
    const marketCoinAmount = await scallopQuery.getMarketCoinAmount('ssui');

    if (ENABLE_LOG) {
      console.info('Market coin amount:', marketCoinAmount);
    }
    expect(marketCoinAmount).toBeGreaterThanOrEqual(0);
  });

  it('Should get pyth price data', async () => {
    const usdcPrice = await scallopQuery.getPythCoinPrice('wusdc');

    if (ENABLE_LOG) {
      console.info('Usdc price:', usdcPrice);
    }
    expect(usdcPrice).toBeGreaterThan(0);
  });

  it('Should get pyth prices for multiple assets', async () => {
    const prices = await scallopQuery.getPythCoinPrices({
      coinNames: ['sui', 'wusdc'],
    });

    if (ENABLE_LOG) {
      console.info('Pyth prices:', prices);
    }
    expect(prices).toBeTruthy();
    expect(prices['sui']).toBeGreaterThan(0);
    expect(prices['wusdc']).toBeGreaterThan(0);
  });
});

describe('Test Query Spool Contract On Chain Data', () => {
  it('Should get spools data', async () => {
    const spools = await scallopQuery.getSpools();

    if (ENABLE_LOG) {
      console.info('Spools:');
      console.dir(spools, { depth: null, colors: true });
    }
    expect(spools).toBeTruthy();
  });

  it('Should get spool data', async () => {
    const ssuiSpool = await scallopQuery.getSpool('ssui');

    if (ENABLE_LOG) {
      console.info('sSUI spool:');
      console.dir(ssuiSpool, { depth: null, colors: true });
    }
    expect(ssuiSpool).toBeTruthy();
  });

  it('Should get all stake accounts data', async () => {
    const allStakeAccounts = await scallopQuery.getAllStakeAccounts();

    if (ENABLE_LOG) {
      console.info('All stake accounts:');
      console.dir(allStakeAccounts, { depth: null, colors: true });
    }
    expect(allStakeAccounts).toBeTruthy();
  });

  it('Should get stake accounts data', async () => {
    const stakeAccounts = await scallopQuery.getStakeAccounts('ssui');

    if (ENABLE_LOG) {
      console.info('Stake accounts:');
      console.dir(stakeAccounts, { depth: null, colors: true });
    }
    expect(stakeAccounts).toBeTruthy();
  });

  it('Should get all stake pools data', async () => {
    const stakePools = await scallopQuery.getStakePools();

    if (ENABLE_LOG) {
      console.info('Stake pools:');
      console.dir(stakePools, { depth: null, colors: true });
    }
    expect(stakePools).toBeTruthy();
  });

  it('Should get stake pool data', async () => {
    const suiStakePool = await scallopQuery.getStakePool('ssui');

    if (ENABLE_LOG) {
      console.info('sSui stake pool:');
      console.dir(suiStakePool, { depth: null, colors: true });
    }
    expect(suiStakePool).toBeTruthy();
  });

  it('Should get all stake reward pools data', async () => {
    const stakeRewardPools = await scallopQuery.getStakeRewardPools();

    if (ENABLE_LOG) {
      console.info('Reward pools:');
      console.dir(stakeRewardPools, { depth: null, colors: true });
    }
    expect(stakeRewardPools).toBeTruthy();
  });

  it('Should get all stake reward pool data', async () => {
    const stakeRewardPool = await scallopQuery.getStakeRewardPool('ssui');

    if (ENABLE_LOG) {
      console.info('sSui Reward pool:');
      console.dir(stakeRewardPool, { depth: null, colors: true });
    }
    expect(stakeRewardPool).toBeTruthy();
  });
});

describe('Test Query Borrow Incentive Contract On Chain Data', () => {
  it('Should get borrow incentive pools data', async () => {
    const borrowIncentivePools = await scallopQuery.getBorrowIncentivePools();

    if (ENABLE_LOG) {
      console.info('BorrowIncentive pools:');
      console.dir(borrowIncentivePools, { depth: null, colors: true });
    }
    expect(borrowIncentivePools).toBeTruthy();
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
    expect(borrowIncentiveAccounts).toBeTruthy();
  });

  it('Should return null for an unbound obligationId', async () => {
    const missingObligationId =
      '0x0000000000000000000000000000000000000000000000000000000000000000';
    const bindedVeScaKeyId =
      await scallopQuery.getBindedVeScaKey(missingObligationId);
    expect(bindedVeScaKeyId).toBeNull();
  });

  it('Should return null for a missing dynamic field object', async () => {
    // 0x..01 is not bound to any veSca. The incentive-accounts table-id
    // derivation + dynamic-field read now live inside the borrowIncentive repo;
    // a missing entry must resolve to null rather than throw.
    const missingObligationId =
      '0x0000000000000000000000000000000000000000000000000000000000000001';
    const bindedVeScaKeyId =
      await scallopQuery.getBindedVeScaKey(missingObligationId);
    expect(bindedVeScaKeyId).toBeNull();
  });
});

describe('Test Portfolio Query', () => {
  it('Should get user lendings data', async () => {
    const lendings = await scallopQuery.getLendings(['sui', 'usdc']);

    if (ENABLE_LOG) {
      console.info('User lendings:', lendings);
    }
    expect(lendings).toBeTruthy();
  }, 120000);

  it('Should get user lending data', async () => {
    const lending = await scallopQuery.getLending('sui');

    if (ENABLE_LOG) {
      console.info('User lending:', lending);
    }
    expect(lending).toBeTruthy();
  });

  it('Should get all obligation accounts', async () => {
    const obligationAccounts = await scallopQuery.getObligationAccounts();
    if (ENABLE_LOG) {
      console.info('Obligation accounts:');
      console.dir(obligationAccounts, { depth: null, colors: true });
    }
    expect(obligationAccounts).toBeTruthy();
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
    expect(obligationAccount).toBeTruthy();
  });

  it('Should get obligation account by ids', async () => {
    const obligations = await scallopQuery.getObligationAccountsByIds([
      '0x266b94734966d7fc2bbb83e6a2ae91caf534462d86f49d273a6ea8ffe3a7f7f3',
    ]);

    if (ENABLE_LOG) {
      console.info('Obligations', obligations);
    }
    expect(obligations.length).toBeGreaterThan(0);
  });

  it('Should get obligation account by id', async () => {
    const obligation = await scallopQuery.getObligationAccountById(
      '0x266b94734966d7fc2bbb83e6a2ae91caf534462d86f49d273a6ea8ffe3a7f7f3'
    );

    if (ENABLE_LOG) {
      console.info('Obligation', obligation);
    }
    expect(obligation).toBeDefined();
  });

  it('Should get total value locked', async () => {
    const tvl = await scallopQuery.getTvl();
    if (ENABLE_LOG) {
      console.info('Scallop tvl:', tvl);
    }
    expect(tvl).toBeTruthy();
  });
});

describe('Test VeSca Query', () => {
  it(`Should get binded obligationId of veScaKey ${VE_SCA_KEY}`, async () => {
    const bindedObligation = await scallopQuery.getBindedObligation(VE_SCA_KEY);

    if (ENABLE_LOG) {
      console.info('Binded Obligation Id:', bindedObligation);
    }

    expect(bindedObligation).toBeTruthy();
  });

  it(`Should get veScaKeyId of obligationId ${obligationId}`, async () => {
    const bindedVeScaKeyId = await scallopQuery.getBindedVeScaKey(
      obligationId!
    );

    if (ENABLE_LOG) {
      console.info('Binded VeSca Key Id:', bindedVeScaKeyId);
    }

    expect(bindedVeScaKeyId).toBeTruthy();
    expect(bindedVeScaKeyId).toBe(VE_SCA_KEY);
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
    const { success, data } = treasuryInfoSchema.safeParse(totalVeScaTreasury);
    expect(success).toBe(true);
    expect(data).toBeTruthy();
    expect(data?.totalLockedSca).toBeGreaterThan(0);
    expect(data?.totalVeSca).toBeGreaterThan(0);
  });

  it(`Should get veSCA`, async () => {
    const veSca = await scallopQuery.getVeSca(VE_SCA_KEY);
    if (ENABLE_LOG) {
      console.info('VeSca:', veSca);
    }
    expect(veSca).toBeTruthy();

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
describe('Test Referral Query', () => {
  it(`Should get referrer veSCA key from a referee address`, async () => {
    const REFEREE_ADDRESS =
      '0xebd7bba0820d6f8ad036929161d9ccb29b4507ffbeb45787b95655bb60785d76' as const;
    const referrerVeScaKey =
      await scallopQuery.getVeScaKeyIdFromReferralBindings(REFEREE_ADDRESS);
    expect(typeof referrerVeScaKey).toBe('string');
    expect(isValidSuiAddress(referrerVeScaKey!)).toBe(true);
  });
});

describe('Test Loyalty Program Query', () => {
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
    expect(loyaltyProgramInfo).toBeTruthy();
    expect(loyaltyProgramInfoZod.safeParse(loyaltyProgramInfo).success).toBe(
      true
    );
  });

  it(`Should parse pendingReward from raw user reward object`, async () => {
    const userRewardTableId = scallopQuery.utils.address.get(
      'loyaltyProgram.userRewardTableId'
    );
    // Fetch the raw user-reward dynamic-field object via the native core client
    // (the SDK now reads on-chain through @mysten/sui's CoreClient, not SuiKit's
    // legacy query wrappers).
    const core = scallopQuery.coreClient;
    let rawObject: SuiObjectData | null = null;
    try {
      const { dynamicField } = await core.getDynamicField({
        parentId: userRewardTableId,
        name: encodeDynamicFieldNameForV2({
          type: '0x2::object::ID',
          value: VE_SCA_KEY,
        }),
      });
      const { objects } = await core.getObjects({
        objectIds: [dynamicField.fieldId],
        include: { json: true },
      });
      const obj = objects[0];
      rawObject = obj instanceof Error ? null : (obj ?? null);
    } catch {
      rawObject = null;
    }

    const loyaltyProgramInfo =
      await scallopQuery.getLoyaltyProgramInfos(VE_SCA_KEY);
    expect(loyaltyProgramInfo).toBeTruthy();

    if (!rawObject?.json) {
      expect(loyaltyProgramInfo?.pendingReward ?? 0).toBeGreaterThanOrEqual(0);
      return;
    }

    const rawValue = parseObjectAs<string>(rawObject);
    const expectedPendingReward = BigNumber(rawValue).shiftedBy(-9).toNumber();
    expect(loyaltyProgramInfo?.pendingReward).toBeCloseTo(
      expectedPendingReward,
      8
    );
  });

  it(`Should get veSCA loyalty program information from a veSCA key`, async () => {
    const veScaLoyaltyProgramInfoZod = zod.object({
      pendingScaReward: zod.optional(zod.number()),
      pendingVeScaReward: zod.optional(zod.number()),
      totalPoolReward: zod.number(),
      isClaimEnabled: zod.boolean(),
    });

    const veScaLoyaltyProgramInfo =
      await scallopQuery.getVeScaLoyaltyProgramInfos(VE_SCA_KEY);
    if (ENABLE_LOG) {
      console.info('VeSca Loyalty Program Info:', veScaLoyaltyProgramInfo);
    }
    expect(veScaLoyaltyProgramInfo).toBeTruthy();
    expect(
      veScaLoyaltyProgramInfoZod.safeParse(veScaLoyaltyProgramInfo).success
    ).toBe(true);
  });
});

describe('Test sCoin Query', () => {
  it('Should get total supply of sCoin', async () => {
    const sCoinName = 'ssui';
    const totalSupply = await scallopQuery.getSCoinTotalSupply(sCoinName);
    if (ENABLE_LOG) {
      console.info(`${sCoinName} total supply: ${totalSupply}`);
    }

    expect(typeof totalSupply).toBe('number');
    expect(totalSupply >= 0).toBe(true);
  });

  it('Should get sCoin amounts', async () => {
    const sCoinAmounts = await scallopQuery.getSCoinAmounts(['ssui', 'swusdc']);

    if (ENABLE_LOG) {
      console.info('sCoin amounts:', sCoinAmounts);
    }
    expect(sCoinAmounts).toBeTruthy();
  });

  it('Should get sCoin amount', async () => {
    const sCoinAmount = await scallopQuery.getSCoinAmount('ssui');

    if (ENABLE_LOG) {
      console.info('sCoin amount:', sCoinAmount);
    }
    expect(sCoinAmount).toBeGreaterThanOrEqual(0);
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

describe('Test Supply Limit Query', () => {
  it('Should get supply limit of a pool', async () => {
    const poolName = 'sui';
    const supplyLimit = await scallopQuery.getPoolSupplyLimit(poolName);
    expect(typeof supplyLimit).toBe('string');
    expect(BigNumber(supplyLimit!).gte(0)).toBe(true);
  });
});

describe('Test Borrow Limit Query', () => {
  it('Should get borrow limit of a pool', async () => {
    const poolName = 'sui';
    const borrowLimit = await scallopQuery.getPoolBorrowLimit(poolName);
    expect(typeof borrowLimit).toBe('string');
    expect(BigNumber(borrowLimit!).gte(0)).toBe(true);
  });
});

describe('Test Isolated Assets', () => {
  it('Should return isolated assets', async () => {
    const isolatedAssets = await scallopQuery.getIsolatedAssets();
    expect(typeof isolatedAssets).toBe('object');
    expect(isolatedAssets.length > 0).toBe(true);
    expect(typeof isolatedAssets[0]).toBe('string');
  });

  it('Should check if an asset is isolated', async () => {
    const isolatedAssetNames = ['fud', 'ns', 'musd'] as string[];
    const isIsolated = (
      await Promise.all(
        isolatedAssetNames.map((asset) => scallopQuery.isIsolatedAsset(asset))
      )
    ).every((isIsolated) => isIsolated);
    expect(typeof isIsolated).toBe('boolean');
    expect(isIsolated).toBe(true);

    const notIsolatedAsset = ['sui', 'usdc'];
    const isNotIsolated = (
      await Promise.all(
        notIsolatedAsset.map((asset) => scallopQuery.isIsolatedAsset(asset))
      )
    ).every((isIsolated) => isIsolated === false);
    expect(isNotIsolated).toBe(true);
  });
});

describe('Test All Coin Prices Query', () => {
  it('Should get coin prices', async () => {
    const coinPrices = await scallopQuery.getAllCoinPrices();
    const swusdcPrice = coinPrices['swusdc'];
    if (ENABLE_LOG) {
      console.info('All coin prices:', coinPrices);
      console.info('Usdc coin price:', swusdcPrice);
    }
    expect(coinPrices).toBeTruthy();
    expect(swusdcPrice).toBeGreaterThanOrEqual(0);
  });
});

describe('Test Address Query', () => {
  it('Should get pool Addresses', async () => {
    const poolAddresses = await scallopQuery.getPoolAddresses();
    if (ENABLE_LOG) {
      console.info('Pool addresses:', poolAddresses);
    }
    expect(poolAddresses).toBeTruthy();
  });
});

describe('Test Get Coin Price By Indexer', () => {
  it('Should get coin price by indexer', async () => {
    const coinPrice = await scallopQuery.getIndexerCoinPrice('wusdc');
    if (ENABLE_LOG) {
      console.info('Coin price:', coinPrice);
    }
    expect(coinPrice).toBeGreaterThan(0);
  });

  it('Should get all coin prices by indexer', async () => {
    const coinPrices = await scallopQuery.getIndexerCoinPrices();
    if (ENABLE_LOG) {
      console.info('Coin prices:', coinPrices);
    }
    expect(coinPrices).toBeTruthy();
  });
});

describe('Test Get Flashloan Fees', () => {
  it('Should get flashloan fees', async () => {
    const flashloanFees = await scallopQuery.getFlashLoanFees();
    if (ENABLE_LOG) {
      console.info('Flashloan fees:', flashloanFees);
    }
    expect(flashloanFees).toBeTruthy();
    expect(Object.keys(flashloanFees).length).toBeGreaterThan(0);
  });
});

describe('Test Oracle Query', () => {
  it('Should get price update policies', async () => {
    const policies = await scallopQuery.getPriceUpdatePolicies();
    if (ENABLE_LOG) {
      console.info('Price update policies:', policies);
    }
    expect(policies).toBeTruthy();
  });

  it('Should get asset oracles', async () => {
    const assetOracles = await scallopQuery.getAssetOracles();
    if (ENABLE_LOG) {
      console.info('Asset oracles:', assetOracles);
    }
    expect(assetOracles).toBeTruthy();
    expect(assetOracles['sui']).toBeTruthy();
    expect(assetOracles['sui'].primary.length).toBeGreaterThan(0);
  });

  it('Should get switchboard on-demand aggregator object IDs', async () => {
    const aggObjectIds =
      await scallopQuery.getSwitchboardOnDemandAggregatorObjectIds(['sui']);
    if (ENABLE_LOG) {
      console.info('Switchboard agg object IDs:', aggObjectIds);
    }
    expect(aggObjectIds).toBeTruthy();
    expect(aggObjectIds.length).toBe(1);
  });
});

describe('Test Get User Portfolio', () => {
  it('Should get user lendings and borrowings position', async () => {
    const portfolio = await scallopQuery.getUserPortfolio();
    if (ENABLE_LOG) {
      console.info('User portfolio:', portfolio);
    }

    expect(portfolio).toBeTruthy();
    expect(portfolio.totalSupplyValue > 0).toBe(true);
  });
});
