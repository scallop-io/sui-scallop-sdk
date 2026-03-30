# ScallopQuery

`ScallopQuery` provides read-only access to all on-chain Scallop data: markets, obligations, spools, veSCA, portfolios, and prices.

## Setup

```typescript
import { Scallop } from '@scallop-io/sui-scallop-sdk';

const sdk = new Scallop({ walletAddress: '0x...' });
const query = await sdk.createScallopQuery();
```

## Indexer Fallback

Many query methods accept an optional `indexer` argument. When enabled, the method fetches from the Scallop Indexer API (faster and cheaper) instead of querying the chain directly.

By default, methods that support the indexer **automatically use it with a fallback to on-chain** if the indexer request fails.

```typescript
// Use indexer (default behavior for supported methods)
const pools = await query.getMarketPools();

// Force on-chain query
const pools = await query.getMarketPools(undefined, { indexer: false });

// Explicitly request indexer
const pools = await query.getMarketPools(undefined, { indexer: true });
```

Methods that support the `indexer` option are marked with **[indexer]** below.

---

## Core Queries

### Market Pools **[indexer]**

```typescript
// All market pools (default: all whitelisted coins)
const pools = await query.getMarketPools();

// Specific coins only
const pools = await query.getMarketPools(['sui', 'usdc']);

// Single pool
const suiPool = await query.getMarketPool('sui');
```

> `queryMarket()` is deprecated. Use `getMarketPools()` instead.

### Market Collaterals **[indexer]**

```typescript
// All collaterals
const collaterals = await query.getMarketCollaterals();

// Specific coins
const collaterals = await query.getMarketCollaterals(['sui', 'usdc']);

// Single collateral
const suiCollateral = await query.getMarketCollateral('sui');
```

### Obligations

```typescript
// All obligation accounts for the connected wallet
const obligations = await query.getObligations();

// Obligation details by ID
const detail = await query.queryObligation(obligations[0].id);
```

### Wallet Balances

```typescript
// All asset coin amounts for the connected wallet
const amounts = await query.getCoinAmounts();
const suiAmount = await query.getCoinAmount('sui');

// Market coin (sCoin wrapper) amounts
const marketAmounts = await query.getMarketCoinAmounts();
const ssuiAmount = await query.getMarketCoinAmount('ssui');
```

### Prices

```typescript
// Pyth oracle price
const suiPrice = await query.getPriceFromPyth('sui');
const prices = await query.getPricesFromPyth(['sui', 'usdc']); // Record<string, number>

// All coin prices (including sCoin), indexer-backed by default
const allPrices = await query.getAllCoinPrices();

// Indexer price endpoints
const suiIndexerPrice = await query.getCoinPriceByIndexer('sui');
const allIndexerPrices = await query.getCoinPricesByIndexer();
```

---

## Spool Queries

### Spools **[indexer]**

```typescript
// All spools
const spools = await query.getSpools();

// Specific spools
const spools = await query.getSpools(['ssui', 'susdc']);

// Single spool
const ssuiSpool = await query.getSpool('ssui');
```

> `getStakePools()` and `getStakeRewardPools()` are legacy methods. Use `getSpools()` / `getSpool()` instead.

### Stake Accounts

```typescript
// All stake accounts across all spools
const all = await query.getAllStakeAccounts();

// Stake accounts for a specific spool
const ssuiAccounts = await query.getStakeAccounts('ssui');
```

### Legacy Stake Objects

These are lower-level methods retained for backward compatibility.

```typescript
const stakePool = await query.getStakePool('ssui');
const rewardPool = await query.getStakeRewardPool('ssui');
const stakePools = await query.getStakePools(['ssui', 'susdc']);
const rewardPools = await query.getStakeRewardPools(['ssui', 'susdc']);
```

---

## Borrow Incentive Queries

### Incentive Pools **[indexer]**

```typescript
// All borrow incentive pools
const pools = await query.getBorrowIncentivePools();
```

### Incentive Accounts

Returns incentive reward details for a specific obligation.

```typescript
const accounts = await query.getBorrowIncentiveAccounts('0x<obligationId>');
```

---

## Lending & Portfolio Queries

### User Lending Info **[indexer]**

Returns supplied amounts, supply APR, and spool staking status for a wallet.

```typescript
// All lending pools for connected wallet
const lendings = await query.getLendings();

// Specific pools
const lendings = await query.getLendings(['sui', 'usdc']);

// Single pool
const suiLending = await query.getLending('sui');
```

### Obligation Accounts **[indexer]**

Full collateral and borrow breakdown per obligation.

```typescript
// All obligation accounts for connected wallet
const accounts = await query.getObligationAccounts();

// By specific obligation IDs
const accounts = await query.getObligationAccountsByIds(['0x<id1>', '0x<id2>']);

// Single obligation by ID (includes owner lookup)
const account = await query.getObligationAccountById('0x<id>');

// Single obligation (searches within wallet's obligations)
const account = await query.getObligationAccount('0x<id>');
```

### TVL **[indexer]**

```typescript
const tvl = await query.getTvl();
// { totalSupplyValue: number, totalBorrowValue: number }
```

### User Portfolio **[indexer]**

Aggregated view: lending, borrowing, collateral, and spool positions.

```typescript
// Connected wallet
const portfolio = await query.getUserPortfolio();

// Specific wallet
const portfolio = await query.getUserPortfolio({ walletAddress: '0x...' });
```

---

## veSCA Queries

### Get veSCA

```typescript
// Single veSCA by key object ID
const vesca = await query.getVeSca('0x<veScaKey>');

// All veSCAs for connected wallet
const vescas = await query.getVeScas();

// Include empty veSCAs (locked SCA already unlocked)
const all = await query.getVeScas({ excludeEmpty: false });

// For a specific wallet
const vescas = await query.getVeScas({ walletAddress: '0x...' });
```

### veSCA Treasury

```typescript
const treasury = await query.getVeScaTreasuryInfo();
```

### veSCA ↔ Obligation Bindings

```typescript
// Get bound obligation from a veSCA key
const binding = await query.getBindedObligation('0x<veScaKey>');
// Returns: { obligationId: string; obligationKey: string } | null

// Get bound veSCA key from an obligation
const veScaKey = await query.getBindedVeScaKey('0x<obligationId>');
// Returns: string | null
```

### Referral Bindings

```typescript
// Get the referrer's veSCA key for a given wallet
const referrerKey = await query.getVeScaKeyIdFromReferralBindings('0x<referee>');
// Returns: string | null
```

### Loyalty Program

```typescript
// All loyalty program tiers info
const infos = await query.getLoyaltyProgramInfos();

// veSCA-gated loyalty rewards
const rewardInfos = await query.getVeScaLoyaltyProgramInfos();
```

---

## sCoin Queries

```typescript
// Total supply of a specific sCoin
const totalSupply = await query.getSCoinTotalSupply('ssui');

// sCoin balances for connected wallet
const amounts = await query.getSCoinAmounts();
const amounts = await query.getSCoinAmounts(['ssui', 'susdc']);
const ssuiAmount = await query.getSCoinAmount('ssui');

// Exchange rate between two sCoins
const rate = await query.getSCoinSwapRate('ssui', 'susdc');
```

---

## Limits & Isolation

```typescript
// Supply and borrow limits for a pool
const supplyLimit = await query.getPoolSupplyLimit('sui');
const borrowLimit = await query.getPoolBorrowLimit('sui');

// Isolated assets list (indexer-backed by default)
const isolatedAssets = await query.getIsolatedAssets();

// Force on-chain query
const isolatedAssets = await query.getIsolatedAssets(true);

// Check if a specific asset is isolated
const isIsolated = await query.isIsolatedAsset('deep');
```

---

## Oracle & Protocol Queries

```typescript
// Flash loan fees for all lending pools
const fees = await query.getFlashLoanFees();

// xOracle price update policy objects
const policies = await query.getPriceUpdatePolicies();
// { primary: SuiObjectResponse | null, secondary: SuiObjectResponse | null }

// Supported oracles per asset
const oracles = await query.getAssetOracles();
// { sui: { primary: ['pyth'], secondary: ['supra'] }, ... }

// Switchboard on-demand aggregator object IDs
const aggIds = await query.getSwitchboardOnDemandAggregatorObjectIds(['sui']);

// All pool contract addresses (from API)
const poolAddresses = await query.getPoolAddresses();
```
