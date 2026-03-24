# Use Scallop Indexer

`ScallopIndexer` fetches pre-aggregated market data from Scallop's API, reducing the number of RPC calls compared to querying on-chain state directly.

## When to Use Indexer vs Query

| | `ScallopIndexer` | `ScallopQuery` |
|---|---|---|
| Data source | Scallop API (cached) | Sui RPC (live) |
| RPC requests | Minimal (1 HTTP call) | Multiple object fetches |
| Freshness | Near real-time (API cache) | Latest block |
| User-specific data | No | Yes |
| Best for | Dashboards, pool listings, TVL | User portfolios, obligations |

Use **Indexer** when you need market-level data efficiently. Use **Query** when you need real-time accuracy or user-specific data.

## Initialization

```typescript
import { Scallop } from '@scallop-io/sui-scallop-sdk';

const sdk = new Scallop({
  addressId: '67c44a103fe1b8c454eb9699',
  networkType: 'mainnet',
});

const indexer = await sdk.createScallopIndexer();

// Or access from query instance
await sdk.init();
const { indexer } = sdk.client.query;
```

## Methods

### `getMarket()`

Returns all market pools and collaterals in a single call.

```typescript
const market = await indexer.getMarket();
// market.pools       — Record<coinName, MarketPool>
// market.collaterals — Record<coinName, MarketCollateral>
```

**Returns:** `{ pools: MarketPools, collaterals: MarketCollaterals }`

---

### `getMarketPools()`

Returns all market lending pools, keyed by coin name.

```typescript
const marketPools = await indexer.getMarketPools();
// {
//   sui:  { coinName: 'sui', supplyApy: 0.03, borrowApy: 0.05, ... },
//   usdc: { coinName: 'usdc', ... },
//   ...
// }
```

**Returns:** `Record<string, MarketPool>`

---

### `getMarketPool(poolCoinName)`

Returns data for a single lending pool.

```typescript
const suiPool = await indexer.getMarketPool('sui');
// {
//   coinName: 'sui',
//   coinType: '0x2::sui::SUI',
//   coinPrice: 1.23,
//   supplyApy: 0.031,
//   borrowApy: 0.052,
//   supplyAmount: 1000000,
//   borrowAmount: 400000,
//   conversionRate: 1.0012,  // market coin to underlying ratio
//   ...
// }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `poolCoinName` | `string` | Coin name, e.g. `'sui'`, `'usdc'`, `'wbtc'` |

**Returns:** `MarketPool`

---

### `getMarketCollaterals()`

Returns all collateral configurations, keyed by coin name.

```typescript
const collaterals = await indexer.getMarketCollaterals();
// {
//   sui:  { coinName: 'sui', collateralFactor: 0.7, ... },
//   ...
// }
```

**Returns:** `Record<string, MarketCollateral>`

---

### `getMarketCollateral(collateralCoinName)`

Returns collateral data for a single coin.

```typescript
const suiCollateral = await indexer.getMarketCollateral('sui');
// {
//   coinName: 'sui',
//   collateralFactor: 0.7,
//   liquidationFactor: 0.8,
//   liquidationDiscount: 0.05,
//   ...
// }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `collateralCoinName` | `string` | Coin name, e.g. `'sui'`, `'usdc'` |

**Returns:** `MarketCollateral`

---

### `getSpools()`

Returns all spool (supply-side staking) pools, keyed by market coin name.

```typescript
const spools = await indexer.getSpools();
// {
//   ssui:  { marketCoinName: 'ssui', rewardApy: 0.12, ... },
//   swusdc: { ... },
//   ...
// }
```

**Returns:** `Record<string, Spool>`

---

### `getSpool(marketCoinName)`

Returns data for a single spool.

```typescript
const spool = await indexer.getSpool('ssui');
// {
//   marketCoinName: 'ssui',
//   coinName: 'sui',
//   rewardCoinName: 'sca',
//   rewardApy: 0.12,
//   stakedAmount: 5000000,
//   ...
// }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `marketCoinName` | `string` | Market coin name, e.g. `'ssui'`, `'swusdc'` |

**Returns:** `Spool`

---

### `getBorrowIncentivePools()`

Returns all borrow incentive pools, keyed by coin name.

Borrow incentive pools reward users for borrowing specific assets. The `points` field contains per-reward-coin breakdowns.

```typescript
const biPools = await indexer.getBorrowIncentivePools();
// {
//   sui: {
//     coinName: 'sui',
//     stakedAmount: 300000,
//     points: {
//       sca: { coinName: 'sca', rewardApy: 0.08, ... }
//     }
//   },
//   ...
// }
```

**Returns:** `Record<string, BorrowIncentivePool>`

---

### `getBorrowIncentivePool(borrowIncentiveCoinName)`

Returns data for a single borrow incentive pool.

```typescript
const biPool = await indexer.getBorrowIncentivePool('sui');
// {
//   coinName: 'sui',
//   stakedAmount: 300000,
//   points: {
//     sca: {
//       coinName: 'sca',
//       distributedPoint: 1000000,
//       weightedAmount: 500000,
//       rewardApy: 0.08,
//       ...
//     }
//   }
// }
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `borrowIncentiveCoinName` | `string` | Coin name, e.g. `'sui'`, `'usdc'` |

**Returns:** `BorrowIncentivePool`

---

### `getTotalValueLocked()`

Returns overall protocol TVL and recent change ratios.

```typescript
const tvl = await indexer.getTotalValueLocked();
// {
//   totalValue: 250000000,
//   borrowValue: 80000000,
//   supplyValue: 170000000,
//   totalValueChangeRatio: 0.02,    // 24h change
//   borrowValueChangeRatio: 0.015,
//   supplyValueChangeRatio: 0.025,
// }
```

**Returns:** `TotalValueLocked & { totalValueChangeRatio, borrowValueChangeRatio, supplyValueChangeRatio }`

---

### `getCoinPrice(poolCoinName)`

Returns the USD price of a single coin from the market pool data.

```typescript
const suiPrice = await indexer.getCoinPrice('sui'); // e.g. 1.23
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `poolCoinName` | `string` | Coin name, e.g. `'sui'`, `'usdc'` |

**Returns:** `number` (USD price, or `0` if not found)

---

### `getCoinPrices()`

Returns USD prices for all coins in the market.

```typescript
const prices = await indexer.getCoinPrices();
// { sui: 1.23, usdc: 1.0, wbtc: 65000, ... }
```

**Returns:** `Record<string, number>`

---

## Full Example

```typescript
import { Scallop } from '@scallop-io/sui-scallop-sdk';

const sdk = new Scallop({
  addressId: '67c44a103fe1b8c454eb9699',
  networkType: 'mainnet',
});

const indexer = await sdk.createScallopIndexer();

// Get all market data in one call
const market      = await indexer.getMarket();
const marketPools = market.pools;
const collaterals = market.collaterals;

// Individual pool lookup
const suiPool = await indexer.getMarketPool('sui');
console.log('SUI supply APY:', suiPool.supplyApy);

// Spools (supply-side rewards)
const spools  = await indexer.getSpools();
const ssuiPool = await indexer.getSpool('ssui');

// Borrow incentives
const biPools = await indexer.getBorrowIncentivePools();
const suiBi   = await indexer.getBorrowIncentivePool('sui');

// TVL and prices
const tvl    = await indexer.getTotalValueLocked();
const prices = await indexer.getCoinPrices();
console.log('Protocol TVL:', tvl.totalValue);
```
