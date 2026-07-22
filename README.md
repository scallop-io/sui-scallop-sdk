<p align="center">
  <a href="https://app.scallop.io">
    <img alt="scallop" src="https://i.imgur.com/g7Y4MIj.png" width="250" />
  </a>
</p>
<p align="center">
  <a style="padding-right: 5px;" href="https://github.com/scallop-io/sui-scallop-sdk/releases">
    <img alt="GitHub release" src="https://img.shields.io/github/v/release/scallop-io/sui-scallop-sdk?display_name=tag">
  </a>
  <a href="https://github.com/scallop-io/sui-scallop-sdk/blob/main/LICENSE">
    <img alt="GitHub licence" src="https://img.shields.io/github/license/scallop-io/sui-scallop-sdk?logoColor=blue">
  </a>
</p>

# Scallop TypeScript SDK

TypeScript SDK for integrating with the Scallop lending protocol on Sui.

Current package: `@scallop-io/sui-scallop-sdk` v4.x. ESM package, Node `>=22`, peer dependency `@mysten/sui@^2.0.0`.

## Install

```bash
pnpm add @scallop-io/sui-scallop-sdk @mysten/sui
```

## Public Entry Points

Root export:

```ts
import {
  Scallop,
  ScallopClient,
  ScallopBuilder,
  ScallopQuery,
  ScallopUtils,
  ScallopConstants,
  ScallopAddress,
} from '@scallop-io/sui-scallop-sdk';
```

Subpath exports:

```ts
import { ScallopClient } from '@scallop-io/sui-scallop-sdk/client';
import { ScallopBuilder } from '@scallop-io/sui-scallop-sdk/builder';
import { ScallopQuery } from '@scallop-io/sui-scallop-sdk/query';
import type { ScallopTxBlock } from '@scallop-io/sui-scallop-sdk/types';
import { ScallopError } from '@scallop-io/sui-scallop-sdk/errors';
import { consoleLogger } from '@scallop-io/sui-scallop-sdk/logger';
```

Supported subpaths:

- `@scallop-io/sui-scallop-sdk`
- `@scallop-io/sui-scallop-sdk/client`
- `@scallop-io/sui-scallop-sdk/query`
- `@scallop-io/sui-scallop-sdk/builder`
- `@scallop-io/sui-scallop-sdk/errors`
- `@scallop-io/sui-scallop-sdk/logger`
- `@scallop-io/sui-scallop-sdk/types`

## Main Models

`Scallop` is the convenience factory. It owns one initialized `ScallopClient` and exposes factory methods for the other facades.

```text
Scallop
  -> ScallopClient        write facade; signs/sends user actions
      -> ScallopBuilder   tx-block builder; owns SuiKit + TransactionExecutor
          -> ScallopQuery read facade; delegates to repositories
              -> ScallopUtils
                  -> ScallopConstants
                      -> ScallopAddress
```

Important v4 details:

- `ScallopIndexer` model was removed. Query/indexer access is internal to repositories.
- `ScallopConstants` composes `ScallopAddress`; use `constants.address` for the address adapter.
- Back-compatible address forwarders remain on constants: `get`, `set`, `getAddresses`, `setAddresses`, `getId`, `getAllAddresses`, `switchCurrentAddresses`.
- Write-path signer/executor lives on `builder.executor`; raw SuiKit lives on `builder.suiKit`.

## Create SDK

Mainnet example:

```ts
import { Scallop } from '@scallop-io/sui-scallop-sdk';

const sdk = new Scallop({
  addressId: '695fcdc084f790c04eb068dc',
  network: 'mainnet',
  fullnodeUrl: 'https://fullnode.mainnet.sui.io:443',
  secretKey: process.env.SECRET_KEY,
  pythEndpoints: ['https://pyth.dourolabs.app/hermes'],
});

const client = await sdk.createScallopClient();
const query = await sdk.createScallopQuery();
const builder = await sdk.createScallopBuilder();
const utils = await sdk.createScallopUtils();
const constants = await sdk.getScallopConstants();
```

Read-only example:

```ts
const sdk = new Scallop({
  addressId: '695fcdc084f790c04eb068dc',
  network: 'mainnet',
  fullnodeUrl: 'https://fullnode.mainnet.sui.io:443',
  walletAddress: '0x...',
  pythEndpoints: ['https://pyth.dourolabs.app/hermes'],
});

const query = await sdk.createScallopQuery();
const pools = await query.getMarketPools();
```

Manual construction is supported. Call `.init()` before use:

```ts
import { ScallopQuery } from '@scallop-io/sui-scallop-sdk/query';

const query = new ScallopQuery({
  addressId: '695fcdc084f790c04eb068dc',
  network: 'mainnet',
  fullnodeUrl: 'https://fullnode.mainnet.sui.io:443',
  walletAddress: '0x...',
});

await query.init();
```

## Constructor Options

Common required options:

- `addressId`: Scallop API address config id.
- `network`: Sui network, usually `'mainnet'`.
- `fullnodeUrl`: Sui RPC URL.
- `walletAddress`: required for read-only/wallet-scoped queries when no signer is supplied.
- `secretKey` or `mnemonics`: required for signing via `ScallopClient`.

Common optional options:

- `readTransport`: on-chain read transport, `'grpc'` (default) or `'graphql'`. The Sui Core API is transport-agnostic, so every read works over either. `'graphql'` builds a `SuiGraphQLClient` against `graphqlUrl` (see below) and routes all repository reads through it; some heavy dynamic-field reads (e.g. pool addresses, xOracle, veSCA) additionally use single nested GraphQL queries instead of the gRPC multi-call fan-out, falling back to gRPC on failure. Ignored when an explicit `suiClient` is injected.
- `graphqlUrl` / `graphqlClient`: Sui GraphQL endpoint / preconfigured `SuiGraphQLClient`. Used both by the GraphQL read transport (`readTransport: 'graphql'`) and the GraphQL balance datasource. Default endpoint is mainnet; `graphqlClient` takes precedence over `graphqlUrl`. Note: injecting `graphqlClient` alone configures balances only — it does **not** flip the read transport; set `readTransport: 'graphql'` for that.
- `pythEndpoints`: Pyth Hermes endpoints for price-update flows. Default `https://pyth.dourolabs.app/hermes`.
- `pythApiKey`: Pyth (Hermes) API access token. The hosted Pyth endpoint now requires a key. When set, Pyth coin prices are read **directly from the Pyth API** (sent as the Hermes `accessToken`); when omitted, prices are read from the **Scallop indexer** instead. Either way, `getPythCoinPrice(s)` falls back to on-chain feed objects if the API source fails.
- `queryClient` / `queryClientConfig`: custom `@tanstack/query-core` cache.
- `priceTimeout`: cache lifetime (ms) for the full Pyth price-feed list. Default `5_000`. Within this window, single/subset price reads are served from one cached full-list fetch instead of re-hitting the Pyth API; a longer value cuts API traffic at the cost of price staleness.
- `logger`: SDK logger. Default is silent `noopLogger`; pass `consoleLogger` to opt into console output.
- `strictInit`: when `true`, `init()` throws `ScallopConfigError` if required config is missing.
- `tokensPerSecond`: RPC read rate limit.
- `usePythPullModel`, `useOnChainXOracleList`, `sponsoredFeeds`: tx-builder oracle behavior.

### Overriding the underlying clients

The SDK builds its own transport clients by default, but you can inject your own:

- `suiClient` (`ClientWithCoreApi` from `@mysten/sui`): overrides the Sui RPC client used for on-chain reads. When omitted, the SDK builds a `SuiGrpcClient` from `network` + `fullnodeUrl`. Accepted by `ScallopUtils` / `ScallopQuery` / `ScallopBuilder` / `ScallopClient` / `Scallop`.
- `httpClient` (`AxiosInstance`): overrides the HTTP client used for Scallop API / address-config fetches. When omitted, the SDK creates an Axios instance from the API `url` + `timeout`. Accepted anywhere `ScallopAddress` config flows (`Scallop`, `ScallopConstants`, `ScallopAddress`).
- `client` (`ScallopClient`): only on the top-level `Scallop` constructor — reuse an already-built `ScallopClient` instead of constructing a new one. Unrelated to the two transport clients above.

```ts
import { Scallop } from '@scallop-io/sui-scallop-sdk';
import { SuiClient } from '@mysten/sui/client';
import axios from 'axios';

const sdk = new Scallop({
  addressId: '695fcdc084f790c04eb068dc',
  network: 'mainnet',
  fullnodeUrl: 'https://fullnode.mainnet.sui.io:443',
  walletAddress: '0x...',
  suiClient: new SuiClient({ url: 'https://fullnode.mainnet.sui.io:443' }), // custom Sui RPC client
  httpClient: axios.create({ timeout: 15_000 }), // custom HTTP client for API/address fetches
});
```

> Note: prior to v4.3.0 these were all named `client` and collided into an unusable intersection type. Use `suiClient` / `httpClient` (and the top-level `client`) on v4.3.0+.

## Query Examples

```ts
const marketPools = await query.getMarketPools();
const suiPool = await query.getMarketPool('sui');
const collaterals = await query.getMarketCollaterals();

const obligations = await query.getObligations('0xOwner');
const obligation = await query.queryObligation('0xObligationId');
const portfolio = await query.getUserPortfolio({ walletAddress: '0xOwner' });

const prices = await query.getPythCoinPrices({ coinNames: ['sui', 'usdc'] });
const allPrices = await query.getAllCoinPrices();

const stakeAccounts = await query.getAllStakeAccounts('0xOwner');
const tvl = await query.getTvl();
```

Read source selection is available on supported facade methods via legacy-compatible flags:

```ts
await query.getMarketPools(undefined, { source: 'rpc' }); // on-chain RPC
await query.getMarketPools(undefined, { source: 'indexer' }); // API/indexer only
await query.getMarketPools(undefined, { source: 'indexer-first' }); // API/indexer with RPC fallback
await query.getMarketPools(undefined, { indexer: true }); // same as indexer-first
```

Repository internals normalize those values to `onchain`, `api`, or `api-first`.

## Client Examples

`ScallopClient` methods sign and execute by default. Pass `false` where supported to receive an unsigned transaction instead.

```ts
const result = await client.openObligation();

await client.supply('sui', 1_000_000_000);
await client.depositCollateral('sui', 1_000_000_000);
await client.withdraw('sui', 1_000_000_000);
await client.withdrawCollateral('sui', 1_000_000_000);

await client.borrow(
  'usdc',
  1_000_000,
  true,
  '0xObligationId',
  '0xObligationKey'
);
await client.repay(
  'usdc',
  1_000_000,
  true,
  '0xObligationId',
  '0xObligationKey'
);

const tx = await client.supply('sui', 1_000_000_000, false);
```

Other write helpers include:

- lending: `supply`, `withdraw`, `flashLoan`
- collateral: `depositCollateral`, `withdrawCollateral`
- borrow: `openObligation`, `borrow`, `repay`
- spool: `createStakeAccount`, `stake`, `unstake`, `claim`, `supplyAndStake`, `unstakeAndWithdraw`
- veSCA / incentives: `stakeObligation`, `unstakeObligation`, `claimBorrowIncentive`, `claimAllUnlockedSca`
- migration/test helpers: `migrateAllMarketCoin`, `mintTestCoin`

## Transaction Builder

Use `ScallopBuilder` for custom transaction composition.

```ts
const tx = builder.createTxBlock();

await tx.supplyQuick('sui', 1_000_000_000);
await tx.depositCollateralQuick('sui', 1_000_000_000);

const result = await builder.executor.signAndSendTxn(tx);
```

`ScallopTxBlock` exposes both flat methods and module-grouped methods. References are identity-equal:

```ts
tx.supplyQuick === tx.core.supplyQuick; // true
tx.stake === tx.spool.stake; // true
```

Modules:

- `tx.core`: lending, collateral, borrow, liquidations, flash loans
- `tx.spool`: staking market coins
- `tx.vesca`: veSCA lock/split/merge/redeem flows
- `tx.borrowIncentive`: obligation staking and incentive claims
- `tx.referral`: referral binding/revenue flows
- `tx.loyalty`: loyalty reward claims
- `tx.sCoin`: sCoin mint/burn

Method conventions:

- normal methods are synchronous Move-call wrappers and return `TransactionResult`.
- `*Quick` methods are async helpers that fetch required coins/objects/oracle updates, call normal methods, and return leftovers where needed.
- canonical lending names are `supply` / `supplyQuick` / `depositCollateral` / `depositCollateralQuick`.
- legacy `deposit*` and `addCollateral*` names are deprecated.

## Constants And Addresses

```ts
const constants = await sdk.getScallopConstants();

const corePackage = constants.get('core.packages.protocol.id');
const allAddresses = constants.getAddresses();

const addressAdapter = constants.address;
const addressId = addressAdapter.addressId;
```

`constants.whitelist` and `constants.poolAddresses` are frozen snapshots after `init()`.

## Errors And Logging

SDK internals throw typed errors:

- `ScallopRpcError`: Sui RPC / gRPC failures
- `ScallopIndexerError`: Scallop API/indexer HTTP failures
- `ScallopParseError`: invalid or unexpected payload
- `ScallopConfigError`: config validation failure
- `ScallopTransactionBuildError`: tx construction failure

```ts
import { ScallopError } from '@scallop-io/sui-scallop-sdk/errors';
import { consoleLogger } from '@scallop-io/sui-scallop-sdk/logger';

const sdk = new Scallop({
  addressId: '695fcdc084f790c04eb068dc',
  network: 'mainnet',
  fullnodeUrl: 'https://fullnode.mainnet.sui.io:443',
  walletAddress: '0x...',
  logger: consoleLogger,
});

try {
  await query.getMarketPools();
} catch (error) {
  if (error instanceof ScallopError) {
    // error.cause and error.context are available where provided
  }
}
```

## Local Development

```bash
pnpm install
pnpm run build
pnpm run test:typecheck
pnpm run test:unit
```

Useful scripts:

```bash
pnpm run build             # production build
pnpm run build:dev         # development build
pnpm run test:typecheck    # TypeScript checks for tests
pnpm run test:no-console   # no console.* in SDK internals
pnpm run test:unit         # network-free unit tests
pnpm run test:integration  # integration tests; needs network + local env setup
pnpm run lint:fix
pnpm run format:fix
```

Integration/query/full test runs require local environment variables such as `SECRET_KEY`. Do not commit secrets.

## More Docs

- Contributor architecture: [`docs/SDK_STRUCTURE.md`](docs/SDK_STRUCTURE.md)
- Client guide: [`document/client.md`](document/client.md)
- Query guide: [`document/query.md`](document/query.md)
- Address guide: [`document/address.md`](document/address.md)
- Builder guide: [`document/builder.md`](document/builder.md)
- Utils guide: [`document/utils.md`](document/utils.md)
- Constants guide: [`document/constants.md`](document/constants.md)

## License

[Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0)

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/scallop-io/sui-scallop-sdk)
