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

  // override oracle addresses
  scallopSDK.address.set(
    'core.packages.xOracle.id',
    '0x1b2edca7df0bb72e230fa1771e059bf20bd525a36a8653c61929ab6d9febb144'
  );
  scallopSDK.address.set(
    'core.oracles.xOracle',
    '0xfeea40c13edc5341a379f9787f8b30fb554eeb0f2bdd48d4443f2b7abe29ebc9'
  );
  scallopSDK.address.set(
    'core.packages.pyth.id',
    '0x029c377ea819a181abf7d71e5592f7c6f82bd7c647ef0a33bf38033c4514fcf5'
  );
  scallopSDK.address.set(
    'core.oracles.pyth.registry',
    '0xcc9ba68b46251ad7bc7d41b55a3da5ca7ff2f2e0c7a123bb9f2b6ba33ff55878'
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

  // override protocol addresses
  scallopSDK.address.set(
    'core.packages.protocol.id',
    '0x18dfee1976557255017636dfaa0593576c7d0a0147a3af373533309ccdf720e5'
  );
  scallopSDK.address.set(
    'core.market',
    '0xdfacee2cf5e65194a74ebdeb99b779b9ebbbb47bfb270d4a93e5babfd739985b'
  );
  scallopSDK.address.set(
    'core.version',
    '0xdaa71410abb62ff4830e15b007571aa7940bfe306ce7a6687c818203cb0c730c'
  );
  scallopSDK.address.set(
    'core.coinDecimalsRegistry',
    '0x737aac3f2b6b825c67749ad32806c1aefd49c4031c754441de73f3364dca2a7b'
  );
  scallopSDK.address.set(
    'core.packages.query.id',
    '0x9cf3f55377a6987cb5250193cd6e8f4770751e68d6ea4dae203cb71718840a24'
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
