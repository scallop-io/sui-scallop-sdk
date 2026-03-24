# veSCA — Governance Token Locking

veSCA (vote-escrowed SCA) is Scallop's governance and incentive mechanism. Users lock SCA tokens for a period of time to receive veSCA, which grants boosted borrow incentive rewards and governance power.

**Key properties:**
- veSCA balance = `lockedSCA × (remainingLockTime / maxLockDuration)`
- Maximum lock duration is 4 years
- veSCA decays linearly as the unlock time approaches
- Each lock position is represented by a `VeScaKey` NFT held in the user's wallet

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

veSCA operations are available on the transaction block via `newVeScaTxBlock` (used internally by `builder.createTxBlock()`).

### Normal Methods

These are low-level methods that add Move calls to the transaction block. You must supply coin objects and key references directly.

#### `lockSca(scaCoin, unlockAtInSecondTimestamp)`

Create a new veSCA position by locking SCA.

```typescript
const veScaKey = txBlock.lockSca(scaCoin, unlockAt);
txBlock.transferObjects([veScaKey], sender);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `scaCoin` | `TransactionObjectArgument` | SCA coin object |
| `unlockAtInSecondTimestamp` | `number` | Unix timestamp in **seconds** for unlock time |

**Returns:** `TransactionResult` (the new VeScaKey object)

---

#### `extendLockPeriod(veScaKey, newUnlockAtInSecondTimestamp)`

Extend the lock duration of an existing veSCA position.

```typescript
txBlock.extendLockPeriod(veScaKey.keyId, newUnlockAt);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `veScaKey` | `SuiObjectArg` | The VeScaKey object or ID |
| `newUnlockAtInSecondTimestamp` | `number` | New unlock timestamp in seconds (must be later than current) |

---

#### `extendLockAmount(veScaKey, scaCoin)`

Add more SCA to an existing lock position without changing the unlock time.

```typescript
txBlock.extendLockAmount(veScaKey.keyId, additionalScaCoin);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `veScaKey` | `SuiObjectArg` | The VeScaKey object or ID |
| `scaCoin` | `TransactionObjectArgument` | Additional SCA to lock |

---

#### `renewExpiredVeSca(veScaKey, scaCoin, newUnlockAtInSecondTimestamp)`

Re-lock an expired veSCA position. The existing locked SCA must be redeemed first.

```typescript
const unlockedSca = txBlock.redeemSca(veScaKey.keyId);
txBlock.transferObjects([unlockedSca], sender); // optionally reclaim old SCA
txBlock.renewExpiredVeSca(veScaKey.keyId, newScaCoin, newUnlockAt);
```

---

#### `redeemSca(veScaKey)`

Unlock SCA from an expired veSCA position.

```typescript
const scaCoin = txBlock.redeemSca(veScaKey.keyId);
txBlock.transferObjects([scaCoin], sender);
```

**Returns:** `TransactionResult` (the unlocked SCA coin)

---

#### `mintEmptyVeSca()`

Create an empty veSCA key placeholder (used for advanced DeFi integrations).

```typescript
const emptyKey = txBlock.mintEmptyVeSca();
```

---

#### `splitVeSca(veScaKey, splitAmount)`

Split a veSCA position into two, moving `splitAmount` of locked SCA to a new key.

> **Note:** The key must not be registered in the borrow incentive subscription table. Call `unstakeObligationQuick` first if needed.

```typescript
const newVeScaKey = txBlock.splitVeSca(veScaKey, splitAmount);
txBlock.transferObjects([newVeScaKey], sender);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `veScaKey` | `SuiObjectArg` | Source VeScaKey |
| `splitAmount` | `string` | Amount of locked SCA to split (as string, base units) |

---

#### `mergeVeSca(targetKey, sourceKey)`

Merge two veSCA positions. The source position is consumed and its SCA is added to the target.

> **Note:** Neither key can be in the subscription table. Both must have the same unlock time, or the SDK will extend the shorter one to match.

```typescript
txBlock.mergeVeSca(targetVeScaKey, sourceVeScaKey);
```

---

### Quick Methods

Quick methods handle coin selection and object lookup automatically. They are async.

#### `lockScaQuick({ amountOrCoin, lockPeriodInDays, veScaKey?, autoCheck? })`

Lock SCA or extend an existing position. This is the recommended method for most use cases.

- If no existing veSCA is found, a new position is created.
- If the existing position is expired, `renewExpiredVeSca` is called automatically.
- If both `amountOrCoin` and `lockPeriodInDays` are provided, both are applied to an active position.

```typescript
// Initial lock: lock 100 SCA for 365 days
await txBlock.lockScaQuick({ amountOrCoin: 100e9, lockPeriodInDays: 365 });

// Extend period only (no additional SCA)
await txBlock.lockScaQuick({ lockPeriodInDays: 30 });

// Add SCA only (no period change)
await txBlock.lockScaQuick({ amountOrCoin: 50e9 });

await builder.signAndSendTxBlock(txBlock);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `amountOrCoin` | `number \| SuiObjectArg` | SCA amount (base units) or coin object |
| `lockPeriodInDays` | `number` | Additional days to lock |
| `veScaKey` | `SuiObjectData \| string` | (optional) Specific veSCA key to use |
| `autoCheck` | `boolean` | (default `true`) Validate lock parameters |

---

#### `extendLockPeriodQuick({ lockPeriodInDays, veScaKey?, autoCheck? })`

Extend the lock period of the user's veSCA.

```typescript
await txBlock.extendLockPeriodQuick({ lockPeriodInDays: 90 });
```

---

#### `extendLockAmountQuick({ scaAmount, veScaKey?, autoCheck? })`

Add more SCA to the existing lock.

```typescript
await txBlock.extendLockAmountQuick({ scaAmount: 200e9 });
```

---

#### `renewExpiredVeScaQuick({ scaAmount, lockPeriodInDays, veScaKey?, autoCheck? })`

Renew an expired veSCA position. Redeems the current locked SCA and re-locks.

```typescript
await txBlock.renewExpiredVeScaQuick({
  scaAmount: 100e9,
  lockPeriodInDays: 365,
});
```

---

#### `redeemScaQuick({ veScaKey?, transferSca? })`

Redeem unlocked SCA from an expired position.

```typescript
// Transfer SCA directly to sender
await txBlock.redeemScaQuick({ transferSca: true });

// Return SCA coin for use in the same tx
const sca = await txBlock.redeemScaQuick({ transferSca: false });
```

---

#### `splitVeScaQuick({ splitAmount, veScaKey, transferVeScaKey? })`

Split a veSCA position, optionally transferring the new key to the sender.

```typescript
await txBlock.splitVeScaQuick({
  splitAmount: '50000000000', // 50 SCA in base units
  veScaKey: '0x...',
  transferVeScaKey: true,
});
```

---

#### `mergeVeScaQuick({ targetVeScaKey, sourceVeScaKey })`

Merge two veSCA positions. Automatically aligns unlock times before merging.

```typescript
await txBlock.mergeVeScaQuick({
  targetVeScaKey: '0xabc...',
  sourceVeScaKey: '0xdef...',
});
```

---

## Query Methods

### Get All veSCA Positions

```typescript
const query = await sdk.createScallopQuery();

// Get all veSCA positions for the connected wallet
const veScas = await query.getVeScas();
// [
//   {
//     id: '0x...',          // veSCA dynamic field object ID
//     keyId: '0x...',       // VeScaKey NFT ID (held in wallet)
//     lockedScaAmount: '100000000000',  // raw amount (base units)
//     lockedScaCoin: 100,   // human-readable SCA amount
//     currentVeScaBalance: 50.5,  // current veSCA voting power
//     unlockAt: 1735689600000,    // unlock timestamp in ms
//   },
//   ...
// ]

// Get veSCA for a specific address
const veScas = await query.getVeScas('0x...');

// Exclude empty (placeholder) positions
const veScas = await query.getVeScas(undefined, true);
```

### Get a Single veSCA

```typescript
// By VeScaKey ID
const veSca = await query.getVeSca('0x...');

// By VeScaKey object data
const veSca = await query.getVeSca(veScaKeyObjectData);
```

**Returns:**
```typescript
{
  id: string;             // veSCA object ID
  keyId: string;          // VeScaKey ID in wallet
  lockedScaAmount: string; // raw locked SCA (base units)
  lockedScaCoin: number;   // SCA amount (decimal)
  currentVeScaBalance: number; // current veSCA power
  unlockAt: number;        // unlock timestamp (ms)
}
```

### Get veSCA Treasury Info

```typescript
const treasuryInfo = await query.getVeScaTreasuryInfo();
// {
//   totalLockedSca: 5000000,   // total SCA locked in protocol
//   totalVeSca: 2500000,       // total veSCA outstanding
//   averageLockingPeriod: 1.5, // average lock period
//   averageLockingPeriodUnit: 'year',
// }
```

## Full Example: Lock SCA

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

// Lock 100 SCA for 1 year
await txBlock.lockScaQuick({
  amountOrCoin: 100e9, // 100 SCA (9 decimals)
  lockPeriodInDays: 365,
});

const result = await builder.signAndSendTxBlock(txBlock);
console.log('Transaction digest:', result.digest);
```

## Full Example: Query and Redeem

```typescript
const query = await sdk.createScallopQuery();
const veScas = await query.getVeScas();

const expired = veScas.filter(v => v.unlockAt <= Date.now());

if (expired.length > 0) {
  const builder = await sdk.createScallopBuilder();
  const txBlock = builder.createTxBlock();
  txBlock.setSender(myAddress);

  await txBlock.redeemScaQuick({
    veScaKey: expired[0].keyId,
    transferSca: true,
  });

  await builder.signAndSendTxBlock(txBlock);
}
```
