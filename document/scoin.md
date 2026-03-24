# sCoin — New Market Coin Package

sCoin is Scallop's updated representation of supply positions. When you deposit an asset into the lending pool, you receive an sCoin representing your share of the pool.

## sCoin vs Market Coin

| | Market Coin (legacy) | sCoin (current) |
|---|---|---|
| Example name | `ssui`, `swusdc` | `sSUI`, `sUSDC` |
| Package | old market coin package | `scoin.id` package |
| Status | Deprecated (still functional) | Active, preferred |
| Migration | → use `migrateAllMarketCoin` | — |

Both exist simultaneously during the transition period. sCoin is the recommended format for all new integrations.

## Relationship to Lending

1. User deposits SUI → receives market coin (`ssui`) or sCoin (`sSUI`)
2. sCoin is the new wrapper over market coin, convertible 1:1 at the current exchange rate
3. The `conversionRate` in the market pool data converts between sCoin/market coin and the underlying asset

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

Low-level methods for composing sCoin operations inside a transaction block.

#### `mintSCoin(marketCoinName, marketCoin)`

Convert a market coin into the equivalent sCoin.

```typescript
// marketCoinName: the market coin name, e.g. 'ssui', 'swusdc'
// marketCoin: the market coin object from transaction results
const sCoin = txBlock.mintSCoin('ssui', marketCoinObject);
txBlock.transferObjects([sCoin], sender);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `marketCoinName` | `string` | Market coin name, e.g. `'ssui'`, `'swusdc'` |
| `marketCoin` | `TransactionObjectArgument` | Market coin object |

**Returns:** `TransactionResult` (the new sCoin object)

---

#### `burnSCoin(sCoinName, sCoin)`

Convert an sCoin back into the equivalent market coin.

```typescript
const marketCoin = txBlock.burnSCoin('ssui', sCoinObject);
txBlock.transferObjects([marketCoin], sender);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `sCoinName` | `string` | sCoin name, e.g. `'ssui'`, `'swusdc'` |
| `sCoin` | `TransactionObjectArgument` | sCoin object |

**Returns:** `TransactionResult` (the market coin object)

---

### Quick Methods

Quick methods handle coin selection automatically. They are async.

#### `mintSCoinQuick(marketCoinName, amount)`

Select market coins from the wallet and convert to sCoin.

```typescript
// Convert 100 ssui market coins to sSUI sCoin
const sCoin = await txBlock.mintSCoinQuick('ssui', 100e9);
txBlock.transferObjects([sCoin], sender);

await builder.signAndSendTxBlock(txBlock);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `marketCoinName` | `string` | Market coin name, e.g. `'ssui'` |
| `amount` | `number` | Amount in base units |

**Returns:** `TransactionResult` (the sCoin)

---

#### `burnSCoinQuick(sCoinName, amount)`

Select sCoins from the wallet and convert back to market coin.

```typescript
const marketCoin = await txBlock.burnSCoinQuick('ssui', 100e9);
txBlock.transferObjects([marketCoin], sender);

await builder.signAndSendTxBlock(txBlock);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `sCoinName` | `string` | sCoin name, e.g. `'ssui'` |
| `amount` | `number` | Amount in base units |

**Returns:** `TransactionResult` (the market coin)

---

## Migrate Old Market Coins

If users have old market coins (before the sCoin package upgrade), use `client.migrateAllMarketCoin()` to convert all of them at once. This handles coins in the wallet and staked inside spools.

```typescript
const client = await sdk.createScallopClient();

// Execute migration immediately
await client.migrateAllMarketCoin();

// Or get the transaction block for manual signing
const txBlock = await client.migrateAllMarketCoin(false);
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `walletAddress` | `string` | connected wallet | Address to migrate |
| `sign` | `boolean` | `true` | If `false`, returns the txBlock instead of executing |

---

## Query Methods

### Get sCoin Balance

```typescript
const query = await sdk.createScallopQuery();

// Balance of a single sCoin
const amount = await query.getSCoinAmount('ssui');
// or for a specific address
const amount = await query.getSCoinAmount('ssui', '0x...');
```

**Returns:** `number` (balance in base units)

---

### Get All sCoin Balances

```typescript
const balances = await query.getSCoinAmounts();
// {
//   ssui: 50000000000,
//   swusdc: 100000000,
//   ...
// }

// For specific coins only
const balances = await query.getSCoinAmounts(['ssui', 'swusdc']);
```

**Returns:** `Record<string, number>`

---

### Get sCoin Total Supply

```typescript
const totalSupply = await query.getSCoinTotalSupply('ssui');
// e.g. 10000000000000 (total sSUI in circulation)
```

**Returns:** `number`

---

### Get sCoin Swap Rate

Calculate the exchange rate between two sCoins (useful for DeFi integrations).

```typescript
// Rate of sSUI → sUSDC (how much sUSDC you get per sSUI)
const rate = await query.getSCoinSwapRate('ssui', 'swusdc');
// e.g. 1.23 (1 sSUI = 1.23 sUSDC worth of supply position)

// Optionally provide the current SUI/USDC price to avoid an extra RPC call
const rate = await query.getSCoinSwapRate('ssui', 'swusdc', 1.25);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `fromSCoin` | `string` | Source sCoin name |
| `toSCoin` | `string` | Destination sCoin name |
| `underlyingCoinPrice` | `number` | (optional) Pre-fetched price of `fromCoin` in terms of `toCoin` |

**Returns:** `number` (swap rate)

---

## Supported sCoin Names

The supported sCoin names correspond to the lending pool whitelist. Common examples:

| sCoin Name | Underlying Asset |
|-----------|-----------------|
| `ssui` | SUI |
| `swusdc` | Wormhole USDC |
| `swusdt` | Wormhole USDT |
| `sweth` | Wormhole ETH |
| `sbtc` | Bitcoin |
| `ssca` | SCA |

Check `scallopConstants.whitelist.scoin` for the complete list at runtime:

```typescript
const constants = await sdk.getScallopConstants();
const supportedSCoins = [...constants.whitelist.scoin];
```

## Full Example

```typescript
import { Scallop } from '@scallop-io/sui-scallop-sdk';

const sdk = new Scallop({
  addressId: '67c44a103fe1b8c454eb9699',
  networkType: 'mainnet',
  secretKey: process.env.SECRET_KEY,
});

// Check balances
const query = await sdk.createScallopQuery();
const balances = await query.getSCoinAmounts();
console.log('sCoin balances:', balances);

// Convert market coin to sCoin
const builder = await sdk.createScallopBuilder();
const txBlock = builder.createTxBlock();
txBlock.setSender(myAddress);

const sCoin = await txBlock.mintSCoinQuick('ssui', 10e9);
txBlock.transferObjects([sCoin], myAddress);

await builder.signAndSendTxBlock(txBlock);
```
