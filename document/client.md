# Use Scallop Client

## Query Method

Methods for quering on-chain data related to spool and lending contract.

- Get On-chain Data

  ```typescript
  // Query market data.
  const marketData = await client.queryMarket();
  // Get obligations data.
  const obligationsData = await client.getObligations();
  // Get obligation data.
  const obligationsData = await client.getObligations();
  // Get all stake accounts data.
  const allStakeAccountsData = await client.getAllStakeAccounts();
  // Get stake accounts data.
  const stakeAccountsData = await client.getStakeAccounts('ssui');
  // Get stake pool data.
  const stakePoolData = await client.getStakePool('ssui');
  // Get reward pool data.
  const rewardPoolData = await client.getRewardPool('ssui');
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
  // Stake to specific spool, currently support ssui, susdc, and susdt
  const stakeResult = await client.stake('ssui', 10 ** 8);
  ```

- Unstake Market Coin.

  ```typescript
  // Untake to specific spool, currently support ssui, susdc, and susdt
  const unstakeResult = await client.unstake('ssui', 10 ** 8);
  ```

- Cliam Reward Coin.

  ```typescript
  // Claim from the corresponding reward pool of specific spool.
  const claimResult = await client.claim('ssui');
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
    obligationsData[0],
    id
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
    obligations[0].id,
    obligations[0].keyId
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
    obligations[0].id,
    obligations[0].keyId
  );
  ```

- Repay Asset.

  ```typescript
  // Manually obtain obligation id and specify account to repay asset.
  const obligations = await client.getObligations();
  const repayResult = await client.repay(
    'sui',
    3 * 10 ** 8,
    true,
    obligations[0].id
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
