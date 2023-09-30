import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { NetworkType } from '@scallop-io/sui-kit';
import { Scallop } from '../src';

dotenv.config();

const ENABLE_LOG = true;

// At present, the contract of the testnet is stale and cannot be used normally, please use the mainnet for testing.
const NETWORK: NetworkType = 'mainnet';

describe('Test Scallop Client - Query Method', async () => {
  const scallopSDK = new Scallop({
    secretKey: process.env.SECRET_KEY,
    networkType: NETWORK,
  });
  const client = await scallopSDK.createScallopClient();
  console.info('Your wallet:', client.walletAddress);

  it('Should query market data', async () => {
    const marketData = await client.queryMarket();
    if (ENABLE_LOG) {
      console.info('MarketData:', marketData);
    }
    expect(!!marketData).toBe(true);
  });

  it('Should get obligations data', async () => {
    const obligationsData = await client.getObligations();
    if (ENABLE_LOG) {
      console.info('Obligations data:', obligationsData);
    }
    expect(!!obligationsData).toBe(true);
  });

  it('Should get obligation data', async () => {
    const obligationsData = await client.getObligations();
    expect(obligationsData.length).toBeGreaterThan(0);
    const obligationData = await client.queryObligation(obligationsData[0].id);
    if (ENABLE_LOG) {
      console.info('Obligation data:', obligationData);
    }
    expect(!!obligationData).toBe(true);
  });

  it('Should get all stake accounts data', async () => {
    const allStakeAccountsData = await client.getAllStakeAccounts();
    if (ENABLE_LOG) {
      console.info('All stakeAccounts data:', allStakeAccountsData);
    }
    expect(!!allStakeAccountsData).toBe(true);
  });

  it('Should get stake accounts data', async () => {
    const stakeAccountsData = await client.getStakeAccounts('ssui');
    if (ENABLE_LOG) {
      console.info('StakeAccounts data:', stakeAccountsData);
    }
    expect(!!stakeAccountsData).toBe(true);
  });

  it('Should get stake pool data', async () => {
    const stakePoolData = await client.getStakePool('ssui');
    if (ENABLE_LOG) {
      console.info('Stake pool data:', stakePoolData);
    }
    expect(!!stakePoolData).toBe(true);
  });

  it('Should get reward pool data', async () => {
    const rewardPoolData = await client.getRewardPool('ssui');
    if (ENABLE_LOG) {
      console.info('Reward pool data:', rewardPoolData);
    }
    expect(!!rewardPoolData).toBe(true);
  });
});

describe('Test Scallop Client - Spool Method', async () => {
  const scallopSDK = new Scallop({
    secretKey: process.env.SECRET_KEY,
    networkType: NETWORK,
  });
  const client = await scallopSDK.createScallopClient();
  console.info('Your wallet:', client.walletAddress);

  it('Should create stake account success', async () => {
    const createStakeAccountResult = await client.createStakeAccount('ssui');
    if (ENABLE_LOG) {
      console.info('CreateStakeAccountResult:', createStakeAccountResult);
    }
    expect(createStakeAccountResult.effects?.status.status).toEqual('success');
  });

  it('Should stake success', async () => {
    const stakeResult = await client.stake('ssui', 10 ** 8);
    if (ENABLE_LOG) {
      console.info('StakeResult:', stakeResult);
    }
    expect(stakeResult.effects?.status.status).toEqual('success');
  });

  it('Should unstake success', async () => {
    const unstakeResult = await client.unstake('ssui', 10 ** 8);
    if (ENABLE_LOG) {
      console.info('UnstakeResult:', unstakeResult);
    }
    expect(unstakeResult.effects?.status.status).toEqual('success');
  });

  it('Should unstake and withdraw asset success', async () => {
    const unstakeAndWithdrawResult = await client.unstakeAndWithdraw(
      'ssui',
      2 * 10 ** 8
    );
    if (ENABLE_LOG) {
      console.info('UnstakeAndWithdrawResult:', unstakeAndWithdrawResult);
    }
    expect(unstakeAndWithdrawResult.effects?.status.status).toEqual('success');
  });

  it('Should claim success', async () => {
    const claimResult = await client.claim('ssui');
    if (ENABLE_LOG) {
      console.info('ClaimResult:', claimResult);
    }
    expect(claimResult.effects?.status.status).toEqual('success');
  });
});

describe('Test Scallop Client - Core Method', async () => {
  const scallopSDK = new Scallop({
    secretKey: process.env.SECRET_KEY,
    networkType: NETWORK,
  });
  const client = await scallopSDK.createScallopClient();
  console.info('Your wallet:', client.walletAddress);

  it('Should open obligation success', async () => {
    const openObligationResult = await client.openObligation();
    if (ENABLE_LOG) {
      console.info('OpenObligationResult:', openObligationResult);
    }
    expect(openObligationResult.effects?.status.status).toEqual('success');
  });

  it('Should depoist collateral success', async () => {
    const depositCollateralResult = await client.depositCollateral(
      'sui',
      10 ** 8
    );
    if (ENABLE_LOG) {
      console.info('DepositCollateralResult:', depositCollateralResult);
    }
    expect(depositCollateralResult.effects?.status.status).toEqual('success');
  });

  it('Should withdraw collateral success', async () => {
    const obligations = await client.getObligations();
    expect(obligations.length).toBeGreaterThan(0);
    const withdrawCollateralResult = await client.withdrawCollateral(
      'sui',
      10 ** 8,
      true,
      obligations[0].id,
      obligations[0].keyId
    );
    if (ENABLE_LOG) {
      console.info('WithdrawCollateralResult:', withdrawCollateralResult);
    }
    expect(withdrawCollateralResult.effects?.status.status).toEqual('success');
  });

  it('Should depoist asset success', async () => {
    const depositResult = await client.deposit('sui', 2 * 10 ** 8);
    if (ENABLE_LOG) {
      console.info('DepositResult:', depositResult);
    }
    expect(depositResult.effects?.status.status).toEqual('success');
  });

  it('Should depoist asset and stake success', async () => {
    const depositAndStakeResult = await client.depositAndStake(
      'sui',
      2 * 10 ** 8
    );
    if (ENABLE_LOG) {
      console.info('DepositAndStakeResult:', depositAndStakeResult);
    }
    expect(depositAndStakeResult.effects?.status.status).toEqual('success');
  });

  it('Should withdraw asset success', async () => {
    const withdrawResult = await client.withdraw('sui', 2 * 10 ** 8);
    if (ENABLE_LOG) {
      console.info('WithdrawResult:', withdrawResult);
    }
    expect(withdrawResult.effects?.status.status).toEqual('success');
  });

  it('Should borrow asset success', async () => {
    const obligations = await client.getObligations();
    expect(obligations.length).toBeGreaterThan(0);
    const borrowResult = await client.borrow(
      'sui',
      3 * 10 ** 8,
      true,
      obligations[0].id,
      obligations[0].keyId
    );
    if (ENABLE_LOG) {
      console.info('BorrowResult:', borrowResult);
    }
    expect(borrowResult.effects?.status.status).toEqual('success');
  });

  it('Should repay asset success', async () => {
    const obligations = await client.getObligations();
    expect(obligations.length).toBeGreaterThan(0);
    const repayResult = await client.repay(
      'sui',
      3 * 10 ** 8,
      true,
      obligations[0].id
    );
    if (ENABLE_LOG) {
      console.info('RepayResult:', repayResult);
    }
    expect(repayResult.effects?.status.status).toEqual('success');
  });

  it('Should flash loan successfully', async () => {
    const flashLoanResult = await client.flashLoan(
      'sui',
      10 ** 8,
      (_txBlock, coin) => {
        return coin;
      }
    );
    if (ENABLE_LOG) {
      console.info('FlashLoanResult:', flashLoanResult);
    }
    expect(flashLoanResult.effects?.status.status).toEqual('success');
  });
});

describe('Test Scallop Client - Other Method', async () => {
  const scallopSDK = new Scallop({
    secretKey: process.env.SECRET_KEY,
    networkType: NETWORK,
  });
  const client = await scallopSDK.createScallopClient();
  console.info('Your wallet:', client.walletAddress);

  // Only for testnet.
  it.skip('Should get test coin', async () => {
    const mintTestCoinResult = await client.mintTestCoin('usdc', 10 ** 11);
    if (ENABLE_LOG) {
      console.info('MintTestCoinResult:', mintTestCoinResult);
    }
    expect(mintTestCoinResult.effects?.status.status).toEqual('success');
  });
});
