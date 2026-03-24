# Loyalty Program

The Scallop loyalty program rewards veSCA holders with SCA tokens and additional veSCA based on their locked position. There are two separate reward pools:

- **SCA Loyalty Program** — rewards SCA tokens to veSCA holders
- **veSCA Loyalty Program** — rewards a new VeScaKey (governance position) to veSCA holders

Both programs require holding a veSCA position to be eligible.

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

#### `claimLoyaltyRevenue(veScaKey)`

Claim pending SCA rewards from the SCA loyalty reward pool.

```typescript
const scaCoin = txBlock.claimLoyaltyRevenue(veScaKeyId);
txBlock.transferObjects([scaCoin], sender);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `veScaKey` | `SuiObjectArg` | The VeScaKey object or ID |

**Returns:** `TransactionResult` (the SCA reward coin)

---

#### `claimVeScaLoyaltyReward(veScaKey)`

Claim a new VeScaKey from the veSCA loyalty reward pool.

```typescript
const newVeScaKey = txBlock.claimVeScaLoyaltyReward(veScaKeyId);
txBlock.transferObjects([newVeScaKey], sender);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `veScaKey` | `SuiObjectArg` | The VeScaKey object or ID |

**Returns:** `TransactionResult` (the new VeScaKey NFT)

---

### Quick Methods

#### `claimLoyaltyRevenueQuick(veScaKey?)`

Claim SCA loyalty rewards. Automatically finds the user's veSCA key if not provided. Merges claimed SCA with existing SCA in the wallet.

```typescript
// Auto-detect veSCA key and claim
await txBlock.claimLoyaltyRevenueQuick();

// Or specify a veSCA key explicitly
await txBlock.claimLoyaltyRevenueQuick(veScaKeyObjectOrId);

await builder.signAndSendTxBlock(txBlock);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `veScaKey` | `SuiObjectData \| string` | (optional) VeScaKey object or ID; defaults to first veSCA found |

---

#### `claimVeScaLoyaltyRewardQuick(veScaKey?)`

Claim a new VeScaKey from the veSCA loyalty reward pool. The new key is transferred to the sender.

```typescript
// Auto-detect veSCA key and claim
await txBlock.claimVeScaLoyaltyRewardQuick();

// Or specify explicitly
await txBlock.claimVeScaLoyaltyRewardQuick(veScaKeyObjectOrId);

await builder.signAndSendTxBlock(txBlock);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `veScaKey` | `SuiObjectData \| string` | (optional) VeScaKey object or ID; defaults to first veSCA found |

---

## Query Methods

### Get SCA Loyalty Program Info

Returns the pool state and the user's pending SCA reward.

```typescript
const query = await sdk.createScallopQuery();

// Info for connected wallet (auto-detects veSCA)
const info = await query.getLoyaltyProgramInfos();
// {
//   pendingReward: 12.5,       // pending SCA reward (decimal)
//   totalPoolReward: 100000,   // total SCA in reward pool
//   isClaimEnabled: true,      // whether claiming is currently open
// }

// Info for a specific veSCA key
const info = await query.getLoyaltyProgramInfos('0x...');
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `veScaKey` | `string \| SuiObjectData` | (optional) VeScaKey ID or object; defaults to first veSCA found |

**Returns:**
```typescript
{
  pendingReward: number;     // pending SCA reward (9 decimals shifted)
  totalPoolReward: number;   // total SCA in the reward pool
  isClaimEnabled: boolean;   // whether claims are open
} | null
```

---

### Get veSCA Loyalty Program Info

Returns the veSCA reward pool state and the user's pending veSCA reward.

```typescript
const info = await query.getVeScaLoyaltyProgramInfos();
// {
//   pendingVeScaReward: 5.2,    // pending veSCA reward amount
//   pendingScaReward: 10.5,     // underlying SCA to be locked in new veSCA
//   totalPoolReward: 50000,     // total veSCA balance in reward pool
//   isClaimEnabled: true,
// }

// For a specific veSCA key
const info = await query.getVeScaLoyaltyProgramInfos('0x...');
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `veScaKey` | `string \| SuiObjectData` | (optional) VeScaKey ID or object |

**Returns:**
```typescript
{
  pendingVeScaReward: number;  // veSCA voting power of the pending reward
  pendingScaReward: number;    // underlying SCA locked in the reward position
  totalPoolReward: number;     // total veSCA in the reward pool
  isClaimEnabled: boolean;
} | null
```

---

## Full Example: Check and Claim Both Rewards

```typescript
import { Scallop } from '@scallop-io/sui-scallop-sdk';

const sdk = new Scallop({
  addressId: '67c44a103fe1b8c454eb9699',
  networkType: 'mainnet',
  secretKey: process.env.SECRET_KEY,
});

const query = await sdk.createScallopQuery();

// Check pending rewards
const scaRewards    = await query.getLoyaltyProgramInfos();
const veScaRewards  = await query.getVeScaLoyaltyProgramInfos();

console.log('Pending SCA reward:', scaRewards?.pendingReward);
console.log('Pending veSCA reward:', veScaRewards?.pendingVeScaReward);
console.log('SCA claims enabled:', scaRewards?.isClaimEnabled);
console.log('veSCA claims enabled:', veScaRewards?.isClaimEnabled);

// Claim both in one transaction
if (scaRewards?.isClaimEnabled || veScaRewards?.isClaimEnabled) {
  const builder = await sdk.createScallopBuilder();
  const txBlock = builder.createTxBlock();
  txBlock.setSender(myAddress);

  if (scaRewards?.isClaimEnabled && (scaRewards.pendingReward ?? 0) > 0) {
    await txBlock.claimLoyaltyRevenueQuick();
  }

  if (veScaRewards?.isClaimEnabled && (veScaRewards.pendingVeScaReward ?? 0) > 0) {
    await txBlock.claimVeScaLoyaltyRewardQuick();
  }

  await builder.signAndSendTxBlock(txBlock);
}
```
