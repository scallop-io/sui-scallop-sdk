# Use ScallopBuilder

## Create Scallop Transaction Block

```typescript
const scallopSDK = new Scallop({
  secretKey: process.env.SECRET_KEY,
  networkType: NETWORK,
});
const scallopBuilder = await scallopSDK.createScallopBuilder();

// Create transaction block to organize your transaction.
const scallopTxBlock = scallopBuilder.createTxBlock();
```

## Organize transactions that interact with lending contract

- Open an obligation account (To borrow from Scallop, it's required).

  ```typescript
  const scallopTxBlock = txBuilder.createTxBlock();
  // Create an account and send obligation key to sender.
  scallopTxBlock.openObligationEntry();

  // Simply Create an account, but the object returned by the instruction needs to be processed.
  const [obligation, obligationKey, hotPotato] = txBlock.openObligation();
  await txBlock.addCollateralQuick(amount, coinName, obligation);
  txBlock.returnObligation(obligation, hotPotato);
  txBlock.transferObjects([obligationKey], sender);
  await txBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Deposit collateral to collateral pool.

  ```typescript
  const scallopTxBlock = txBuilder.createTxBlock();
  // Sender is required to invoke "addCollateralQuick".
  scallopTxBlock.setSender(sender);
  await scallopTxBlock.addCollateralQuick(10 ** 9, 'usdc');
  await txBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Withdraw collateral from collateral pool.

  ```typescript
  const scallopTxBlock = txBuilder.createTxBlock();
  // Sender is required to invoke "removeCollateralQuick".
  scallopTxBlock.setSender(sender);
  const coin = await scallopTxBlock.takeCollateralQuick(10 ** 9, 'usdc');
  scallopTxBlock.transferObjects([coin], sender);
  await txBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Supply asset to lending pool.

  ```typescript
  const scallopTxBlock = txBuilder.createTxBlock();
  // Sender is required to invoke "depositQuick".
  scallopTxBlock.setSender(sender);
  const marketCoin = await scallopTxBlock.depositQuick(10 ** 9, 'usdc');
  scallopTxBlock.transferObjects([marketCoin], sender);
  await txBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Withdraw asset from lending pool.

  ```typescript
  const scallopTxBlock = txBuilder.createTxBlock();
  // Sender is required to invoke "withdrawQuick".
  scallopTxBlock.setSender(sender);
  const coin = await scallopTxBlock.withdrawQuick(10 ** 9, 'usdc');
  scallopTxBlock.transferObjects([coin], sender);
  await txBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Borrow asset from lending pool.

  ```typescript
  const scallopTxBlock = txBuilder.createTxBlock();
  // Sender is required to invoke "borrowQuick".
  scallopTxBlock.setSender(sender);
  const borrowedCoin = await scallopTxBlock.borrowQuick(10 ** 9, 'usdc');
  // Transfer borrowed coin to sender.
  scallopTxBlock.transferObjects([borrowedCoin], sender);
  await txBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Repay asset to lending pool.

  ```typescript
  const scallopTxBlock = txBuilder.createTxBlock();
  // Sender is required to invoke "repayQuick".
  scallopTxBlock.setSender(sender);
  await scallopTxBlock.repayQuick(10 ** 9, 'usdc');
  await txBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- FlashLoan on Scallop.

  ```typescript
  const scallopTxBlock = txBuilder.createTxBlock();
  const [coin, loan] = scallopTxBlock.borrowFlashLoan(10 ** 9, 'usdc');
  /**
   * Do something with the borrowed coin
   * such as pass it to a dex to make a profit.
   * scallopTxBlock.moveCall('xx::dex::swap', [coin]);
   */
  // In the end, repay the loan.
  scallopTxBlock.repayFlashLoan(coin, loan, 'usdc');
  await txBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Compatability with @mysten/sui.js TransactionBlock.

  Scallop Transaction Builder contains a `TransactionBlock` instance from `@mysten/sui.js`.
  So you can use both `TransactionBlock` and `ScallopTransactionBlock` at the same time to build your transaction.

  ```typescript
  const scallopTxBlock = txBuilder.createTxBlock();
  /**
   * For example, you can do the following:
   * 1. split SUI from gas
   * 2. depoit SUI to Scallop
   * 3. transfer SUI Market Coin to sender
   */
  const suiTxBlock = scallopTxBlock.txBlock;
  const [coin] = suiTxBlock.splitCoins(suiTxBlock.gas, [
    suiTxBlock.pure(10 ** 6),
  ]);
  const marketCoin = scallopTxBlock.deposit(coin, 'sui');
  suiTxBlock.transferObjects([marketCoin], suiTxBlock.pure(sender));
  await txBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Update oracle prices.

  We need to update all coin prices in the obligation account before using withdraw collateral and borrowing. We have included price updates in the `takeCollateralQuick` and `borrowQuick` methods.

  The following demonstrates how to call updates individually.

  ```typescript
  const scallopTxBlock = txBuilder.createTxBlock();
  // Sender is required to invoke "updateAssetPricesQuick".
  tx.setSender(sender);
  await tx.updateAssetPricesQuick(['sui', 'usdc']);
  await txBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

## Organize transactions that interact with spool contract

- Create stake account (To interact with scoin pool, it's required).

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  const stakeAccount = scallopTxBlock.createStakeAccount('ssui');
  scallopTxBlock.transferObjects([stakeAccount], sender);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Stake market coin to scoin pool.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  // Sender is required to invoke "stakeQuick".
  scallopTxBlock.setSender(sender);
  await scallopTxBlock.stakeQuick(10 ** 8, 'ssui');
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Unstake market coin from scoin pool.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  // Sender is required to invoke "unstakeQuick".
  scallopTxBlock.setSender(sender);
  const marketCoin = await scallopTxBlock.unstakeQuick(10 ** 8, 'ssui');
  scallopTxBlock.transferObjects([marketCoin], sender);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Claim reward coin from reward pool.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  // Sender is required to invoke "claimQuick".
  scallopTxBlock.setSender(sender);
  const rewardCoin = await scallopTxBlock.claimQuick('ssui');
  scallopTxBlock.transferObjects([rewardCoin], sender);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

## Organize transactions that interact with veSCA

- Initial lock sca for veSCA (user has no veSCA yet)

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  /*
    - Minimum lock amount is 10 SCA
    - Minimum lock period is 1 day
  */
  const scaAmount = 10e9; // minimum lock amount is 10 SCA
  const lockPeriodInDays = 1;
  await scallopTxBlock.lockScaQuick(scaAmount, lockPeriodInDays);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Lock more and extend lock period to existing veSCA that is not expired (user has veSCA)

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  const scaAmount = 3;
  const extendPeriodInDays = 2;
  await scallopTxBlock.lockScaQuick(scaAmount, extendPeriodInDays);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Extend lock period (user has veSCA that is not expired)

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  const extendPeriodInDays = 2;
  await scallopTxBlock.extendLockPeriodQuick(extendPeriodInDays);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Lock more SCA to existing veSCA that is not expired

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  const scaAmount = 3;
  await scallopTxBlock.extendLockAmountQuick(scaAmount);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Renew expired veSCA (user has veSCA)

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  const scaAmount = 10; // Minimum renew amount is 10 SCA
  const extendPeriodInDays = 7; // Minimum extend period is 1 day
  await scallopTxBlock.renewExpiredVeScaQuick(scaAmount, extendPeriodInDays);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Claim unlocked SCA from expired veSCA

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  await scallopTxBlock.redeemScaQuick();
  ```

- Convert market coin to new sCoin

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);
  const marketCoinName = 'ssui';

  await scallopTxBlock.mintSCoinQuick(marketCoinName, 10 ** 9);
  ```

- Burn sCoin and get market coin

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);
  const sCoinName = 'ssui';

  await scallopTxBlock.burnSCoinQuick(sCoinName, 10 ** 9);
  ```
