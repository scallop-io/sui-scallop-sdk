# Use Scallop Client

## Query Method

The query methods have been removed from the client and now live on the query instance, reachable via `client.query`. See [query.md](./query.md) for the full surface.

- Get On-chain Data

  ```typescript
  // The query instance is exposed on the client.
  const query = client.query;

  // Query market pools / collaterals.
  const marketPools = await query.getMarketPools(['sui', 'wusdc']);
  // Get obligation data (requires obligation id).
  const obligationsData = await query.getObligations();
  const obligationData = await query.queryObligation(obligationsData[0].id);
  // Get all stake accounts data.
  const allStakeAccountsData = await query.getAllStakeAccounts();
  // Get stake accounts data.
  const stakeAccountsData = await query.getStakeAccounts('ssui');
  // Get stake pool data.
  const stakePoolData = await query.getStakePool('ssui');
  // Get reward pool data.
  const rewardPoolData = await query.getStakeRewardPool('ssui');
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

- Supply Asset.

  ```typescript
  // By default, the client's wallet address is used as the owner for supply.
  const supplyResult = await client.supply('sui', 2 * 10 ** 8);
  // You can specify owner address then supply.
  const supplyResult = await client.supply('sui', 2 * 10 ** 8, true, '0x....');
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

- Unstake Market Coin.

  ```typescript
  // Unstake from specific spool, currently support ssui, swusdc, and swusdt
  const unstakeResult = await client.unstake('ssui', 10 ** 8);
  ```

- Claim Reward Coin.

  ```typescript
  // Claim from the corresponding reward pool of specific spool.
  const claimResult = await client.claim('ssui');
  ```

## Referral Interaction Method

Methods for interacting with the referral contract, reachable via `client.referralService`.

- Bind a wallet to a referrer's veSCA key.

  ```typescript
  // Binds the signer to the referrer identified by their veSCA key id.
  const bindResult = await client.referralService.bindToReferral(veScaKeyId);
  ```

- Claim referral revenue.

  ```typescript
  // Claims accrued referral revenue for the given veSCA key.
  // When coinNames is omitted, it defaults to the lending whitelist.
  const claimResult = await client.referralService.claimReferralRevenue(
    veScaKey,
    ['sui', 'wusdc']
  );
  ```

- Burn a referral ticket.

  ```typescript
  // Burns a referral ticket for the given pool coin.
  const burnResult = await client.referralService.burnReferralTicket(
    ticket,
    'sui'
  );
  ```

## Borrow Incentive Method

Methods for interacting with the borrow incentive contract.

- Stake / unstake an obligation to earn borrow incentives.

  ```typescript
  // Requires the obligation id and key.
  const obligationsData = await client.query.getObligations();
  const stakeResult = await client.stakeObligation(
    obligationsData[0].id,
    obligationsData[0].keyId
  );
  // Unstake it again.
  const unstakeResult = await client.unstakeObligation(
    obligationsData[0].id,
    obligationsData[0].keyId
  );
  ```

- Claim borrow incentive rewards.

  ```typescript
  // Claims every reward coin with an available claim amount on the obligation.
  const obligationsData = await client.query.getObligations();
  const claimBorrowIncentiveResult = await client.claimBorrowIncentive(
    obligationsData[0].id,
    obligationsData[0].keyId
  );
  ```

- Claim all unlocked SCA from expired veSCA accounts.

  ```typescript
  // Claim unlocked SCA from all of the sender's veSCA accounts.
  const claimAllUnlockedScaResult = await client.claimAllUnlockedSca();
  ```

## New sCoin Package Migration Method

Methods for migrating to the new sCoin package

- Migrate all old market coin (including stakes inside spool and mini wallet)

```typescript
// Migrate all old market coin into new sCoin. Pass `false` as parameter to return the txBlock
const txBlock = await client.migrateAllMarketCoin(false);
```
