# Borrow Incentive

The borrow incentive program rewards users for borrowing assets from Scallop. By staking their obligation (debt position) into the incentive pool, users earn additional reward tokens on top of their regular borrowing activity.

## How It Works

1. User opens an obligation and borrows assets (see [client.md](./client.md))
2. User stakes the obligation into the borrow incentive program
3. Rewards accumulate based on the borrowed amount and pool points
4. User claims reward tokens at any time
5. Holding veSCA boosts the reward rate (see [vesca.md](./vesca.md))

## Quick Start

```typescript
import { Scallop } from '@scallop-io/sui-scallop-sdk';

const sdk = new Scallop({
  addressId: '67c44a103fe1b8c454eb9699',
  networkType: 'mainnet',
  secretKey: process.env.SECRET_KEY,
});

const builder = await sdk.createScallopBuilder();
const txBlock = builder.createTxBlock();
txBlock.setSender(myAddress);
```

## Builder Methods (Transaction Operations)

### Normal Methods

Low-level methods that add Move calls to the transaction block. You must supply obligation IDs and key objects directly.

#### `stakeObligation(obligationId, obligationKey)`

Stake an obligation into the borrow incentive pool to start earning rewards.

```typescript
txBlock.stakeObligation(obligationId, obligationKeyId);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `obligationId` | `SuiObjectArg` | Obligation object ID |
| `obligationKey` | `SuiObjectArg` | Obligation key object ID |

---

#### `stakeObligationWithVesca(obligationId, obligationKey, veScaKey)`

Stake an obligation with a veSCA key attached for boosted rewards.

```typescript
txBlock.stakeObligationWithVesca(obligationId, obligationKeyId, veScaKeyId);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `obligationId` | `SuiObjectArg` | Obligation object ID |
| `obligationKey` | `SuiObjectArg` | Obligation key object ID |
| `veScaKey` | `SuiObjectArg` | VeScaKey object ID for boosted rewards |

---

#### `unstakeObligation(obligationId, obligationKey)`

Remove the obligation from the borrow incentive pool. Rewards stop accruing.

```typescript
txBlock.unstakeObligation(obligationId, obligationKeyId);
```

---

#### `claimBorrowIncentive(obligationId, obligationKey, rewardCoinName)`

Claim accumulated reward tokens for a specific reward coin.

```typescript
const rewardCoin = txBlock.claimBorrowIncentive(
  obligationId,
  obligationKeyId,
  'sca'  // reward coin name
);
txBlock.transferObjects([rewardCoin], sender);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `obligationId` | `SuiObjectArg` | Obligation object ID |
| `obligationKey` | `SuiObjectArg` | Obligation key object ID |
| `rewardCoinName` | `string` | Name of the reward coin to claim, e.g. `'sca'` |

**Returns:** `TransactionResult` (the reward coin)

---

#### `deactivateBoost(obligation, veScaKey)`

Remove the veSCA boost from a staked obligation without unstaking.

```typescript
txBlock.deactivateBoost(obligationId, veScaKeyId);
```

---

### Quick Methods

Quick methods handle obligation lookup automatically. They are async.

#### `stakeObligationQuick(obligation?, obligationKey?)`

Stake the user's obligation. If the obligation is already staked, this is a no-op (unless called after an unstake in the same transaction).

```typescript
// Auto-detect and stake the first obligation found
await txBlock.stakeObligationQuick();

// Or specify which obligation to stake
await txBlock.stakeObligationQuick(obligationId, obligationKeyId);

await builder.signAndSendTxBlock(txBlock);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `obligation` | `SuiObjectArg` | (optional) Obligation ID |
| `obligationKey` | `SuiObjectArg` | (optional) Obligation key ID |

---

#### `stakeObligationWithVeScaQuick(obligation?, obligationKey?, veScaKey?)`

Stake with a veSCA boost. Automatically uses the previously bound veSCA key if one exists.

```typescript
// Use the bound veSCA key, or stake without boost if none found
await txBlock.stakeObligationWithVeScaQuick();

// Specify a veSCA key explicitly
await txBlock.stakeObligationWithVeScaQuick(
  obligationId,
  obligationKeyId,
  veScaKeyId
);
```

---

#### `unstakeObligationQuick(obligation?, obligationKey?)`

Unstake the obligation from the borrow incentive pool.

```typescript
await txBlock.unstakeObligationQuick();
// or
await txBlock.unstakeObligationQuick(obligationId, obligationKeyId);
```

---

#### `claimBorrowIncentiveQuick(rewardCoinName, obligation?, obligationKey?)`

Claim rewards for a specific reward coin.

```typescript
const rewardCoin = await txBlock.claimBorrowIncentiveQuick('sca');
txBlock.transferObjects([rewardCoin], sender);

await builder.signAndSendTxBlock(txBlock);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `rewardCoinName` | `string` | Reward coin to claim, e.g. `'sca'` |
| `obligation` | `SuiObjectArg` | (optional) Obligation ID |
| `obligationKey` | `SuiObjectArg` | (optional) Obligation key ID |

**Returns:** `TransactionResult` (the reward coin)

---

## Query Methods

### Get Borrow Incentive Pools

```typescript
const query = await sdk.createScallopQuery();

// Get all borrow incentive pools
const biPools = await query.getBorrowIncentivePools();
// {
//   sui: {
//     coinName: 'sui',
//     symbol: 'SUI',
//     coinType: '0x2::sui::SUI',
//     coinDecimal: 9,
//     coinPrice: 1.23,
//     stakedAmount: 300000000000,
//     stakedCoin: 300,
//     stakedValue: 369,
//     points: {
//       sca: {
//         coinName: 'sca',
//         symbol: 'SCA',
//         coinDecimal: 9,
//         coinPrice: 0.5,
//         points: 100000,
//         distributedPoint: 50000,
//         weightedAmount: 200000,
//         rewardApy: 0.08,
//       }
//     }
//   },
//   ...
// }

// Use indexer for faster loading
const biPools = await query.getBorrowIncentivePools(undefined, true);
```

---

### Get Borrow Incentive Accounts (User State)

Query a user's incentive account for a specific obligation to see pending rewards.

```typescript
const biAccounts = await query.getBorrowIncentiveAccounts(obligationId);
// {
//   sui: {
//     coinName: 'sui',
//     poolType: '0x2::sui::SUI',
//     boostMultiplier: 1.5,  // veSCA boost applied
//     totalPoints: 5000,
//     points: {
//       sca: {
//         coinName: 'sca',
//         weightedAmount: 300,
//         accumulatedPoints: 2500,
//         claimedPoints: 1000,
//         ...
//       }
//     }
//   }
// }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `obligationId` | `string \| SuiObjectRef` | Obligation to query |
| `borrowIncentiveCoinNames` | `string[]` | (optional) Filter to specific coins |

---

### Check veSCA Binding

Check which obligation is bound to a given veSCA key (and vice versa).

```typescript
// Which obligation is bound to this veSCA key?
const obligationId = await query.getBindedObligationId(veScaKeyId);

// Which veSCA key is bound to this obligation?
const veScaKeyId = await query.getBindedVeScaKey(obligationId);
```

---

## Full Example: Stake with veSCA Boost

```typescript
import { Scallop } from '@scallop-io/sui-scallop-sdk';

const sdk = new Scallop({
  addressId: '67c44a103fe1b8c454eb9699',
  networkType: 'mainnet',
  secretKey: process.env.SECRET_KEY,
});

// 1. Check available incentive pools
const query = await sdk.createScallopQuery();
const pools = await query.getBorrowIncentivePools();
console.log('SUI borrow incentive APY:', pools.sui?.points?.sca?.rewardApy);

// 2. Get user's obligations and veSCA
const obligations = await query.getObligations();
const veScas = await query.getVeScas();

// 3. Stake with veSCA boost
const builder = await sdk.createScallopBuilder();
const txBlock = builder.createTxBlock();
txBlock.setSender(myAddress);

await txBlock.stakeObligationWithVeScaQuick(
  obligations[0].id,
  obligations[0].keyId,
  veScas[0].keyId
);

await builder.signAndSendTxBlock(txBlock);
```

## Full Example: Claim Rewards

```typescript
const builder = await sdk.createScallopBuilder();
const txBlock = builder.createTxBlock();
txBlock.setSender(myAddress);

// Claim SCA rewards
const rewardCoin = await txBlock.claimBorrowIncentiveQuick('sca');
txBlock.transferObjects([rewardCoin], myAddress);

await builder.signAndSendTxBlock(txBlock);
```

## Full Example: Unstake → Update Obligation → Restake

When you need to modify your borrow position (which requires the obligation to be unlocked), you must unstake first.

```typescript
const builder = await sdk.createScallopBuilder();
const txBlock = builder.createTxBlock();
txBlock.setSender(myAddress);

// Unstake obligation
await txBlock.unstakeObligationQuick();

// Repay or borrow more (obligation is now unlocked)
await txBlock.repayQuick(50e6, 'usdc');

// Restake with veSCA boost
await txBlock.stakeObligationWithVeScaQuick();

await builder.signAndSendTxBlock(txBlock);
```
