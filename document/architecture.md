# Scallop SDK Architecture Overview

This document explains the SDK's module structure and helps you decide which module to use for your integration.

## Module Hierarchy

```
Scallop (entry point)
└── ScallopClient          ← high-level, ready-to-use operations
    ├── ScallopBuilder      ← compose custom transaction blocks
    │   └── ScallopQuery    ← read on-chain data
    │       ├── ScallopUtils    ← coin parsing, address helpers
    │       ├── ScallopConstants / ScallopAddress  ← contract addresses
    │       └── ScallopIndexer  ← cached data via Scallop API
    └── (re-exports query, utils, constants via getters)
```

## What Each Module Does

| Module | Purpose |
|--------|---------|
| `Scallop` | Entry point — initializes everything, returns other instances |
| `ScallopClient` | One-call operations: deposit, borrow, repay, stake, claim |
| `ScallopBuilder` | Compose multi-step transactions; attach oracle price feeds |
| `ScallopQuery` | Read on-chain state: market pools, obligations, portfolios |
| `ScallopUtils` | Parse coin types, select coins, format amounts |
| `ScallopConstants` | Lookup contract addresses (inherits ScallopAddress) |
| `ScallopIndexer` | Fetch pre-aggregated data from Scallop API (fewer RPC calls) |

## Initialization

All modules share a single initialization call. The recommended pattern is to start from `Scallop`:

```typescript
import { Scallop } from '@scallop-io/sui-scallop-sdk';

const sdk = new Scallop({
  addressId: '67c44a103fe1b8c454eb9699', // mainnet address set
  networkType: 'mainnet',
  secretKey: process.env.SECRET_KEY,
});

// Option A: init once, access via client
await sdk.init();
const { query, builder, constants } = sdk.client;
const { indexer } = query;

// Option B: create individual instances (each calls init internally)
const client  = await sdk.createScallopClient();
const query   = await sdk.createScallopQuery();
const builder = await sdk.createScallopBuilder();
const indexer = await sdk.createScallopIndexer();
const utils   = await sdk.createScallopUtils();
```

> **Note:** Only mainnet is supported. Using `testnet` will throw errors due to missing package IDs.

## When to Use Each Module

### Use `ScallopClient` when you want simple, one-line operations

Client methods handle coin selection, obligation lookup, and transaction signing automatically.

```typescript
// Deposit 1 SUI
await client.deposit('sui', 1e9);

// Borrow USDC against collateral
const obligations = await client.getObligations();
await client.borrow('usdc', 100e6, true, obligations[0].id, obligations[0].keyId);
```

**Use Client for:** deposit, withdraw, borrow, repay, flash loan, spool stake/unstake/claim, sCoin migration.

### Use `ScallopBuilder` when you need custom transaction combinations

Builder lets you compose multiple operations into a single transaction block. You are responsible for coin arguments and object references.

```typescript
const builder = await sdk.createScallopBuilder();
const txBlock = builder.createTxBlock();
txBlock.setSender(myAddress);

// Compose: deposit collateral + borrow in one tx
await txBlock.depositCollateralQuick(1e9, 'sui');
await txBlock.borrowQuick(100e6, 'usdc');

await builder.signAndSendTxBlock(txBlock);
```

**Use Builder for:** combining multiple operations, custom transaction logic, DeFi integrations that need atomic transactions.

### Use `ScallopQuery` when you need on-chain data

Query fetches live data directly from Sui RPC nodes. Use it when you need the latest state.

```typescript
const query = await sdk.createScallopQuery();
const market = await query.queryMarket();
const portfolio = await query.getUserPortfolio();
```

**Use Query for:** reading market state, user positions, pool APYs, oracle prices.

### Use `ScallopIndexer` when you need aggregated data efficiently

Indexer fetches pre-processed data from Scallop's API, avoiding expensive multi-object RPC calls. Use it for dashboards and read-heavy applications.

```typescript
const indexer = await sdk.createScallopIndexer();
const market = await indexer.getMarket();       // pools + collaterals in one call
const tvl    = await indexer.getTotalValueLocked();
```

**Use Indexer for:** market overview dashboards, TVL display, pool listings. Not suitable for user-specific data (obligations, portfolios).

## Decision Tree

```
Do you need to submit a transaction?
├── Yes
│   ├── Simple single operation (deposit/borrow/repay/stake)?
│   │   └── → ScallopClient
│   └── Custom multi-step or atomic transaction?
│       └── → ScallopBuilder
└── No (read-only)
    ├── Need user-specific data (obligations, portfolio)?
    │   └── → ScallopQuery
    └── Need market-level aggregated data (TVL, pool rates)?
        ├── Real-time RPC data needed?
        │   └── → ScallopQuery
        └── Efficiency / fewer RPC calls preferred?
            └── → ScallopIndexer
```

## Module Reference

- [ScallopClient](./client.md) — high-level operations
- [ScallopBuilder](./builder.md) — transaction block composition
- [ScallopQuery](./query.md) — on-chain data queries
- [ScallopIndexer](./indexer.md) — API-cached data
- [ScallopConstants / ScallopAddress](./constants.md) — address management
- [ScallopUtils](./utils.md) — utility helpers
- [veSCA](./vesca.md) — governance token locking
- [sCoin](./scoin.md) — new market coin package
- [Borrow Incentive](./borrow-incentive.md) — earn rewards by borrowing
