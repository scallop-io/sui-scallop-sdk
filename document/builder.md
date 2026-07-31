# Use ScallopBuilder

## Create Scallop Transaction Block

```typescript
const scallopSDK = new Scallop({
  addressId: '695fcdc084f790c04eb068dc',
  secretKey: process.env.SECRET_KEY,
  network: 'mainnet',
  fullnodeUrl: 'https://fullnode.mainnet.sui.io:443',
});
const scallopBuilder = await scallopSDK.createScallopBuilder();

// Create transaction block to organize your transaction.
const scallopTxBlock = scallopBuilder.createTxBlock();
```

## Organize transactions that interact with lending contract

- Open an obligation account (To borrow from Scallop, it's required).

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  // Create an account and send obligation key to sender.
  scallopTxBlock.openObligationEntry();

  // Simply Create an account, but the object returned by the instruction needs to be processed.
  const [obligation, obligationKey, hotPotato] =
    scallopTxBlock.openObligation();
  await scallopTxBlock.depositCollateralQuick(amount, coinName, obligation);
  scallopTxBlock.returnObligation(obligation, hotPotato);
  scallopTxBlock.transferObjects([obligationKey], sender);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Deposit collateral to collateral pool.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  // Sender is required to invoke "depositCollateralQuick".
  scallopTxBlock.setSender(sender);
  await scallopTxBlock.depositCollateralQuick(10 ** 9, 'wusdc');
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Withdraw collateral from collateral pool.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  // Sender is required to invoke "takeCollateralQuick".
  scallopTxBlock.setSender(sender);
  const coin = await scallopTxBlock.takeCollateralQuick(10 ** 9, 'wusdc');
  scallopTxBlock.transferObjects([coin], sender);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Supply asset to lending pool.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  // Sender is required to invoke "supplyQuick".
  scallopTxBlock.setSender(sender);
  const marketCoin = await scallopTxBlock.supplyQuick(10 ** 9, 'wusdc');
  scallopTxBlock.transferObjects([marketCoin], sender);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Withdraw asset from lending pool.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  // Sender is required to invoke "withdrawQuick".
  scallopTxBlock.setSender(sender);
  const coin = await scallopTxBlock.withdrawQuick(10 ** 9, 'wusdc');
  scallopTxBlock.transferObjects([coin], sender);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Borrow asset from lending pool.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  // Sender is required to invoke "borrowQuick".
  scallopTxBlock.setSender(sender);
  const borrowedCoin = await scallopTxBlock.borrowQuick(10 ** 9, 'wusdc');
  // Transfer borrowed coin to sender.
  scallopTxBlock.transferObjects([borrowedCoin], sender);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Repay asset to lending pool.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  // Sender is required to invoke "repayQuick".
  scallopTxBlock.setSender(sender);
  await scallopTxBlock.repayQuick(10 ** 9, 'wusdc');
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Liquidate an underwater obligation position.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  // Sender is required to invoke "liquidateQuick".
  scallopTxBlock.setSender(sender);
  const [extraDebtCoin, collateralCoin] = await scallopTxBlock.liquidateQuick(
    10 ** 6,
    'usdc',
    'sui',
    '0x...'
  );
  scallopTxBlock.transferObjects([extraDebtCoin, collateralCoin], sender);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- FlashLoan on Scallop.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  const [coin, loan] = scallopTxBlock.borrowFlashLoan(10 ** 9, 'wusdc');
  /**
   * Do something with the borrowed coin
   * such as pass it to a dex to make a profit.
   * scallopTxBlock.moveCall('xx::dex::swap', [coin]);
   */
  // In the end, repay the loan.
  scallopTxBlock.repayFlashLoan(coin, loan, 'wusdc');
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Compatibility with @mysten/sui Transaction.

  Scallop Transaction Builder contains a `Transaction` instance from `@mysten/sui`.
  So you can use both `Transaction` and `ScallopTransactionBlock` at the same time to build your transaction.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  /**
   * For example, you can do the following:
   * 1. split SUI from gas
   * 2. deposit SUI to Scallop
   * 3. transfer SUI Market Coin to sender
   */
  const suiTxBlock = scallopTxBlock.txBlock;
  const [coin] = suiTxBlock.splitCoins(suiTxBlock.gas, [10 ** 6]);
  const marketCoin = scallopTxBlock.supply(coin, 'sui');
  suiTxBlock.transferObjects([marketCoin], suiTxBlock.pure.address(sender));
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Update oracle prices.

  We need to update all coin prices in the obligation account before using withdraw collateral and borrowing. We have included price updates in the `takeCollateralQuick` and `borrowQuick` methods.

  The following demonstrates how to call updates individually.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  // Sender is required to invoke "updateAssetPricesQuick".
  scallopTxBlock.setSender(sender);
  await scallopTxBlock.updateAssetPricesQuick(['sui', 'wusdc']);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

## Organize transactions that interact with spool contract

- Create stake account (To interact with spool, it's required).

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
  const sCoin = await scallopTxBlock.unstakeQuick(10 ** 8, 'ssui');
  scallopTxBlock.transferObjects([sCoin], sender);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Claim reward coin from reward pool.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  // Sender is required to invoke "claimQuick".
  scallopTxBlock.setSender(sender);
  const rewardCoins = await scallopTxBlock.claimQuick('ssui');
  scallopTxBlock.transferObjects(rewardCoins, sender);
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
  await scallopTxBlock.lockScaQuick({
    amountOrCoin: scaAmount,
    lockPeriodInDays,
  });
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Lock more and extend lock period to existing veSCA that is not expired (user has veSCA)

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  const scaAmount = 3;
  const extendPeriodInDays = 2;
  await scallopTxBlock.lockScaQuick({
    amountOrCoin: scaAmount,
    lockPeriodInDays: extendPeriodInDays,
  });
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Extend lock period (user has veSCA that is not expired)

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  const extendPeriodInDays = 2;
  await scallopTxBlock.extendLockPeriodQuick({
    lockPeriodInDays: extendPeriodInDays,
  });
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Lock more SCA to existing veSCA that is not expired

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  const scaAmount = 3;
  await scallopTxBlock.extendLockAmountQuick({ scaAmount });
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Renew expired veSCA (user has veSCA)

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  const scaAmount = 10; // Minimum renew amount is 10 SCA
  const extendPeriodInDays = 7; // Minimum extend period is 1 day
  await scallopTxBlock.renewExpiredVeScaQuick({
    scaAmount,
    lockPeriodInDays: extendPeriodInDays,
  });
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Claim unlocked SCA from expired veSCA

  ```typescript
  const veScaKey = ...;
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  await scallopTxBlock.redeemScaQuick({ veScaKey });
  ```

- Merge veSCA

  ```typescript
  const targetVeScaKey = ... // objectId
  const sourceVeScaKey = ... // objectId
  const scallopTxBlock = scallopBuilder.createTxBlock();

  await scallopTxBlock.mergeVeScaQuick({ targetVeScaKey, sourceVeScaKey });
  ```

- Split veSCA

  ```typescript
  const veScaKey = ... // objectId
  const splitAmount = '1000000000'; // split amount 1 SCA

  // set third param to true to transfer the splitted veScaKey to sender
  await scallopTxBlock.splitVeScaQuick({ splitAmount, veScaKey, transferVeScaKey: true });
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

## Organize transactions that interact with borrow incentive

- Stake an obligation into the borrow incentive program.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  // Obligation id/key are auto-detected from the sender when omitted.
  await scallopTxBlock.stakeObligationQuick();
  // Stake while binding a veSCA key for a boosted rate.
  await scallopTxBlock.stakeObligationWithVeScaQuick(
    obligationId,
    obligationKey,
    veScaKey
  );
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Unstake an obligation from the borrow incentive program.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  await scallopTxBlock.unstakeObligationQuick();
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Claim borrow incentive rewards.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  const rewardCoin = await scallopTxBlock.claimBorrowIncentiveQuick(
    'sui',
    obligationId,
    obligationKey
  );
  scallopTxBlock.transferObjects([rewardCoin], sender);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

## Organize transactions that interact with referral

- Bind the sender to a referrer's veSCA key.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  scallopTxBlock.bindToReferral(referrerVeScaKeyId);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Claim accrued referral revenue.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  // coinNames defaults to the lending whitelist when omitted.
  await scallopTxBlock.claimReferralRevenueQuick(veScaKey, ['sui', 'wusdc']);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Burn a referral ticket.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  scallopTxBlock.burnReferralTicket(ticket, 'sui');
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

## Organize transactions that interact with loyalty program

- Claim loyalty program SCA revenue.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  // veScaKey defaults to the sender's first veSCA account when omitted.
  await scallopTxBlock.claimLoyaltyRevenueQuick(veScaKey);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Claim veSCA loyalty program reward (a new veSCA key).

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.setSender(sender);

  await scallopTxBlock.claimVeScaLoyaltyRewardQuick(veScaKey);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

## Organize transactions that name obligations

The obligation-naming methods attach a human-readable name to an obligation
through its obligation key. Both are normal (synchronous) Move-call methods and
take the obligation key object (id, `SuiObjectRef`, or `SuiObjectArg`).

- Set an obligation name.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  // `obligationKey` is the key object returned by `openObligation()`
  // (or an existing obligation key id from the wallet).
  scallopTxBlock.setObligationName(obligationKey, 'My main position');
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```

- Remove an obligation name.

  ```typescript
  const scallopTxBlock = scallopBuilder.createTxBlock();
  scallopTxBlock.removeObligationName(obligationKey);
  await scallopBuilder.signAndSendTxBlock(scallopTxBlock);
  ```
