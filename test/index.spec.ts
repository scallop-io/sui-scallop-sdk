import { BigNumber } from 'bignumber.js';
import { describe, it, expect } from 'vitest';
import { assetCoins } from '../src';
import type { TransactionBlock } from '@scallop-io/sui-kit';
import type { SupportStakeMarketCoins } from '../src';
import { scallopSDK } from './scallopSdk';

const ENABLE_LOG = false;

describe('Test Scallop Client - Query Method', async () => {
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
    const obligations = await client.getObligations();
    expect(obligations.length).toBeGreaterThan(0);
    const obligationData = await client.queryObligation(obligations[0].id);
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

  it('Should get stake reward pool data', async () => {
    const stakeRewardPoolData = await client.getStakeRewardPool('ssui');
    if (ENABLE_LOG) {
      console.info('Stake reward pool data:', stakeRewardPoolData);
    }
    expect(!!stakeRewardPoolData).toBe(true);
  });
});

describe('Test Scallop Client - Spool Method', async () => {
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

describe('Test Scallop Client - Borrow incentive Method', async () => {
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
    const withdrawResult = await client.withdraw('sui', 1.5 * 10 ** 8);
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
      0.4 * 10 ** 8,
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
      0.4 * 10 ** 8,
      true,
      obligations[0].id,
      obligations[0].keyId
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
  const client = await scallopSDK.createScallopClient();
  const builder = await scallopSDK.createScallopBuilder();
  const query = await scallopSDK.createScallopQuery();
  const utils = await scallopSDK.createScallopUtils();
  console.info('Your wallet:', client.walletAddress);

  it('Should supply and stake successful', async () => {
    const sender = client.walletAddress;
    const coinName = assetCoins.sui;
    const stakeMarketCoinName =
      utils.parseMarketCoinName<SupportStakeMarketCoins>(coinName); // sSui.

    const stakeAccounts = await query.getStakeAccounts(stakeMarketCoinName);

    // Lending Supply with Spool Staking.
    const supplyAmountWithDecimals = 1_000_000_000; // Supply target amount.

    const txBlock = builder.createTxBlock();
    txBlock.setSender(sender);

    // Supply.
    const marketCoin = await txBlock.depositQuick(
      supplyAmountWithDecimals,
      coinName
    );

    // And then Stake.
    if (stakeAccounts.length > 0) {
      const stakeAccount = stakeAccounts[0];
      await txBlock.stakeQuick(
        marketCoin,
        stakeMarketCoinName,
        stakeAccount.id
      );
    } else {
      const stakeAccount = txBlock.createStakeAccount(stakeMarketCoinName);
      await txBlock.stakeQuick(marketCoin, stakeMarketCoinName, stakeAccount);
      txBlock.transferObjects([stakeAccount], sender);
    }
    const transactionBlock = txBlock.txBlock;
    const supplyAndStakeResult =
      await builder.suiKit.inspectTxn(transactionBlock);
    if (ENABLE_LOG) {
      console.info('Supply And Stake Result:', transactionBlock);
    }
    expect(supplyAndStakeResult.effects?.status.status).toEqual('success');
  });

  it('Should withdraw and unstake successful', async () => {
    const sender = client.walletAddress;
    const coinName = assetCoins.sui;
    const stakeMarketCoinName =
      utils.parseMarketCoinName<SupportStakeMarketCoins>(coinName); // sSui.

    const marketPool = await query.getMarketPool(coinName);
    const stakeAccounts = await query.getStakeAccounts(stakeMarketCoinName);
    const lendingInfo = await query.getLending(coinName);

    let transactionBlock: TransactionBlock;
    if (marketPool) {
      // Lending Withdraw with Spool Unstaking.
      const withdrawAmountWithDecimals = 1_000_000_000; // Withdraw target amount.

      const witdrawMarketAmount = BigNumber(withdrawAmountWithDecimals)
        .dividedToIntegerBy(marketPool.conversionRate)
        .toNumber();
      const unStakedMarketAmount = lendingInfo.availableStakeAmount;

      if (
        stakeAccounts.length > 0 &&
        lendingInfo.availableUnstakeAmount > 0 &&
        witdrawMarketAmount > unStakedMarketAmount
      ) {
        // unstake staked sSui only if withdrawal market amount > unstaked sSui amount
        // availableUnstakeAmount > 0, unstake, and then withdraw.

        const txBlock = builder.createTxBlock();
        txBlock.setSender(sender);

        // need unstake amount = withdrawal market amount - unstaked sSui amount
        let needUnstakeMarketAmount =
          witdrawMarketAmount - unStakedMarketAmount;

        const txObjects = [];

        // unstake and withdraw from spool
        for (const stakeAccount of stakeAccounts) {
          if (stakeAccount.staked <= needUnstakeMarketAmount) {
            // Unstake sequentially from all stake accounts
            const marketCoin = await txBlock.unstakeQuick(
              stakeAccount.staked,
              stakeMarketCoinName,
              stakeAccount.id
            );

            const wdScoin = txBlock.withdraw(marketCoin, coinName);
            txObjects.push(wdScoin);
            needUnstakeMarketAmount -= stakeAccount.staked;
          } else {
            // A single account has enough to unstake them all.
            const marketCoin = await txBlock.unstakeQuick(
              needUnstakeMarketAmount,
              stakeMarketCoinName,
              stakeAccount.id
            );

            const wdScoin = txBlock.withdraw(marketCoin, coinName);
            txObjects.push(wdScoin);
            break;
          }
        }

        if (unStakedMarketAmount > 0) {
          // withdraw unstaked sSui amount from supply
          const wdSCoin = await txBlock.withdrawQuick(
            unStakedMarketAmount,
            coinName
          );
          txObjects.push(wdSCoin);
        }

        txBlock.transferObjects(txObjects, sender);
        transactionBlock = txBlock.txBlock;
      } else {
        // dereactly witdhdraw.
        transactionBlock = await client.withdraw(
          coinName,
          withdrawAmountWithDecimals,
          false,
          sender
        );
      }
      const withdrawAndUnstakeResult =
        await builder.suiKit.inspectTxn(transactionBlock);
      if (ENABLE_LOG) {
        console.info('Withdraw And Unstake Result:', withdrawAndUnstakeResult);
      }
      expect(withdrawAndUnstakeResult.effects?.status.status).toEqual(
        'success'
      );
    }
  });

  // Only for testnet.
  it.skip('Should get test coin', async () => {
    const mintTestCoinResult = await client.mintTestCoin('usdc', 10 ** 11);
    if (ENABLE_LOG) {
      console.info('MintTestCoinResult:', mintTestCoinResult);
    }
    expect(mintTestCoinResult.effects?.status.status).toEqual('success');
  });
});

describe('Test Scallop Client - Migrate sCoin method', async () => {
  const client = await scallopSDK.createScallopClient();
  console.info('Your wallet:', client.walletAddress);

  it('Should migrate all market coin into sCoin successfully', async () => {
    const txb = await client.migrateAllMarketCoin(false);
    const migrateResult = await client.suiKit.inspectTxn(txb);
    if (ENABLE_LOG) {
      console.info('Migrate result:', migrateResult);
    }

    expect(migrateResult.effects.status.status).toBe('success');
  });
});
