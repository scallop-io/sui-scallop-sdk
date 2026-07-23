# Migrating from v3 to v4

> **TL;DR:** The **write / transaction** surface is unchanged — if you only call `supply`, `borrow`, `repay`, `stake`, `depositCollateral`, etc. on `ScallopClient`/`ScallopBuilder`, that code keeps working. **`ScallopBuilder` is fully unchanged.** But several **read methods were renamed or relocated** in v4 (`ScallopClient` reads, `ScallopQuery` price/market reads, and a few `ScallopUtils` helpers) — if you call any of those, you must update. See B7–B9.
>
> Keep reading if you do any of these:
>
> 1. **Inherit from `ScallopConstants`** (subclass it in your own code).
> 2. **Check `instanceof ScallopAddress`** against a `ScallopConstants` instance.
> 3. **Mutate `constants.whitelist` or `constants.poolAddresses` directly** (calling `.add()` / `.delete()` / `.clear()` on them).
> 4. **Import from non-public paths** like `src/types/internal/`, deep internal modules.
> 5. **Target Node < 22** (you can't — v4 requires Node 22+).
> 6. **Use `Scallop.createScallopIndexer()`, `ScallopSuiKit`, or `ScallopAxios`** (all removed — see B6).
> 7. **Call read methods on `ScallopClient`** (`queryMarket`, `getObligations`, `getStakeAccounts`, …) — removed; call them on `client.query.*` instead (see B7).
> 8. **Call price / market reads on `ScallopQuery`** (`getPriceFromPyth`, `getPricesFromPyth`, `getCoinPriceByIndexer`, `getCoinPricesByIndexer`, `queryMarket`, `getBindedObligationId`) — renamed or removed (see B8).
> 9. **Call `getCoinPrices`, `getPythPrice`, or `getObligationCoinNames` on `ScallopUtils`** — removed (see B9).

This guide gives you the exact diff for each breaking change. For the _why_, see [`CHANGELOG.md`](../CHANGELOG.md). For the new SDK shape, see [`SDK_STRUCTURE.md`](SDK_STRUCTURE.md).

---

## Quick checklist

```
□ Bump @scallop-io/sui-scallop-sdk to ^4.0.0
□ Install @mysten/sui@^2 in your own deps (now a peer dependency)
□ Update Node to >=22 in CI and local engines
□ Replace `constants instanceof ScallopAddress` → `constants.address instanceof ScallopAddress`
□ Remove any code that mutates `constants.whitelist` / `constants.poolAddresses`
□ If you subclass ScallopConstants, switch to composition (forward .address.* or accept ScallopAddress in ctor)
□ Re-route any deep `src/types/internal/...` imports through the public barrel
□ Replace `scallop.createScallopIndexer()` usage with `createScallopQuery()` + its read methods
□ Drop any `.scallopSuiKit` access → `utils.onchain` (reads) / `builder.suiKit` / `builder.executor` (writes)
□ Move ScallopClient read calls to the query object: `client.queryMarket()` → `client.query.getMarketPools()`; `client.getObligations()` → `client.query.getObligations()` (B7)
□ Rename ScallopQuery price/market reads: `getPriceFromPyth`→`getPythCoinPrice`, `getPricesFromPyth`→`getPythCoinPrices`, `getCoinPriceByIndexer`→`getIndexerCoinPrice`, `getCoinPricesByIndexer`→`getIndexerCoinPrices`, `queryMarket`→`getMarketPools` (B8)
□ Replace removed ScallopUtils helpers: `getCoinPrices` / `getPythPrice` → `ScallopQuery` price reads; `getObligationCoinNames` → obligation query reads (B9)
□ Run typecheck + your tests
```

---

## B1 — `ScallopConstants` no longer extends `ScallopAddress`

### What changed

`ScallopConstants` now **composes** a `ScallopAddress` instead of extending one. The address adapter is exposed at `constants.address`. The full inheritance chain `ScallopConstants → ScallopAddress → ScallopAxios → ScallopQueryClient` is dismantled.

### Impact matrix

| If your v3 code did…                                                 | …in v4 you must…                                                                                     | Forwarder available?        |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------- |
| `constants.get('core.market')`                                       | nothing — keeps working                                                                              | ✅ yes                      |
| `constants.getAddresses()`                                           | nothing                                                                                              | ✅ yes                      |
| `constants.setAddresses(...)`                                        | nothing                                                                                              | ✅ yes                      |
| `constants.read(addressId)`                                          | call `constants.address.read(addressId)`                                                             | ❌ removed (use `.address`) |
| `constants.queryClient`                                              | removed with the `ScallopQueryClient` base class — read the API via `ScallopQuery` / `utils.onchain` | ❌ removed                  |
| `constants.axiosInstance`                                            | removed with `ScallopAxios` (see B6)                                                                 | ❌ removed                  |
| `constants.scallopAxios`                                             | removed with `ScallopAxios` (see B6)                                                                 | ❌ removed                  |
| `constants.switchCurrentAddresses('testnet')`                        | nothing                                                                                              | ✅ yes                      |
| `constants instanceof ScallopAddress`                                | check `constants.address instanceof ScallopAddress`                                                  | —                           |
| `class MyConstants extends ScallopConstants` and then `super.read()` | replace `super.X()` with `this.address.X()`                                                          | —                           |
| `utils.address.get('core.market')`                                   | nothing — `utils.address` now returns the _real_ `ScallopAddress`                                    | —                           |

### Migration — `instanceof` checks

```diff
- if (constants instanceof ScallopAddress) {
+ if (constants.address instanceof ScallopAddress) {
    // ...
  }
```

### Migration — direct internals access (optional but cleaner)

These all still work via forwarders, but the explicit form makes the dependency obvious:

```diff
- constants.get('core.market')
+ constants.address.get('core.market')

- constants.getAddresses()
+ constants.address.getAddresses()

- constants.queryClient
+ constants.address.queryClient
```

### Migration — subclassing `ScallopConstants`

If you had your own subclass overriding internal methods, switch to composition:

```ts
// v3 — relied on inherited methods
class MyConstants extends ScallopConstants {
  async readMine() {
    const data = await super.read(); // ❌ no longer works
    return data;
  }
}
```

```ts
// v4 — go through the composed address
class MyConstants extends ScallopConstants {
  async readMine() {
    const data = await this.address.read(); // ✅
    return data;
  }
}
```

If you were _only_ extending to grab the address adapter, you don't need a subclass at all in v4 — just use `constants.address` directly.

### Migration — injecting a pre-built `ScallopAddress`

New in v4: `ScallopConstantsParams.scallopAddress` lets you inject a custom address adapter. Handy for tests:

```ts
import { ScallopAddress, ScallopConstants } from '@scallop-io/sui-scallop-sdk';

const address = new ScallopAddress({
  forceAddressesInterface: { mainnet: FIXTURE_ADDRESSES },
});

const constants = new ScallopConstants({
  scallopAddress: address, // ✅ v4 only
});
```

---

## B2 — `whitelist` / `poolAddresses` are now frozen immutable snapshots

### What changed

- **v3:** `Proxy` getters that fell back to `DEFAULT_WHITELIST` on missing keys, and silently allowed mutation through `Set.add` / `Set.delete`.
- **v4:** plain frozen objects populated during `init()`. Every whitelist key is always present (missing entries default to empty `Set`s). Mutating them throws `TypeError: Cannot mutate readonly ScallopConstants whitelist`.

### Migration

If you were intentionally adding entries at runtime:

```diff
- constants.whitelist.lending.add('mycoin');           // silently mutated the singleton
- constants.poolAddresses['mycoin'] = { ... };
+ await constants.init({
+   constantsParams: {
+     forceWhitelistInterface: {
+       ...constants.whitelist,
+       lending: new Set([...constants.whitelist.lending, 'mycoin']),
+     },
+     forcePoolAddressInterface: {
+       ...constants.poolAddresses,
+       mycoin: { /* ... */ },
+     },
+   },
+ });
```

The `force*Interface` overrides existed in v3 too — you just didn't need them as often. In v4 they're the only sanctioned way to bypass the on-chain whitelist/pool source.

If you were _reading_ whitelist/poolAddresses, nothing changes — the shape and key set are identical.

---

## B3 — Minimum Node 22

v4 declares Node 22+ in `vitest.config.ts` and tsup output. v3 supported Node 18+.

```diff
  // package.json
  "engines": {
-   "node": ">=18"
+   "node": ">=22"
  }
```

```diff
  # .github/workflows/your-ci.yml
  - uses: actions/setup-node@v6.4.0
    with:
-     node-version: '20'
+     node-version: '22'
```

---

## B4 — Public type surface clarified

### What changed

- `src/types/index.ts` now delegates to `src/types/public/index.ts` — the explicit, semver-governed barrel.
- Non-public DTO/transport types (e.g. `MoveTypeName`, `TypeNameField`, the `Origin*` / `Parsed*` / `Calculated*` DTOs) live under `src/types/internal/` and are **not** re-exported from the root.
- Legacy `Origin*` / `Parsed*` / `Calculated*` DTOs remain reachable through `src/types/query/*` for back-compat. Internal code now imports them via `src/types/internal/`.

### Impact

| If your v3 code imported from…                                     | …in v4…                                         |
| ------------------------------------------------------------------ | ----------------------------------------------- |
| `@scallop-io/sui-scallop-sdk` (root)                               | nothing changes                                 |
| `@scallop-io/sui-scallop-sdk/types` (new subpath)                  | use this for type-only imports — lighter bundle |
| Deep paths like `@scallop-io/sui-scallop-sdk/dist/types/query/...` | unsupported in both v3 and v4 — please don't    |
| `src/types/internal/...`                                           | this is internal — switch to the public barrel  |

### Migration

```diff
- import type { MoveTypeName } from '@scallop-io/sui-scallop-sdk';   // never exported
+ // MoveTypeName is internal — use the public type or copy the shape locally
```

For the common DTOs you actually need (`MarketPool`, `Obligation`, `Lending`, etc.), they're all still in the root barrel:

```ts
import type {
  MarketPool,
  MarketCollateral,
  Obligation,
  ObligationAccount,
  Lending,
  Vesca,
} from '@scallop-io/sui-scallop-sdk';
```

---

## B5 — `@mysten/sui` is now a peer dependency

### What changed

`@mysten/sui` moved from the SDK's `dependencies` to `peerDependencies` (`^2.0.0`). The SDK no longer ships its own copy.

### Impact

You exchange `Transaction` objects across the SDK boundary — `ScallopBuilder.createTxBlock()` hands you a block that you later sign/execute with your own `@mysten/sui` client. If the SDK bundled a _second_ copy of `@mysten/sui`, those objects would come from a different module instance than your app's, breaking `instanceof Transaction` checks and bcs serialization. A peer dependency guarantees one shared copy across your app, this SDK, and `@scallop-io/sui-kit` (which also depends on `^2.0.0`).

### Migration

Add `@mysten/sui` to your own `package.json` if it isn't already there:

```bash
npm install @mysten/sui@^2      # or: pnpm add / yarn add / bun add
```

- **npm 7+** and **Bun** auto-install missing peers, so you may already be covered.
- **pnpm** and **yarn** do not — you'll see an "unmet peer dependency" warning until you add it explicitly.
- Use a wide `^2` range so it dedups with whatever version your other Sui packages resolve. Pinning an exact version risks a duplicate install.

No code changes are needed — your existing `@mysten/sui` imports keep working.

---

## B6 — Transport reshaped: `ScallopIndexer`, `ScallopSuiKit`, `ScallopAxios` removed

### What changed

v4 replaces the three legacy transport models with a small `src/datasources/` layer:

- **`ScallopIndexer` model + `Scallop.createScallopIndexer()` are removed.** Indexer/API reads now flow through the repository layer behind `ScallopQuery`. Coin-price reads are exposed as `ScallopQuery` methods (`getPythCoinPrice(s)`, `getIndexerCoinPrice(s)` — see B8 for the v3 → v4 renames) rather than on a standalone indexer object.
- **`ScallopSuiKit` is removed.** Reads go through a rate-limited `OnChainDataSource` owned by `ScallopUtils` (`utils.onchain`). Writes go through a `TransactionExecutor` owned by `ScallopBuilder` (`builder.executor`), with the raw `SuiKit` still reachable at `builder.suiKit`.
- **`ScallopAxios` is removed.** `ScallopAddress` reads the Scallop API through an `ApiDataSource`.

`ScallopIndexerError` (the typed error) is **not** affected — only the `ScallopIndexer` _model_ is gone.

### Impact

| If your v3 code did…                               | …in v4…                                                                   |
| -------------------------------------------------- | ------------------------------------------------------------------------- |
| `await scallop.createScallopIndexer()`             | use `await scallop.createScallopQuery()` + its read methods               |
| `indexer.getMarket()` / `indexer.getCoinPrices()`  | use the equivalent `ScallopQuery` reads (`getMarketPools`, price methods) |
| accessed `.scallopSuiKit`                          | use `utils.onchain` (reads) or `builder.suiKit` / `builder.executor`      |
| only called facade methods (`query.*`, `client.*`) | nothing — public read/write surfaces are unchanged                        |

### Migration

```diff
- const indexer = await scallop.createScallopIndexer();
- const pools = await indexer.getMarket();
+ const query = await scallop.createScallopQuery();
+ const pools = await query.getMarketPools();
```

> Internal-path note: importing from `src/utils/index.js`, `src/config/...`, `src/context/...`, or the per-domain mapper files is no longer possible — those modules were removed or relocated (utils barrel split into concrete modules, config sources moved under `ScallopConstants`). These were never part of the public surface; use the root barrel or the documented subpaths.

---

## B7 — `ScallopClient` read methods moved to `client.query.*`

### What changed

In v3, `ScallopClient` carried a set of read methods that were thin delegates to its internal `ScallopQuery` (`return this.query.<method>(...)`). v4 **removes those delegates** — read through the query object (`client.query`, which is still exposed) or a standalone `ScallopQuery`. Write methods (`supply`, `borrow`, `repay`, `stake`, `depositCollateral`, …) are unchanged.

### Impact

| v3 `ScallopClient` call         | v4 replacement                        |
| ------------------------------- | ------------------------------------- |
| `client.queryMarket()`          | `client.query.getMarketPools()` \*    |
| `client.queryObligation(id)`    | `client.query.queryObligation(id)`    |
| `client.getObligations(owner?)` | `client.query.getObligations(owner?)` |
| `client.getAllStakeAccounts()`  | `client.query.getAllStakeAccounts()`  |
| `client.getStakeAccounts(name)` | `client.query.getStakeAccounts(name)` |
| `client.getStakePool(name)`     | `client.query.getStakePool(name)`     |
| `client.getStakeRewardPool(n)`  | `client.query.getStakeRewardPool(n)`  |
| `client.requireSender()`        | removed (was an internal helper)      |

\* `queryMarket` was itself renamed to `getMarketPools` on `ScallopQuery` — see B8.

### Migration

```diff
- const market = await client.queryMarket();
+ const market = await client.query.getMarketPools();

- const obligations = await client.getObligations();
+ const obligations = await client.query.getObligations();
```

---

## B8 — `ScallopQuery` price / market read renames

### What changed

v4 standardised the coin-price and market read names on `ScallopQuery`. The old names are **gone** (no deprecated aliases):

| v3 `ScallopQuery` method | v4 name                |
| ------------------------ | ---------------------- |
| `getPriceFromPyth`       | `getPythCoinPrice`     |
| `getPricesFromPyth`      | `getPythCoinPrices`    |
| `getCoinPriceByIndexer`  | `getIndexerCoinPrice`  |
| `getCoinPricesByIndexer` | `getIndexerCoinPrices` |
| `queryMarket`            | `getMarketPools`       |
| `getBindedObligationId`  | removed                |

### Migration

```diff
- const price  = await query.getPriceFromPyth('sui');
+ const price  = await query.getPythCoinPrice('sui');

- const prices = await query.getPricesFromPyth(['sui', 'usdc']);
+ const prices = await query.getPythCoinPrices(['sui', 'usdc']);

- const market = await query.queryMarket();
+ const market = await query.getMarketPools();
```

---

## B9 — `ScallopUtils` removed helpers

### What changed

Three public `ScallopUtils` methods were removed in v4; the work moved to `ScallopQuery` / the repository layer:

| Removed v3 `ScallopUtils` method | v4 replacement                                              |
| -------------------------------- | ----------------------------------------------------------- |
| `getCoinPrices(...)`             | `query.getAllCoinPrices()` / `query.getPythCoinPrices(...)` |
| `getPythPrice(...)`              | `query.getPythCoinPrice(...)`                               |
| `getObligationCoinNames(...)`    | obligation reads on `ScallopQuery`                          |

All the pure parsing/formatting helpers (`parseCoinName`, `parseSymbol`, `selectCoin`, `getCoinDecimal`, `isMarketCoin`, …) are unchanged.

---

## Optional: opt in to v4-only goodies

These aren't required to upgrade, but you may want them:

### 1. Module-grouped tx-block view

```diff
  const tx = builder.createTxBlock();

- tx.supplyQuick(coinAmount, 'sui');
- tx.stake(stakeAccount, marketCoin, 'ssui');
+ tx.core.supplyQuick(coinAmount, 'sui');
+ tx.spool.stake(stakeAccount, marketCoin, 'ssui');
```

Function references are identity-equal (`tx.supplyQuick === tx.core.supplyQuick`), so this is a purely stylistic upgrade. Flat methods will be marked `@deprecated` in a future minor release.

### 2. Subpath imports — slimmer bundles

```diff
- import { ScallopClient } from '@scallop-io/sui-scallop-sdk';
+ import { ScallopClient } from '@scallop-io/sui-scallop-sdk/client';
```

Available subpaths: `/client`, `/query`, `/builder`, `/errors`, `/logger`, `/types`. Each ships ESM + CJS + matching `.d.ts`. See [`SDK_STRUCTURE.md` §8](SDK_STRUCTURE.md#8-subpath-exports).

### 3. Typed errors

```ts
import {
  ScallopRpcError,
  ScallopParseError,
} from '@scallop-io/sui-scallop-sdk/errors';

try {
  await client.supply(/* ... */);
} catch (err) {
  if (err instanceof ScallopRpcError) {
    // structured fields: err.cause, err.context.method, ...
  }
  if (err instanceof ScallopParseError) {
    // a mapper rejected a payload shape
  }
}
```

Note: only newly-added mappers/services/config throw typed errors in v4. Some legacy builder/query/util paths still throw plain `Error` and remain follow-up work.

### 4. Pluggable logger

```ts
import { Scallop } from '@scallop-io/sui-scallop-sdk';
import { consoleLogger } from '@scallop-io/sui-scallop-sdk/logger';

const scallop = new Scallop({
  logger: consoleLogger, // default is noopLogger (silent)
});
```

The SDK never calls `console.*` itself in v4. Indexer-fallback warnings, init diagnostics, etc. all route through your injected logger.

### 5. `strictInit` — fail loud on missing config

```ts
const constants = new ScallopConstants({ strictInit: true });
await constants.init();
// throws ScallopConfigError if required core addresses or whitelist sets are missing/empty
```

Defaults to `false` (best-effort init, same as v3).

---

## Removed in v4

- The long-deprecated aliases `deposit` / `depositQuick` / `addCollateral` / `addCollateralQuick` (and the client-level `deposit` / `addCollateral` / `depositAndStake`) were **removed in v4** — migrate to the canonical names (`supply` / `supplyQuick` / `depositCollateral` / `depositCollateralQuick`).

---

## What didn't change

- **The entire `ScallopBuilder` surface** — `createTxBlock()` and every builder method are identical to v3.
- **All write / transaction methods** on `Scallop`, `ScallopClient` — `supply`, `borrow`, `repay`, `stake`, `depositCollateral`, `openObligation`, `flashLoan`, etc. keep the same signatures and return shapes.
- **All flat tx-block methods** — `tx.supplyQuick`, `tx.stake`, `tx.borrow`, etc. continue to work exactly as before (except the long-deprecated `deposit` / `addCollateral` families removed below).
- **The init flow** — `await scallop.createScallopClient()` etc. handle init automatically, same as v3.
- **The `parseObjectAs<T>` gotcha** — see [`SDK_STRUCTURE.md` §7](SDK_STRUCTURE.md#7-cross-cutting-concerns) for the still-valid warning about `.value` field unwrapping.

> **What _did_ change:** several **read** methods on `ScallopClient` (B7), `ScallopQuery` (B8), and `ScallopUtils` (B9) were renamed or relocated. If you call reads, check those sections.

---

## Reporting issues

If you hit a migration snag not covered here:

1. Re-run with `logger: consoleLogger` to surface the underlying error.
2. Open an issue at https://github.com/scallop-io/sui-scallop-sdk/issues with the error and your v3 → v4 diff.

We treat broken v3 read paths (`getMarketPools`, `getObligationAccount`, etc.) as **regressions**, not breaking changes — please report.
