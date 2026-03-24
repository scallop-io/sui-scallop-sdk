# Use Scallop Client

## Query Method

Methods for quering on-chain data related to spool and lending contract.

The query methods in the client have been migrated to the query instance. These methods may be removed from the client in the future.

- Get On-chain Data

  ```typescript
  // Query market data.
  const marketData = await client.queryMarket();
  // Get obligations data.
  const obligationsData = await client.getObligations();
  // Get obligation data.
  const obligationData = await client.queryObligation();
  // Get all stake accounts data.
  const allStakeAccountsData = await client.getAllStakeAccounts();
  // Get stake accounts data.
  const stakeAccountsData = await client.getStakeAccounts('ssui');
  // Get stake pool data.
  const stakePoolData = await client.getStakePool('ssui');
  // Get reward pool data.
  const rewardPoolData = await client.getStakeRewardPool('ssui');
  ```

## Core Interaction Method

Methods for interacting with the lending contract.

- Open Obligation.

  ```typescript
  // Open obligation.
  const openObligationResult = await client.openObligation();
  ```

- Deposit Collateral.

  ```typescript
  // When the obligation id is not provided and no obligation is detected for the wallet address, an obligation account will be automatically created for the user.
  // If the obligation id is not provided but it is detected that the wallet address has obligation, coins will be deposited to the first account by default.
  const depositCollateralResult = await client.depositCollateral(
    'sui',
    10 ** 8
  );
  // Manually obtain obligation id and specify account to deposit collateral.
  const obligationsData = await client.getObligations();
  const depositCollateralResult = await client.depositCollateral(
    'sui',
    10 ** 8,
    true,
    obligationsData[0].id
  );
  ```

- Withdraw Collateral.

  ```typescript
  // Withdrawing collateral requires specifying obligation id and key.
  // Manually obtain obligation id and specify account to withdraw collateral.
  const obligationsData = await client.getObligations();
  const withdrawCollateralResult = await client.withdrawCollateral(
    'sui',
    10 ** 8,
    true,
    obligationsData[0].id,
    obligationsData[0].keyId
  );
  ```

- Deposit Asset.

  ```typescript
  // By default, the client's wallet address is used as the owner for deposit.
  const depositResult = await client.deposit('sui', 2 * 10 ** 8);
  // You can specify owner address then deposit.
  const depositResult = await client.deposit(
    'sui',
    2 * 10 ** 8,
    true,
    '0x....'
  );
  ```

- Withdraw Asset.

  ```typescript
  // By default, the client's wallet address is used as the owner for withdraw.
  const withdrawResult = await client.withdraw('sui', 2 * 10 ** 8);
  // You can specify owner address then withdraw.
  const withdrawResult = await client.withdraw(
    'sui',
    2 * 10 ** 8,
    true,
    '0x....'
  );
  ```

- Borrow Asset.

  ```typescript
  // Borrowing asset requires specifying obligation id and key.
  // Manually obtain obligation id and specify account to borrow asset.
  const obligationsData = await client.getObligations();
  const borrowResult = await client.borrow(
    'sui',
    3 * 10 ** 8,
    true,
    obligationsData[0].id,
    obligationsData[0].keyId
  );
  ```

- Repay Asset.

  ```typescript
  // Manually obtain obligation id and specify account to repay asset.
  const obligationsData = await client.getObligations();
  const repayResult = await client.repay(
    'sui',
    3 * 10 ** 8,
    true,
    obligationsData[0].id
  );
  ```

- Flash Loan.
  ```typescript
  // Organize your transaction block in callback
  const flashLoanResult = await client.flashLoan(
    'sui',
    10 ** 8,
    async (_txBlock, coin) => {
      return coin;
    }
  );
  ```

## Spool Interaction Method

Methods for interacting with the spool contract.

- Create Stake Account.

  ```typescript
  // Create stake account for specific spool, each pool can have multiple accounts.
  const createStakeAccountResult = await client.createStakeAccount('ssui');
  ```

- Stake Market Coin.

  ```typescript
  // Stake to specific spool, currently support ssui, swusdc, and swusdt
  const stakeResult = await client.stake('ssui', 10 ** 8);
  ```

- Deposit Asset and Stake in One Transaction.

  ```typescript
  // Deposit SUI and immediately stake in the ssui spool
  const result = await client.depositAndStake('ssui', 2 * 10 ** 8);
  // Specify a stake account to use
  const result = await client.depositAndStake(
    'ssui',
    2 * 10 ** 8,
    true,
    stakeAccountId
  );
  ```

- Unstake Market Coin.

  ```typescript
  // Unstake from specific spool, currently support ssui, swusdc, and swusdt
  const unstakeResult = await client.unstake('ssui', 10 ** 8);
  ```

- Unstake and Withdraw in One Transaction.

  ```typescript
  // Unstake market coin from spool and withdraw the underlying asset atomically
  const result = await client.unstakeAndWithdraw('ssui', 10 ** 8);
  ```

- Claim Reward Coin.

  ```typescript
  // Claim from the corresponding reward pool of specific spool.
  const claimResult = await client.claim('ssui');
  ```

## New sCoin Package Migration Method

Methods for migrating to the new sCoin package

- Migrate all old market coin (including stakes inside spool and mini wallet)

```typescript
// Migrate all old market coin into new sCoin. Pass `false` as parameter to return the txBlock
const txBlock = await client.migrateAllMarketCoin(false);
```

## Borrow Incentive Method

Methods for managing borrow incentive participation. These methods automatically handle veSCA boost if a veSCA key is bound to the obligation.

> For low-level borrow incentive builder methods, see [borrow-incentive.md](./borrow-incentive.md).

- Stake Obligation (start earning borrow incentive rewards).

  ```typescript
  const obligations = await client.getObligations();
  // Automatically uses veSCA boost if available
  const stakeResult = await client.stakeObligation(
    obligations[0].id,
    obligations[0].keyId
  );
  ```

- Unstake Obligation.

  ```typescript
  const obligations = await client.getObligations();
  const unstakeResult = await client.unstakeObligation(
    obligations[0].id,
    obligations[0].keyId
  );
  ```

- Claim Borrow Incentive Rewards.

  Automatically claims all available reward coins for the obligation.

  ```typescript
  const obligations = await client.getObligations();
  const claimResult = await client.claimBorrowIncentive(
    obligations[0].id,
    obligations[0].keyId
  );
  ```

  > **Note:** `client.borrow()` and `client.repay()` automatically unstake before and restake after the operation for assets in the borrow incentive whitelist.

## veSCA Method

Methods for managing veSCA (vote-escrowed SCA) positions.

> For full veSCA builder and query documentation, see [vesca.md](./vesca.md).

- Claim Unlocked SCA from all expired veSCA positions.

  ```typescript
  // Claim SCA from all veSCA accounts where unlock time has passed
  const claimResult = await client.claimAllUnlockedSca();

  // Return the transaction block without signing
  const { tx, scaCoin } = await client.claimAllUnlockedSca(false);
  ```
