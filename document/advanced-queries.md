# Advanced Queries

This document covers the smaller, specialized query modules available via `ScallopQuery`. These are typically used for risk management, protocol configuration inspection, or oracle monitoring.

All methods below are called on the `query` instance:

```typescript
const query = await sdk.createScallopQuery();
```

---

## Pool Limits

### `getPoolBorrowLimit(poolName)`

Returns the maximum total borrow allowed for a pool (raw value including decimals).

```typescript
const borrowLimit = await query.getPoolBorrowLimit('sui');
// e.g. '5000000000000' (5000 SUI in base units)
// Returns '0' if no limit is set, null if pool not found
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `poolName` | `string` | Pool coin name, e.g. `'sui'`, `'usdc'` |

**Returns:** `string | null`

---

### `getPoolSupplyLimit(poolName)`

Returns the maximum total supply allowed for a pool (raw value including decimals).

```typescript
const supplyLimit = await query.getPoolSupplyLimit('usdc');
// e.g. '10000000000' (10000 USDC in base units, 6 decimals)
// Returns '0' if no limit is set, null if pool not found
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `poolName` | `string` | Pool coin name |

**Returns:** `string | null`

---

## Isolated Assets

Isolated assets can only be used as collateral alone — they cannot be combined with other collateral types in the same obligation.

### `getIsolatedAssets(useOnChainQuery?)`

Returns the list of coin names that are configured as isolated assets.

```typescript
// Fast: reads from pre-loaded pool address config (default)
const isolatedAssets = await query.getIsolatedAssets();
// e.g. ['deep', 'fdusd', ...]

// Slow: queries on-chain dynamic fields directly
const isolatedAssets = await query.getIsolatedAssets(true);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `useOnChainQuery` | `boolean` | `false` | If `true`, queries chain state instead of cached config |

**Returns:** `string[]` (coin names)

---

### `isIsolatedAsset(assetCoinName, useOnChainQuery?)`

Check whether a specific coin is configured as an isolated asset.

```typescript
const isIsolated = await query.isIsolatedAsset('deep');
// true or false

const isIsolated = await query.isIsolatedAsset('sui');
// false (SUI is not isolated)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `assetCoinName` | `string` | — | Coin name to check |
| `useOnChainQuery` | `boolean` | `false` | If `true`, queries chain state |

**Returns:** `boolean`

---

## Flash Loan Fees

### `getFlashLoanFees(assetCoinNames?)`

Returns the flash loan fee rate for each supported asset, expressed as a decimal (e.g. `0.001` = 0.1%).

```typescript
// Get fees for all lending assets
const fees = await query.getFlashLoanFees();
// {
//   sui: 0.001,
//   usdc: 0.001,
//   wbtc: 0.002,
//   ...
// }

// Get fees for specific assets only
const fees = await query.getFlashLoanFees(['sui', 'usdc']);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `assetCoinNames` | `string[]` | (optional) Filter to specific coins; defaults to all lending coins |

**Returns:** `Record<string, number>` — fee rate per coin (decimal)

---

## Oracle Configuration

### `getAssetOracles()`

Returns the supported oracle types for each pool asset, split into primary and secondary.

```typescript
const oracles = await query.getAssetOracles();
// {
//   sui: {
//     primary: ['pyth'],
//     secondary: ['switchboard', 'supra'],
//   },
//   usdc: {
//     primary: ['pyth'],
//     secondary: ['switchboard'],
//   },
//   ...
// }
```

**Returns:** `Record<string, { primary: SupportOracleType[], secondary: SupportOracleType[] }>`

Where `SupportOracleType` is `'pyth' | 'switchboard' | 'supra'`.

---

### `getPriceUpdatePolicies()`

Returns the raw price update policy objects for primary and secondary oracles. Used internally when constructing transactions that require price feeds.

```typescript
const { primary, secondary } = await query.getPriceUpdatePolicies();
```

**Returns:** `{ primary: SuiObjectResponse | null, secondary: SuiObjectResponse | null }`

---

### `getSwitchboardOnDemandAggregatorObjectIds(coinNames)`

Returns the Switchboard on-demand aggregator object IDs for the specified coins. Used internally when attaching Switchboard oracle price feeds to transactions.

```typescript
const aggIds = await query.getSwitchboardOnDemandAggregatorObjectIds(['sui', 'usdc']);
// ['0xabc...', '0xdef...']
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `coinNames` | `string[]` | Coin names to look up |

**Returns:** `string[]` (aggregator object IDs in the same order as input)

---

## Coin Prices

### `getCoinPriceByIndexer(poolName)`

Get the USD price of a single coin from the Scallop indexer (cached).

```typescript
const price = await query.getCoinPriceByIndexer('sui');
// e.g. 1.23
```

**Returns:** `number`

---

### `getCoinPricesByIndexer()`

Get USD prices for all market coins from the indexer.

```typescript
const prices = await query.getCoinPricesByIndexer();
// { sui: 1.23, usdc: 1.0, wbtc: 65000, ... }
```

**Returns:** `Record<string, number>`

---

### `getAllCoinPrices(args?)`

Get prices for all coins including sCoins. Supports indexer fallback.

```typescript
const prices = await query.getAllCoinPrices();
const prices = await query.getAllCoinPrices({ indexer: true });
```

**Returns:** `Record<string, number>`

---

## Pool Addresses

### `getPoolAddresses(apiAddressId?)`

Returns the full on-chain address configuration for all pools (lending pool, collateral pool, interest model, borrow dynamics, etc.). Useful for advanced integrations that need raw contract object IDs.

```typescript
const poolAddresses = await query.getPoolAddresses();
// {
//   sui: {
//     coinType: '0x2::sui::SUI',
//     lendingPoolId: '0x...',
//     collateralPoolId: '0x...',
//     ...
//   },
//   ...
// }
```

**Returns:** Full pool address map from the Scallop address API.

---

## User Portfolio

### `getUserPortfolio(args?)`

Returns a comprehensive summary of the user's position: supplied assets, borrowed assets, collateral, spool stakes, and health metrics.

```typescript
// Portfolio for connected wallet
const portfolio = await query.getUserPortfolio();

// Portfolio for a specific address
const portfolio = await query.getUserPortfolio({ walletAddress: '0x...' });

// Use indexer for faster loading
const portfolio = await query.getUserPortfolio({ indexer: true });
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `walletAddress` | `string` | (optional) Address; defaults to connected wallet |
| `indexer` | `boolean` | (optional) Use indexer data for market info |

---

## Pyth Prices

### `getPriceFromPyth(assetCoinName)`

Get a coin's price directly from the Pyth oracle fee object.

```typescript
const price = await query.getPriceFromPyth('sui');
```

**Returns:** `number` (USD price)

---

### `getPricesFromPyth(assetCoinNames)`

Get prices for multiple coins from Pyth in one call.

```typescript
const prices = await query.getPricesFromPyth(['sui', 'usdc', 'wbtc']);
// { sui: 1.23, usdc: 1.0, wbtc: 65000 }
```

**Returns:** `Record<string, number>`
