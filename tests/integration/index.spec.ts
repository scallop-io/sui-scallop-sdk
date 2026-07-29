import { describe, it } from 'vitest';

// The suite below is disabled (fully commented). This placeholder keeps vitest
// from failing collection with "No test suite found in file".
describe.skip('Test Scallop Client (disabled)', () => {
  it('placeholder', () => {});
});

// import { BigNumber } from 'bignumber.js';
// import { describe, it, expect, beforeAll } from 'vitest';
// import type { Transaction } from '@scallop-io/sui-kit';
// import { scallopSDK } from '../scallopSdk.js';
// import type {
//   ScallopClient,
//   ScallopBuilder,
//   ScallopQuery,
//   ScallopUtils,
// } from 'src/index.js';

// let client: ScallopClient;
// let builder: ScallopBuilder;
// let query: ScallopQuery;
// let utils: ScallopUtils;

// beforeAll(async () => {
//   client = await scallopSDK.createScallopClient();
//   builder = await scallopSDK.createScallopBuilder();
//   query = await scallopSDK.createScallopQuery();
//   utils = await scallopSDK.createScallopUtils();
//   console.info('Your wallet:', client.walletAddress);
// });

// describe('Test Scallop Client - Query Method', () => {
//   it('Should query market data', async () => {
//     const marketData = await client.queryMarket();
//     expect(marketData).toBeTruthy();
//   });

//   it('Should get obligations data', async () => {
//     const obligationsData = await client.getObligations();
//     expect(obligationsData).toBeTruthy();
//   });

//   it('Should get obligation data', async () => {
//     const obligations = await client.getObligations();
//     expect(obligations.length).toBeGreaterThan(0);
//     const obligationData = await client.queryObligation(obligations[0].id);
//     expect(obligationData).toBeTruthy();
//   });

//   it('Should get all stake accounts data', async () => {
//     const allStakeAccountsData = await client.getAllStakeAccounts();
//     expect(allStakeAccountsData).toBeTruthy();
//   });

//   it('Should get stake accounts data', async () => {
//     const stakeAccountsData = await client.getStakeAccounts('ssui');
//     expect(stakeAccountsData).toBeTruthy();
//   });

//   it('Should get stake pool data', async () => {
//     const stakePoolData = await client.getStakePool('ssui');
//     expect(stakePoolData).toBeTruthy();
//   });

//   it('Should get stake reward pool data', async () => {
//     const stakeRewardPoolData = await client.getStakeRewardPool('ssui');
//     expect(stakeRewardPoolData).toBeTruthy();
//   });
// });

// describe('Test Scallop Client - Spool Method', () => {
//   it('Should unstake and withdraw asset success', async () => {
//     const txb = await client.unstakeAndWithdraw('ssui', 5 * 10 ** 7, false);
//     const unstakeAndWithdrawResult =
//       await client.scallopSuiKit.suiKit.signAndSendTxn(txb);
//     expect(
//       (
//         unstakeAndWithdrawResult.Transaction ??
//         unstakeAndWithdrawResult.FailedTransaction
//       ).effects?.status.success
//     ).toBeTruthy();
//   });
// });

// describe('Test Scallop Client - Borrow incentive Method', () => {
//   it('Should create stake account success', async () => {
//     const createStakeAccountResult = await client.createStakeAccount('ssui');
//     expect(
//       (
//         createStakeAccountResult.Transaction ??
//         createStakeAccountResult.FailedTransaction
//       ).effects?.status.success
//     ).toEqual(true);
//   });

//   it('Should stake success', async () => {
//     const stakeResult = await client.stake('ssui', 10 ** 8);
//     expect(
//       (stakeResult.Transaction ?? stakeResult.FailedTransaction).effects?.status
//         .success
//     ).toEqual(true);
//   });

//   it('Should unstake success', async () => {
//     const unstakeResult = await client.unstake('ssui', 10 ** 8);
//     expect(
//       (unstakeResult.Transaction ?? unstakeResult.FailedTransaction).effects
//         ?.status.success
//     ).toEqual(true);
//   });

//   it('Should unstake and withdraw asset success', async () => {
//     const unstakeAndWithdrawResult = await client.unstakeAndWithdraw(
//       'ssui',
//       2 * 10 ** 8
//     );
//     expect(
//       (
//         unstakeAndWithdrawResult.Transaction ??
//         unstakeAndWithdrawResult.FailedTransaction
//       ).effects?.status.success
//     ).toBeTruthy();
//   });

//   it('Should claim success', async () => {
//     const claimResult = await client.claim('ssui');
//     expect(
//       (claimResult.Transaction ?? claimResult.FailedTransaction).effects?.status
//         .success
//     ).toEqual(true);
//   });
// });

// describe('Test Scallop Client - Core Method', () => {
//   it('Should open obligation success', async () => {
//     const openObligationResult = await client.openObligation();
//     expect(
//       (
//         openObligationResult.Transaction ??
//         openObligationResult.FailedTransaction
//       ).effects?.status.success
//     ).toEqual(true);
//   });

//   it('Should deposit collateral success', async () => {
//     const depositCollateralResult = await client.depositCollateral(
//       'sui',
//       10 ** 8
//     );
//     expect(
//       (
//         depositCollateralResult.Transaction ??
//         depositCollateralResult.FailedTransaction
//       ).effects?.status.success
//     ).toEqual(true);
//   });

//   it('Should withdraw collateral success', async () => {
//     const obligations = await client.getObligations();
//     expect(obligations.length).toBeGreaterThan(0);
//     const withdrawCollateralResult = await client.withdrawCollateral(
//       'sui',
//       10 ** 8,
//       true,
//       obligations[0].id,
//       obligations[0].keyId
//     );
//     expect(
//       (
//         withdrawCollateralResult.Transaction ??
//         withdrawCollateralResult.FailedTransaction
//       ).effects?.status.success
//     ).toEqual(true);
//   });

//   it('Should supply asset success', async () => {
//     const supplyResult = await client.supply('sui', 2 * 10 ** 8);
//     expect(
//       (supplyResult.Transaction ?? supplyResult.FailedTransaction).effects
//         ?.status.success
//     ).toEqual(true);
//   });

//   it('Should supply asset and stake success', async () => {
//     const supplyAndStakeResult = await client.supplyAndStake(
//       'sui',
//       2 * 10 ** 8
//     );
//     expect(
//       (
//         supplyAndStakeResult.Transaction ??
//         supplyAndStakeResult.FailedTransaction
//       ).effects?.status.success
//     ).toEqual(true);
//   });

//   it('Should deposit asset and stake success (deprecated)', async () => {
//     const depositAndStakeResult = await client.depositAndStake(
//       'sui',
//       2 * 10 ** 8
//     );
//     expect(
//       (
//         depositAndStakeResult.Transaction ??
//         depositAndStakeResult.FailedTransaction
//       ).effects?.status.success
//     ).toEqual(true);
//   });

//   it('Should withdraw asset success', async () => {
//     const withdrawResult = await client.withdraw('sui', 1.5 * 10 ** 8);
//     expect(
//       (withdrawResult.Transaction ?? withdrawResult.FailedTransaction).effects
//         ?.status.success
//     ).toEqual(true);
//   });

//   it('Should borrow asset success', async () => {
//     const obligations = await client.getObligations();
//     expect(obligations.length).toBeGreaterThan(0);
//     const borrowResult = await client.borrow(
//       'sui',
//       0.4 * 10 ** 8,
//       true,
//       obligations[0].id,
//       obligations[0].keyId
//     );
//     expect(
//       (borrowResult.Transaction ?? borrowResult.FailedTransaction).effects
//         ?.status.success
//     ).toEqual(true);
//   });

//   it('Should repay asset success', async () => {
//     const obligations = await client.getObligations();
//     expect(obligations.length).toBeGreaterThan(0);
//     const repayResult = await client.repay(
//       'sui',
//       0.4 * 10 ** 8,
//       true,
//       obligations[0].id,
//       obligations[0].keyId
//     );
//     expect(
//       (repayResult.Transaction ?? repayResult.FailedTransaction).effects?.status
//         .success
//     ).toEqual(true);
//   });

//   it('Should flash loan successfully', async () => {
//     const flashLoanResult = await client.flashLoan(
//       'sui',
//       10 ** 8,
//       (_txBlock, coin) => {
//         return coin;
//       }
//     );
//     expect(
//       (flashLoanResult.Transaction ?? flashLoanResult.FailedTransaction).effects
//         ?.status.success
//     ).toEqual(true);
//   });
// });

// describe('Test Scallop Client - Other Method', () => {
//   it('Should supply and stake successful', async () => {
//     const sender = client.walletAddress;
//     const coinName = 'sui';
//     const stakeMarketCoinName = utils.parseMarketCoinName<string>(coinName);

//     const stakeAccounts = await query.getStakeAccounts(stakeMarketCoinName);

//     const supplyAmountWithDecimals = 1_000_000_000;

//     const txBlock = builder.createTxBlock();
//     txBlock.setSender(sender);

//     const marketCoin = await txBlock.supplyQuick(
//       supplyAmountWithDecimals,
//       coinName,
//       false // Return marketCoin instead of sCoin for staking
//     );

//     if (stakeAccounts.length > 0) {
//       const stakeAccount = stakeAccounts[0];
//       await txBlock.stakeQuick(
//         marketCoin,
//         stakeMarketCoinName,
//         stakeAccount.id
//       );
//     } else {
//       const stakeAccount =
//         await txBlock.createStakeAccount(stakeMarketCoinName);
//       await txBlock.stakeQuick(marketCoin, stakeMarketCoinName, stakeAccount);
//       txBlock.transferObjects([stakeAccount], sender);
//     }
//     const transactionBlock = txBlock.txBlock;
//     const supplyAndStakeResult =
//       await builder.scallopSuiKit.suiKit.inspectTxn(transactionBlock);
//     expect(
//       (
//         supplyAndStakeResult.Transaction ??
//         supplyAndStakeResult.FailedTransaction
//       ).effects?.status.success
//     ).toEqual(true);
//   });

//   it('Should withdraw and unstake successful', async () => {
//     const sender = client.walletAddress;
//     const coinName = 'sui';
//     const stakeMarketCoinName = utils.parseMarketCoinName<string>(coinName);

//     const marketPool = await query.getMarketPool(coinName);
//     const stakeAccounts = await query.getStakeAccounts(stakeMarketCoinName);
//     const lendingInfo = await query.getLending(coinName);

//     let transactionBlock: Transaction;
//     if (marketPool) {
//       const withdrawAmountWithDecimals = 1_000_000_000;

//       const witdrawMarketAmount = BigNumber(withdrawAmountWithDecimals)
//         .dividedToIntegerBy(marketPool.conversionRate)
//         .toNumber();
//       const unStakedMarketAmount = lendingInfo.availableStakeAmount;

//       if (
//         stakeAccounts.length > 0 &&
//         lendingInfo.availableUnstakeAmount > 0 &&
//         witdrawMarketAmount > unStakedMarketAmount
//       ) {
//         const txBlock = builder.createTxBlock();
//         txBlock.setSender(sender);

//         let needUnstakeMarketAmount =
//           witdrawMarketAmount - unStakedMarketAmount;

//         const txObjects = [];

//         for (const stakeAccount of stakeAccounts) {
//           if (stakeAccount.staked <= needUnstakeMarketAmount) {
//             const marketCoin = await txBlock.unstakeQuick(
//               stakeAccount.staked,
//               stakeMarketCoinName,
//               stakeAccount.id,
//               false
//             );

//             if (marketCoin) {
//               const wdScoin = txBlock.withdraw(marketCoin, coinName);
//               txObjects.push(wdScoin);
//               needUnstakeMarketAmount -= stakeAccount.staked;
//             }
//           } else {
//             const marketCoin = await txBlock.unstakeQuick(
//               needUnstakeMarketAmount,
//               stakeMarketCoinName,
//               stakeAccount.id,
//               false
//             );

//             if (marketCoin) {
//               const wdScoin = txBlock.withdraw(marketCoin, coinName);
//               txObjects.push(wdScoin);
//             }
//             break;
//           }
//         }

//         if (unStakedMarketAmount > 0) {
//           const wdSCoin = await txBlock.withdrawQuick(
//             unStakedMarketAmount,
//             coinName
//           );
//           txObjects.push(wdSCoin);
//         }

//         txBlock.transferObjects(txObjects, sender);
//         transactionBlock = txBlock.txBlock;
//       } else {
//         transactionBlock = await client.withdraw(
//           coinName,
//           withdrawAmountWithDecimals,
//           false,
//           sender
//         );
//       }
//       const withdrawAndUnstakeResult =
//         await builder.scallopSuiKit.suiKit.inspectTxn(transactionBlock);
//       expect(
//         (
//           withdrawAndUnstakeResult.Transaction ??
//           withdrawAndUnstakeResult.FailedTransaction
//         ).effects?.status.success
//       ).toEqual(true);
//     }
//   });

//   // Only for testnet.
//   it.skip('Should get test coin', async () => {
//     const mintTestCoinResult = await client.mintTestCoin('wusdc', 10 ** 11);
//     expect(
//       (mintTestCoinResult.Transaction ?? mintTestCoinResult.FailedTransaction)
//         .effects?.status.success
//     ).toEqual(true);
//   });
// });

// describe('Test Scallop Client - Migrate sCoin method', () => {
//   it('Should migrate all market coin into sCoin successfully', async () => {
//     const txb = await client.migrateAllMarketCoin(false, false);
//     const migrateResult = await client.scallopSuiKit.suiKit.inspectTxn(txb);
//     expect(
//       (migrateResult.Transaction ?? migrateResult.FailedTransaction).effects
//         .status.success
//     ).toBe(true);
//   });
// });

// describe('Test Scallop Client - VeSCA Method', () => {
//   it('Should claim unlocked SCA from all owned veSCA successfully', async () => {
//     const { tx, scaCoin } = await client.claimAllUnlockedSca(false);
//     tx.transferObjects([scaCoin], client.walletAddress);
//     const result = await client.scallopSuiKit.suiKit.inspectTxn(tx);
//     const effects = (result.Transaction ?? result.FailedTransaction).effects;
//     expect(effects.status.success).toBe(true);
//   });
// });
