# Scallop

The `Scallop` class is the main entry point of the SDK. It initializes all sub-instances (`ScallopClient`, `ScallopBuilder`, `ScallopQuery`, `ScallopUtils`, `ScallopConstants`, `ScallopIndexer`) from a single set of parameters.

## Installation

```bash
pnpm install @scallop-io/sui-scallop-sdk
```

## Quick Start

```typescript
import { Scallop } from '@scallop-io/sui-scallop-sdk';

const sdk = new Scallop({
  networkType: 'mainnet',
  secretKey: process.env.SECRET_KEY,
});

// Initialize and get sub-instances
const client = await sdk.createScallopClient();
const builder = await sdk.createScallopBuilder();
const query = await sdk.createScallopQuery();
const utils = await sdk.createScallopUtils();
const indexer = await sdk.createScallopIndexer();
const constants = await sdk.getScallopConstants();
```

Alternatively, call `init()` once and access all instances through `sdk.client`:

```typescript
await sdk.init();

const { client } = sdk;
const { builder, query, utils, constants } = client;
const { indexer } = query;
```

## Constructor Parameters

```typescript
new Scallop(params?: ScallopParams)
```

| Parameter               | Type                | Default                      | Description                                                                                                 |
| ----------------------- | ------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `networkType`           | `'mainnet'`         | `'mainnet'`                  | Network to connect to. Only `mainnet` is currently supported.                                               |
| `secretKey`             | `string`            | —                            | Base64-encoded private key for signing transactions. Required for write operations.                         |
| `walletAddress`         | `string`            | derived from `secretKey`     | Override the wallet address. Useful for read-only usage without a private key.                              |
| `fullnodeUrls`          | `string[]`          | Sui public RPC               | Custom RPC endpoints.                                                                                       |
| `addressId`             | `string`            | `'695fcdc084f790c04eb068dc'` | Scallop API ID used to fetch contract addresses. The default value points to the latest mainnet deployment. |
| `queryClientConfig`     | `QueryClientConfig` | see below                    | TanStack Query cache configuration.                                                                         |
| `usePythPullModel`      | `boolean`           | `true`                       | Whether to use Pyth pull oracle model when building transactions.                                           |
| `sponsoredFeeds`        | `string[]`          | `[]`                         | Pyth price feed IDs that are sponsored (no fee).                                                            |
| `useOnChainXOracleList` | `boolean`           | `true`                       | Whether to fetch the oracle whitelist from on-chain.                                                        |
| `indexerApiUrl`         | `string`            | Scallop API base URL         | Override the Scallop Indexer API endpoint.                                                                  |

### Default Cache Options

```typescript
queryClientConfig: {
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10,  // 10 seconds
      gcTime: 1000 * 30,     // 30 seconds
    },
  },
}
```

Override for long-running processes where data should stay fresh longer:

```typescript
const sdk = new Scallop({
  secretKey: process.env.SECRET_KEY,
  queryClientConfig: {
    defaultOptions: {
      queries: {
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  },
});
```

## Methods

### `init(force?)`

Fetches contract addresses and initializes all internal state. Called automatically by all `create*` / `get*` methods, so you only need to call this directly if you want explicit control over initialization timing.

```typescript
await sdk.init(); // Initialize once
await sdk.init(true); // Force re-initialization (refresh addresses)
```

### `createScallopClient()`

Returns an initialized [`ScallopClient`](./client.md) instance for executing transactions.

```typescript
const client = await sdk.createScallopClient();
await client.deposit('sui', 1_000_000_000);
```

### `createScallopBuilder()`

Returns an initialized [`ScallopBuilder`](./builder/index.md) for composing custom transactions.

```typescript
const builder = await sdk.createScallopBuilder();
const txBlock = builder.createTxBlock();
// compose multiple operations into one transaction...
```

### `createScallopQuery()`

Returns an initialized [`ScallopQuery`](./query.md) instance for reading on-chain data.

```typescript
const query = await sdk.createScallopQuery();
const market = await query.queryMarket();
```

### `createScallopUtils()`

Returns an initialized [`ScallopUtils`](./utils.md) instance for helper functions.

```typescript
const utils = await sdk.createScallopUtils();
const coinName = utils.parseCoinNameFromType('0x2::sui::SUI');
```

### `createScallopIndexer()`

Returns an initialized [`ScallopIndexer`](./indexer.md) for querying aggregated API data.

```typescript
const indexer = await sdk.createScallopIndexer();
const marketData = await indexer.getMarket();
```

### `getScallopConstants()`

Returns an initialized [`ScallopConstants`](./constants.md) instance for accessing contract addresses and pool metadata.

```typescript
const constants = await sdk.getScallopConstants();
const protocolId = constants.protocolObjectId;
```

## Read-Only Usage

To query on-chain data without a private key, provide a `walletAddress`:

```typescript
const sdk = new Scallop({
  walletAddress: '0xYourWalletAddress',
});

const query = await sdk.createScallopQuery();
const portfolio = await query.getUserPortfolio();
```

## Instance Hierarchy

After initialization, all sub-instances are accessible through `sdk.client`:

```
sdk.client                    → ScallopClient
sdk.client.builder            → ScallopBuilder
sdk.client.query              → ScallopQuery
sdk.client.utils              → ScallopUtils
sdk.client.constants          → ScallopConstants
sdk.client.query.indexer      → ScallopIndexer
```
