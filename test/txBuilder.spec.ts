import * as dotenv from 'dotenv';
import { describe, test, expect } from 'vitest';
import { TransactionBlock } from '@mysten/sui.js';
import { NetworkType } from '@scallop-io/sui-kit';
import { Scallop } from '../src';

dotenv.config();

const NETWORK: NetworkType = 'mainnet';

describe('Test Scallop transaction builder', async () => {
  const scallopSDK = new Scallop({
    secretKey: process.env.SECRET_KEY,
    networkType: NETWORK,
  });
  const sender = scallopSDK.suiKit.currentAddress();
  console.log(sender);
  const txBuilder = await scallopSDK.createTxBuilder();

  // override pyth oracle addresses
  scallopSDK.address.set(
    'core.packages.pyth.id',
    '0xbab81459a9388dc39e89fc780a300191b1b8bc38f4ecfa1ad050d3bdc52ad8af'
  );
  scallopSDK.address.set(
    'core.oracles.pyth.registry',
    '0xec603dcaf540bb747dddc961ca9e019e1f0a138d12121d350ef53a1096fce55a'
  );
  scallopSDK.address.set(
    'core.oracles.pyth.state',
    '0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8'
  );

  // override oracle feed addresses
  scallopSDK.address.set(
    'core.coins.sui.oracle.pyth.feedObject',
    '0x801dbc2f0053d34734814b2d6df491ce7807a725fe9a01ad74a07e9c51396c37'
  );
  scallopSDK.address.set(
    'core.coins.usdc.oracle.pyth.feedObject',
    '0x5dec622733a204ca27f5a90d8c2fad453cc6665186fd5dff13a83d0b6c9027ab'
  );
  scallopSDK.address.set(
    'core.coins.usdt.oracle.pyth.feedObject',
    '0x985e3db9f93f76ee8bace7c3dd5cc676a096accd5d9e09e9ae0fb6e492b14572'
  );
  scallopSDK.address.set(
    'core.coins.eth.oracle.pyth.feedObject',
    '0x9193fd47f9a0ab99b6e365a464c8a9ae30e6150fc37ed2a89c1586631f6fc4ab'
  );
  scallopSDK.address.set(
    'core.coins.btc.oracle.pyth.feedObject',
    '0x9a62b4863bdeaabdc9500fce769cf7e72d5585eeb28a6d26e4cafadc13f76ab2'
  );
  scallopSDK.address.set(
    'core.coins.sol.oracle.pyth.feedObject',
    '0x9d0d275efbd37d8a8855f6f2c761fa5983293dd8ce202ee5196626de8fcd4469'
  );
  scallopSDK.address.set(
    'core.coins.cetus.oracle.pyth.feedObject',
    '0x24c0247fb22457a719efac7f670cdc79be321b521460bd6bd2ccfa9f80713b14'
  );
  scallopSDK.address.set(
    'core.coins.apt.oracle.pyth.feedObject',
    '0x7c5b7837c44a69b469325463ac0673ac1aa8435ff44ddb4191c9ae380463647f'
  );

  test('"openObligationEntry" should create a shared obligation, and send obligationKey to sender', async () => {
    const tx = txBuilder.createTxBlock();
    tx.openObligationEntry();
    const openObligationResult = await txBuilder.signAndSendTxBlock(tx);
    console.info('openObligationResult:', openObligationResult);
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
    console.info('borrowQuickResult:', borrowQuickResult);
    expect(borrowQuickResult.effects.status.status).toEqual('success');
  });

  test('"repayQuick" should repay SUI', async () => {
    const tx = txBuilder.createTxBlock();
    // Sender is required to invoke "repayQuick"
    tx.setSender(sender);
    await tx.repayQuick(2.1 * 10 ** 7, 'sui');
    const repayQuickResult = await txBuilder.signAndSendTxBlock(tx);
    console.info('repayQuickResult:', repayQuickResult);
    expect(repayQuickResult.effects.status.status).toEqual('success');
  });

  test('"depositQuick" should deposit SUI, and return the "SUI sCoin"', async () => {
    const tx = txBuilder.createTxBlock();
    // Sender is required to invoke "depositQuick"
    tx.setSender(sender);
    const sCoin = await tx.depositQuick(10 ** 8, 'sui');
    tx.transferObjects([sCoin], sender);
    const depositQuickResult = await txBuilder.signAndSendTxBlock(tx);
    console.info('depositQuickResult:', depositQuickResult);
    expect(depositQuickResult.effects.status.status).toEqual('success');
  });

  test('"withdrawQuick" should burn "SUI sCoin", and return SUI and the interest', async () => {
    const tx = txBuilder.createTxBlock();
    // Sender is required to invoke "withdrawQuick"
    tx.setSender(sender);
    const coin = await tx.withdrawQuick(9 * 10 ** 7, 'sui');
    tx.transferObjects([coin], sender);
    const withdrawQuickResult = await txBuilder.signAndSendTxBlock(tx);
    console.info('withdrawQuickResult:', withdrawQuickResult);
    expect(withdrawQuickResult.effects.status.status).toEqual('success');
  });

  test('"addCollateralQuick" should add SUI as collateral', async () => {
    const tx = txBuilder.createTxBlock();
    // Sender is required to invoke "addCollateralQuick"
    tx.setSender(sender);
    await tx.addCollateralQuick(10 ** 8, 'sui');
    const addCollateralQuickResult = await txBuilder.signAndSendTxBlock(tx);
    console.info('addCollateralQuickResult:', addCollateralQuickResult);
    expect(addCollateralQuickResult.effects.status.status).toEqual('success');
  });

  test('"takeCollateralQuick" should take SUI from collateral', async () => {
    const tx = txBuilder.createTxBlock();
    // Sender is required to invoke "removeCollateralQuick"
    tx.setSender(sender);
    const coin = await tx.takeCollateralQuick(10 ** 8, 'sui');
    tx.transferObjects([coin], sender);
    const removeCollateralQuickResult = await txBuilder.signAndSendTxBlock(tx);
    console.info('takeCollateralQuickResult:', removeCollateralQuickResult);
    expect(removeCollateralQuickResult.effects.status.status).toEqual(
      'success'
    );
  });

  test('"borrowFlashLoan" & "repayFlashLoan" should be able to borrow and repay 1 USDC flashLoan from Scallop', async () => {
    const tx = txBuilder.createTxBlock();
    const [coin, loan] = tx.borrowFlashLoan(10 ** 9, 'usdc');
    /**
     * Do something with the borrowed coin
     * such as pass it to a dex to make a profit
     */
    // In the end, repay the loan
    tx.repayFlashLoan(coin, loan, 'usdc');
    const borrowFlashLoanResult = await txBuilder.signAndSendTxBlock(tx);
    console.info('borrowFlashLoanResult:', borrowFlashLoanResult);
    expect(borrowFlashLoanResult.effects.status.status).toEqual('success');
  });

  test('"updateAssetPricesQuick" should update the prices of "SUI" and "USDC" for Scallop protocol', async () => {
    const tx = txBuilder.createTxBlock();
    await tx.updateAssetPricesQuick(['sui', 'usdc']);
    const updateAssetPricesResult = await txBuilder.signAndSendTxBlock(tx);
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
    console.info('txBlockResult:', txBlockResult);
    expect(txBlockResult.effects.status.status).toEqual('success');
  });
});
