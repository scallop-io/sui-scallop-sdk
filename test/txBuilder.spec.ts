import * as dotenv from 'dotenv';
import { describe, test, expect } from 'vitest';
import { TransactionBlock } from '@mysten/sui.js';
import { NetworkType } from '@scallop-io/sui-kit';
import { Scallop } from '../src';

const ENABLE_LOG = false;

dotenv.config();

const NETWORK: NetworkType = 'mainnet';

describe('Test Scallop transaction builder', async () => {
  const scallopSDK = new Scallop({
    secretKey: process.env.SECRET_KEY,
    networkType: NETWORK,
  });
  const sender = scallopSDK.suiKit.currentAddress();
  const txBuilder = await scallopSDK.createTxBuilder();
  console.info('\x1b[32mSender: \x1b[33m', sender);

  test('"openObligationEntry" should create a shared obligation, and send obligationKey to sender', async () => {
    const tx = txBuilder.createTxBlock();
    tx.openObligationEntry();
    const openObligationResult = await txBuilder.signAndSendTxBlock(tx);
    if (ENABLE_LOG) console.info('openObligationResult:', openObligationResult);
    expect(openObligationResult.effects.status.status).toEqual('success');
  });

  test('"borrowQuick" should borrow SUI, and return borrowed SUI', async () => {
    const tx = txBuilder.createTxBlock();
    // Sender is required to invoke "borrowQuick"
    tx.setSender(sender);
    const borrowedCoin = await tx.borrowQuick(11 * 10 ** 6, 'sui');
    // Transfer borrowed coin to sender
    tx.transferObjects([borrowedCoin], sender);
    const borrowQuickResult = await txBuilder.signAndSendTxBlock(tx);
    if (ENABLE_LOG) console.info('borrowQuickResult:', borrowQuickResult);
    expect(borrowQuickResult.effects.status.status).toEqual('success');
  });

  test('"repayQuick" should repay SUI', async () => {
    const tx = txBuilder.createTxBlock();
    // Sender is required to invoke "repayQuick"
    tx.setSender(sender);
    await tx.repayQuick(2.1 * 10 ** 7, 'sui');
    const repayQuickResult = await txBuilder.signAndSendTxBlock(tx);
    if (ENABLE_LOG) console.info('repayQuickResult:', repayQuickResult);
    expect(repayQuickResult.effects.status.status).toEqual('success');
  });

  test('"depositQuick" should deposit SUI, and return the "SUI sCoin"', async () => {
    const tx = txBuilder.createTxBlock();
    // Sender is required to invoke "depositQuick"
    tx.setSender(sender);
    const sCoin = await tx.depositQuick(9 * 10 ** 7, 'sui');
    tx.transferObjects([sCoin], sender);
    const depositQuickResult = await txBuilder.signAndSendTxBlock(tx);
    if (ENABLE_LOG) console.info('depositQuickResult:', depositQuickResult);
    expect(depositQuickResult.effects.status.status).toEqual('success');
  });

  test('"withdrawQuick" should burn "SUI sCoin", and return SUI and the interest', async () => {
    const tx = txBuilder.createTxBlock();
    // Sender is required to invoke "withdrawQuick"
    tx.setSender(sender);
    const coin = await tx.withdrawQuick(9 * 10 ** 7, 'sui');
    tx.transferObjects([coin], sender);
    const withdrawQuickResult = await txBuilder.signAndSendTxBlock(tx);
    if (ENABLE_LOG) console.info('withdrawQuickResult:', withdrawQuickResult);
    expect(withdrawQuickResult.effects.status.status).toEqual('success');
  });

  test('"addCollateralQuick" should add SUI as collateral', async () => {
    const tx = txBuilder.createTxBlock();
    // Sender is required to invoke "addCollateralQuick"
    tx.setSender(sender);
    await tx.addCollateralQuick(10 ** 7, 'sui');
    const addCollateralQuickResult = await txBuilder.signAndSendTxBlock(tx);
    if (ENABLE_LOG)
      console.info('addCollateralQuickResult:', addCollateralQuickResult);
    expect(addCollateralQuickResult.effects.status.status).toEqual('success');
  });

  test('"takeCollateralQuick" should take SUI from collateral', async () => {
    const tx = txBuilder.createTxBlock();
    // Sender is required to invoke "removeCollateralQuick"
    tx.setSender(sender);
    const coin = await tx.takeCollateralQuick(10 ** 7, 'sui');
    tx.transferObjects([coin], sender);
    const removeCollateralQuickResult = await txBuilder.signAndSendTxBlock(tx);
    if (ENABLE_LOG)
      console.info('takeCollateralQuickResult:', removeCollateralQuickResult);
    expect(removeCollateralQuickResult.effects.status.status).toEqual(
      'success'
    );
  });

  test('"borrowFlashLoan" & "repayFlashLoan" should be able to borrow and repay 1 USDC flashLoan from Scallop', async () => {
    const tx = txBuilder.createTxBlock();
    const [coin, loan] = tx.borrowFlashLoan(10 ** 7, 'usdc');
    /**
     * Do something with the borrowed coin
     * such as pass it to a dex to make a profit
     */
    // In the end, repay the loan
    tx.repayFlashLoan(coin, loan, 'usdc');
    const borrowFlashLoanResult = await txBuilder.signAndSendTxBlock(tx);
    if (ENABLE_LOG)
      console.info('borrowFlashLoanResult:', borrowFlashLoanResult);
    expect(borrowFlashLoanResult.effects.status.status).toEqual('success');
  });

  test('"updateAssetPricesQuick" should update the prices of "SUI" and "USDC" for Scallop protocol', async () => {
    const tx = txBuilder.createTxBlock();
    await tx.updateAssetPricesQuick(['sui', 'usdc']);
    const updateAssetPricesResult = await txBuilder.signAndSendTxBlock(tx);
    if (ENABLE_LOG)
      console.info('updateAssetPricesResult:', updateAssetPricesResult);
    expect(updateAssetPricesResult.effects.status.status).toEqual('success');
  });

  test('"txBlock" is an instance of "TransactionBlock" from @mysten/sui.js', async () => {
    const tx = txBuilder.createTxBlock();
    expect(tx.txBlock).toBeInstanceOf(TransactionBlock);
    /**
     * For example, you can do the following:
     * 1. split SUI from gas
     * 2. depoit SUI to Scallop
     * 3. transfer SUI sCoin to sender
     */
    const suiTxBlock = tx.txBlock;
    const [coin] = suiTxBlock.splitCoins(suiTxBlock.gas, [
      suiTxBlock.pure(10 ** 6),
    ]);
    const sCoin = tx.deposit(coin, 'sui');
    suiTxBlock.transferObjects([sCoin], suiTxBlock.pure(sender));
    const txBlockResult = await txBuilder.signAndSendTxBlock(tx);
    if (ENABLE_LOG) console.info('txBlockResult:', txBlockResult);
    expect(txBlockResult.effects.status.status).toEqual('success');
  });
});
