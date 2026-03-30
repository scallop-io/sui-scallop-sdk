# ScallopClient

`ScallopClient` provides high-level, one-call methods for interacting with the Scallop lending protocol. Each method builds a transaction, signs it, and submits it in a single call.

## Setup

```typescript
import { Scallop } from '@scallop-io/sui-scallop-sdk';

const sdk = new Scallop({ secretKey: process.env.SECRET_KEY });
const client = await sdk.createScallopClient();
```

## The `sign` Parameter

Every write method accepts an optional `sign` parameter:

- `sign = true` _(default)_ — signs and submits the transaction, returns `SuiTransactionBlockResponse`
- `sign = false` — returns a `Transaction` object without submitting (useful for composing into larger transactions)

```typescript
// Execute immediately (default)
const result = await client.supply('sui', 1_000_000_000);

// Get transaction block without executing
const tx = await client.supply('sui', 1_000_000_000, false);
// tx is a Transaction object — pass it to your own signer
```

---

## Deprecated Query Methods

These methods proxy to `ScallopQuery` and may be removed in a future release. Use `client.query` directly instead.

```typescript
// Deprecated — use client.query.queryMarket() instead
const marketData = await client.queryMarket();

// Deprecated — use client.query.getObligations() instead
const obligations = await client.getObligations();
const obligation = await client.queryObligation(obligations[0].id);

// Deprecated — use client.query.getAllStakeAccounts() instead
const allStakeAccounts = await client.getAllStakeAccounts();
const stakeAccounts = await client.getStakeAccounts('ssui');
const stakePool = await client.getStakePool('ssui');
const rewardPool = await client.getStakeRewardPool('ssui');
```

---

## Core Lending Methods

### Open Obligation

Creates an obligation account. Required before depositing collateral or borrowing.

```typescript
const result = await client.openObligation();
```

### Supply Asset

Supply an asset to a lending pool and receive sCoin in return.

```typescript
// Supply 1 SUI (amounts are in base units, 1 SUI = 10^9 MIST)
const result = await client.supply('sui', 1_000_000_000);

// Supply from a specific wallet address
const result = await client.supply('sui', 1_000_000_000, true, '0x...');
```

> `deposit()` is an alias for `supply()` and is deprecated. Use `supply()` instead.

### Supply and Stake

Supply an asset and immediately stake the received sCoin into the corresponding Spool in a single transaction.

```typescript
// Supply 1 SUI and stake ssui into the spool
const result = await client.supplyAndStake('ssui', 1_000_000_000);

// Specify a target stake account
const result = await client.supplyAndStake(
  'ssui',
  1_000_000_000,
  true,
  stakeAccountId
);
```

> `depositAndStake()` is deprecated. Use `supplyAndStake()` instead.

### Withdraw Asset

Withdraw a previously supplied asset from the lending pool.

```typescript
// Withdraw 1 SUI worth of supplied asset
const result = await client.withdraw('sui', 1_000_000_000);

// Withdraw from a specific wallet address
const result = await client.withdraw('sui', 1_000_000_000, true, '0x...');
```

### Deposit Collateral

Deposit a coin as collateral into an obligation account.

If no `obligationId` is provided, the client will:

- Use the first existing obligation for the wallet, or
- Automatically create a new obligation if none exists

```typescript
// Auto-select or create obligation
const result = await client.depositCollateral('sui', 1_000_000_000);

// Specify a target obligation
const obligations = await client.query.getObligations();
const result = await client.depositCollateral(
  'sui',
  1_000_000_000,
  true,
  obligations[0].id
);
```

### Withdraw Collateral

Withdraw collateral from an obligation account. Requires both the obligation ID and the obligation key ID.

```typescript
const obligations = await client.query.getObligations();
const result = await client.withdrawCollateral(
  'sui',
  1_000_000_000,
  true,
  obligations[0].id,
  obligations[0].keyId
);
```

### Borrow Asset

Borrow an asset from a lending pool against your collateral. Requires an obligation with sufficient collateral.

```typescript
const obligations = await client.query.getObligations();
const result = await client.borrow(
  'sui',
  500_000_000,
  true,
  obligations[0].id,
  obligations[0].keyId
);
```

### Repay Asset

Repay a borrowed asset. Requires both the obligation ID and the obligation key ID.

```typescript
const obligations = await client.query.getObligations();
const result = await client.repay(
  'sui',
  500_000_000,
  true,
  obligations[0].id,
  obligations[0].keyId
);
```

### Flash Loan

Borrow an asset and repay it within the same transaction. Use the `callback` to build the operations between borrow and repay.

```typescript
const result = await client.flashLoan(
  'sui',
  1_000_000_000,
  async (_txBlock, coin) => {
    // Use the borrowed coin here (e.g., arbitrage, liquidation)
    // Must return a coin object to repay the loan
    return coin;
  }
);
```

---

## Spool Methods

### Create Stake Account

Creates a staking account for a specific Spool. Each Spool can have multiple accounts per wallet.

```typescript
const result = await client.createStakeAccount('ssui');
```

### Stake

Stake sCoin into the corresponding Spool to earn rewards.

```typescript
// Stake 1 ssui (auto-selects or creates a stake account)
const result = await client.stake('ssui', 1_000_000_000);

// Stake into a specific stake account
const result = await client.stake('ssui', 1_000_000_000, true, stakeAccountId);
```

### Unstake

Unstake sCoin from the Spool, returning sCoin to your wallet.

```typescript
const result = await client.unstake('ssui', 1_000_000_000);
```

### Unstake and Withdraw

Unstake sCoin from the Spool and immediately redeem it for the underlying asset in a single transaction.

```typescript
// Unstake ssui and receive SUI back
const result = await client.unstakeAndWithdraw('ssui', 1_000_000_000);
```

### Claim Spool Rewards

Claim accumulated rewards from a Spool.

```typescript
const result = await client.claim('ssui');
```

---

## Borrow Incentive Methods

### Stake Obligation

Stake an obligation into the borrow incentive program to start earning borrow incentive rewards.

```typescript
const obligations = await client.query.getObligations();
const result = await client.stakeObligation(
  obligations[0].id,
  obligations[0].keyId
);
```

### Unstake Obligation

Unstake an obligation from the borrow incentive program.

```typescript
const obligations = await client.query.getObligations();
const result = await client.unstakeObligation(
  obligations[0].id,
  obligations[0].keyId
);
```

### Claim Borrow Incentive Rewards

Claim all available borrow incentive rewards for an obligation.

```typescript
const obligations = await client.query.getObligations();
const result = await client.claimBorrowIncentive(
  obligations[0].id,
  obligations[0].keyId
);
```

---

## Migration

### Migrate Market Coins to sCoin

Migrates all legacy market coins in the wallet to the new sCoin format. Includes coins held in Spool accounts by default.

```typescript
// Migrate all market coins (including staked ones)
const result = await client.migrateAllMarketCoin();

// Migrate only wallet balance, skip Spool stakes
const result = await client.migrateAllMarketCoin(false);

// Return the transaction block without executing
const tx = await client.migrateAllMarketCoin(true, false);
```
