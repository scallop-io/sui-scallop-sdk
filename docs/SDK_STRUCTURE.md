# SDK Structure

A guided tour of how `@scallop-io/sui-scallop-sdk` is laid out. Read this first if you're new to the codebase or returning after a long break.

> **Audience:** SDK contributors and integrators who want to understand the moving parts without reading every file.
> **Companion docs:** [`SDK_STRUCTURE_REPORT.md`](SDK_STRUCTURE_REPORT.md) (problem statement) and [`SDK_STRUCTURE_FIX_PLAN.md`](SDK_STRUCTURE_FIX_PLAN.md) (workstreams + status). The read layer has its own contributor guide in [`../src/repositories/CLAUDE.md`](../src/repositories/CLAUDE.md).

---

## 1. The 30-second mental model

The SDK has a stable public facade over an internal split. Think in two paths:

```text
Write path:
ScallopClient method
  -> client service        (src/services/client/*)
  -> ScallopBuilder / ScallopTxBlock
  -> TransactionExecutor   (sign + execute, native CoreClient — owned by the builder)
  -> Sui transaction

Read path:
ScallopQuery method
  -> repository            (src/repositories/<domain>/)
  -> datasource            (rate-limited RPC, or indexer/API axios)
  -> per-domain parse      (repo utils.ts / schema.ts / mapper.ts)
  -> typed return value
```

Supporting pieces:

- `ScallopConstants` owns protocol config: addresses, pool addresses, whitelist, decimals. It **composes** `ScallopAddress` (`constants.address`) and embeds its config sources + validator under `src/models/scallopConstants/config/`.
- `ScallopAddress` is the address/HTTP adapter; it reads the Scallop API via `ApiDataSource`.
- `ScallopUtils` holds the resolved Core read client (`utils.client`, a `ClientWithCoreMethods`) plus `ScallopConstants`. `ScallopQuery` owns the raw Sui gRPC Core client (`query.grpc`, a `SuiGrpcClient`); the rate-limited `GrpcDataSource` that wraps it is built inside the repository registry.
- `ScallopBuilder` owns the raw `SuiKit` (`builder.suiKit`) and the write-path `TransactionExecutor` (`builder.executor`, a `SuiKitTransactionExecutor`).
- `src/datasources/` is the raw transport layer (on-chain RPC, indexer, API, and a Sui GraphQL source for reads with no gRPC equivalent). `ScallopSuiKit` and the `ScallopIndexer` model were both removed.
- **The Core read path is always gRPC.** The registry's `GrpcDataSource` (wrapping `query.grpc`) calls the Sui **Core API** (`getObjects`, `getDynamicField`, `listOwnedObjects`, `getBalance`, `simulateTransaction`, …) over gRPC — it is never routed over GraphQL. A separate `GraphQLDataSource` owns only the GraphQL-**native** primitives that have no single-round-trip Core equivalent (`multiGetBalances`, `listDynamicFieldsWithValues`, `multiGetDynamicFields`). Passing `readTransport: 'graphql'` to `Scallop`/`ScallopQuery` no longer moves Core reads onto GraphQL; it only flips `preferGraphql`, so the heavy dynamic-field walkers (`poolAddresses`, `xOracle`, `veSca` family, `obligation` names, `flashloan`, `borrowIncentive` bindings) that *have* a native GraphQL query prefer it instead of the gRPC multi-call fan-out. Selection is strict by transport — no automatic fallback to the gRPC Core path (`runByReadTransport` in `repositories/utils.ts`); a failing native GraphQL query propagates. See [`GRAPHQL_SUPPORT.md`](GRAPHQL_SUPPORT.md).
- `src/mappers/` is now just `moveTypeMapper` (gRPC vs JSON-RPC `TypeName` differences); per-domain payload parsing lives inside each repository.
- `src/services/query/portfolioCalculations.ts` holds pure math extracted from portfolio queries.
- `src/errors/`, `src/logger/`, `src/types/public`, and `src/types/internal` are cross-cutting support layers.

The read path is now fully on the repository layer — the old `src/queries/*` files and the facade-adapter repositories are gone, and `ScallopQuery` delegates every domain to `repos.<domain>`. The **write / transaction** surface on `Scallop` / `ScallopClient` / `ScallopBuilder` is preserved across the v4 refactor; several **read** methods on `ScallopClient`, `ScallopQuery`, and `ScallopUtils` were renamed or relocated (see [`V3_TO_V4.md` §B7–B9](V3_TO_V4.md#b7--scallopclient-read-methods-moved-to-clientquery)).

---

## 2. The public facade

These are the names you import. They form a dependency chain — each holds a reference to the next.

```
Scallop
  └── ScallopClient        // write facade: signs & sends transactions, high-level user actions
        └── ScallopBuilder // owns raw SuiKit + TransactionExecutor; composes ScallopTxBlocks
              └── ScallopQuery  // read facade — owns query.grpc (SuiGrpcClient); delegates to the repository registry
                    └── ScallopUtils  // type lookups, coin metadata; holds utils.client (resolved Core read client)
                          └── ScallopConstants    // pool addresses, whitelist, decimals
                                └── ScallopAddress // address registry + HTTP (ApiDataSource)
```

The write-path transport hangs off the **builder**, not utils:

```
ScallopBuilder
  ├── suiKit     // raw @scallop-io/sui-kit
  └── executor   // SuiKitTransactionExecutor (memoised), native CoreClient write path
```

**Init:** every model exposes `.init()`. You don't usually call it yourself — `Scallop.createScallopClient()` / `createScallopBuilder()` / `createScallopQuery()` / `createScallopUtils()` handle it.

**Parent accessors:** each model exposes its dependencies as getters (`client.builder`, `builder.query`, `query.utils`, `utils.constants`, `constants.address`). `ScallopClient` also forwards `suiKit` / `executor` to the builder and `grpc` to the query that own them. This makes the chain navigable without re-instantiating anything.

> ⚠️ **v4 change:** `ScallopConstants` used to _extend_ `ScallopAddress`. As of v4 it **composes** it — reach the address adapter via `constants.address`. Most call sites are unaffected because `constants.get(...)`, `constants.getAddresses(...)`, etc. still work via forwarders.

---

## 3. Directory map

```
src/
├── entries/                 # ⭐ Public entry points — every tsup entry, thin re-exports
│   ├── index.ts             #   root barrel (the `.` export)
│   ├── client.ts query.ts builder.ts   #   facade subpaths
│   └── errors.ts logger.ts types.ts    #   cross-cutting subpaths
│
├── models/                  # The facade classes, one folder per model
│   ├── scallop.ts           # Scallop factory (createScallopClient/Builder/Query/Utils)
│   ├── scallopClient/       # write facade + client-service wiring
│   ├── scallopBuilder/      # owns raw SuiKit + TransactionExecutor; builds ScallopTxBlocks
│   ├── scallopQuery/        # read facade — delegates to repositories (this.repos.<domain>)
│   ├── scallopUtils/        # coin/type helpers; holds the resolved Core read client (utils.client)
│   ├── scallopConstants/    # protocol config
│   │   └── config/          # ScallopConfig, snapshot, ConfigValidator, *ConfigSource
│   ├── scallopAddress/      # address registry + HTTP (reads API via ApiDataSource)
│   ├── suiKit.ts            # newSuiKit() factory
│   ├── transactionExecutor.ts  # SuiKitTransactionExecutor (CoreClient-style write path)
│   └── interface.ts
│
├── txBuilders/              # Transaction-block builders (write-path construction layer)
│   ├── context.ts           # ⭐ Narrow injected contexts (MoveCallContext / *ActionContext)
│   ├── core/ spool/ vesca/ borrowIncentive/ referral/ sCoin/ loyaltyProgram/ obligationNaming/
│   │       each domain: moveCalls.ts (normal/pure) + quick.ts (orchestration) + index.ts (factory)
│   │       (obligationNaming is normal-only: moveCalls.ts + index.ts, no quick.ts)
│   │   core/oracles/        # xOracle price-feed orchestration (feeds the *Quick methods)
│   │       index.ts (updateOracles + OracleActionContext) + rules/ provider registry:
│   │       rules/{pyth,pythAccumulator,supra,switchboard}.ts, registry.ts, types.ts
│   ├── utils.ts             # shared pure builder helpers (requireSender, …)
│   ├── manifest.ts          # ⭐ Per-module method manifest
│   ├── modules.ts           # ⭐ Per-domain module objects (tx.core, tx.spool, …)
│   ├── verify.ts            # Runtime collision / presence checker for ScallopTxBlock
│   └── index.ts             # newScallopTxBlock — Proxy that layers all builders
│
├── datasources/             # ⭐ Raw transport
│   ├── grpc.ts              # GrpcDataSource — rate-limited Sui gRPC read client (new-gen SDK)
│   ├── rateLimiter.ts       # token-bucket throttle (single point for all on-chain reads)
│   ├── api.ts               # ApiDataSource — Scallop API (axios)
│   ├── indexer.ts           # IndexerDataSource extends ApiDataSource (indexer base url)
│   └── graphql.ts           # GraphQLDataSource — Sui GraphQL, self-caching; balance reads
│                            #   with no gRPC equivalent (multiGetBalances → coinBalance)
│
├── repositories/            # ⭐ The read layer — one folder per domain
│   ├── base.ts              # BaseRepository (fetchWithCache, baseContext, metadata generic)
│   ├── cache.ts             # shared @tanstack/query-core QueryClient
│   ├── types.ts             # BaseContext, QuerySource ('onchain'|'api'|'api-first'), params
│   ├── utils.ts             # runWithDataSourceFallback, logError, getDynamicField* helpers
│   ├── market/ obligation/ spool/ price/ borrowIncentive/ coinBalance/
│   ├── flashloan/ isolatedAssets/ xOracle/ veSca/ loyaltyProgram/
│   ├── veScaLoyaltyProgram/ referral/ poolAddresses/
│   │       each domain: index.ts + helpers.ts + types.ts (+ utils/schema/bcs/const/mapper as needed)
│   └── wiring/              # registry.ts, datasources.ts, metadata.ts, source.ts
│
├── services/
│   ├── query/
│   │   └── portfolioCalculations.ts  # Pure-math helpers (TVL, risk, available borrow/withdraw)
│   └── client/              # ⭐ Write-side business logic (extracted from ScallopClient)
│       ├── LendingService.ts        # supply / withdraw / flashLoan
│       ├── CollateralService.ts     # depositCollateral / withdrawCollateral
│       ├── BorrowService.ts         # openObligation / borrow / repay
│       ├── SpoolService.ts          # createStakeAccount / stake / unstake / claim
│       ├── VeScaService.ts          # stake/unstake obligation, claim unlocked SCA
│       ├── ReferralService.ts
│       └── types.ts                 # ClientServiceContext structural type
│
├── mappers/                 # ⭐ Anti-corruption layer (now minimal)
│   ├── moveTypeMapper.ts            # Normalise gRPC vs JSON-RPC TypeName shapes
│   └── index.ts                     # per-domain parsing lives in repositories/<domain>/
│
├── errors/                  # ⭐ Typed error hierarchy
│   ├── ScallopError (base), ScallopRpcError, ScallopIndexerError,
│   ├── ScallopParseError, ScallopConfigError, ScallopTransactionBuildError
│
├── logger/                  # ⭐ Logger abstraction (no console.* in internals)
│   ├── Logger.ts, noopLogger.ts (default), consoleLogger.ts (opt-in)
│
├── types/                   # ⭐ Public vs internal type boundary
│   ├── public/              # The semver-governed type surface
│   ├── internal/            # DTOs / transport types — NOT re-exported from root
│   ├── builder/, query/, constant/  # Canonical type defs
│   ├── address.ts, sui.ts, utils.ts
│   └── index.ts             # Delegates to ./public
│
├── utils/
│   ├── core.ts              # parseObjectAs<T> (see gotcha in §7)
│   ├── vesca.ts             # partitionArray (chunk ids for getObjects ≤ 50/call), ...
│   ├── url.ts, math.ts, ...
│
└── constants/               # queryKeys, cache, rpc, API base url, ...
```

All public entry points live under `src/entries/` (thin re-exports). Everything else is internal impl — so "is this public API?" is answerable by location.

⭐ = layer added or formalised in **v4.0.0**.

---

## 4. The `ScallopTxBlock` — the Proxy-composed transaction block

`ScallopBuilder.createTxBlock()` returns a `ScallopTxBlock`. It looks like one object, but is actually multiple builder-objects layered through a `Proxy` in [src/txBuilders/index.ts](../src/txBuilders/index.ts):

```
coreTxBlock  ←  spoolTxBlock  ←  sCoinTxBlock  ←  referralTxBlock
            ←  borrowIncentiveTxBlock  ←  loyaltyTxBlock  ←  vescaTxBlock
            ←  obligationNamingTxBlock
```

Property lookup falls through from outermost (core) to innermost (obligationNaming). All domain methods (`tx.supplyQuick`, `tx.stake`, `tx.borrowQuick`, `tx.lockSca`, `tx.bindToReferral`, `tx.setObligationName`, …) live on the single returned object.

**Two flavours per Move call:**

- `GenerateCoreNormalMethod` — thin wrappers around Move calls. Synchronous. Returns a `TransactionResult`.
- `GenerateCoreQuickMethod` — async helpers that auto-fetch coins/obligations, call the normal method, transfer leftovers back to the sender.

**Per-domain folder layout (v4 builders refactor).** Each domain lives in `src/txBuilders/<domain>/` (`core`, `spool`, `vesca`, `borrowIncentive`, `referral`, `sCoin`, `loyaltyProgram`, `obligationNaming`) split into `moveCalls.ts` (normal, pure construction), `quick.ts` (orchestration), and `index.ts` (the `new<Domain>TxBlock` factory). The factory builds two **narrow injected contexts** once — `MoveCallContext` (address reads + `moveCall` + parse helpers, no I/O) for `moveCalls.ts`, and a domain `*ActionContext` (`reads` / `coins` / `oracles` / parse `utils`) for `quick.ts` — instead of passing the whole `ScallopBuilder`. Contexts are defined in [src/txBuilders/context.ts](../src/txBuilders/context.ts); `manifest.ts` / `modules.ts` / `verify.ts` / `index.ts` stay at the `txBuilders/` root. (`obligationNaming` is **normal-only** — `moveCalls.ts` + `index.ts`, no `quick.ts`; its factory builds only a `MoveCallContext`.)

**v4 added an explicit module view.** Alongside the flat methods, `tx.core`, `tx.spool`, `tx.vesca`, `tx.borrowIncentive`, `tx.referral`, `tx.loyalty`, `tx.scoin`, `tx.obligationNaming` expose the same functions grouped by domain. Function references match exactly (`tx.supplyQuick === tx.core.supplyQuick`). The grouping is declared in [src/txBuilders/manifest.ts](../src/txBuilders/manifest.ts), assembled in [src/txBuilders/modules.ts](../src/txBuilders/modules.ts), and verified at runtime by [src/txBuilders/verify.ts](../src/txBuilders/verify.ts).

**Naming convention for lending:** `supply` / `supplyQuick` / `depositCollateral` / `depositCollateralQuick` are canonical (Aave/Compound aligned). The legacy `deposit` / `depositQuick` / `addCollateral` / `addCollateralQuick` were **removed in v4** (deprecated in v3).

---

## 5. Read path: how `getMarketPools()` flows

```
ScallopQuery.getMarketPools()
       │  (1-line delegation in v4)
       ▼
this.repos.market.getMarkets(...)        ← createRepositories({ core, graphql, utils, ... }) in repositories/wiring/registry.ts
       │  picks a source via QuerySource (default 'api-first' for dual-source domains)
       ▼
runWithDataSourceFallback({ source, api, onchain })   ← src/repositories/utils.ts
       │  ├── api      → getMarketsFromIndexer(ctx)
       │  │                     │
       │  │                     ▼
       │  │            IndexerDataSource (axios) → parse in market/utils.ts + market/mapper.ts
       │  └── onchain  → getMarketsFromOnChain(ctx)
       │                        │
       │                        ▼
       │               GrpcDataSource (rate-limited) → parse
       ▼
returns typed MarketPool[]
```

`'api-first'` tries the indexer/API, and on failure logs a warning via the injected `Logger` (default: `noopLogger`) and falls back to on-chain. The legacy facade flags (`source: 'rpc'|'indexer'|'indexer-first'`, `indexer: boolean`, `useOnChainQuery: boolean`) are normalised onto `QuerySource` by [src/repositories/wiring/source.ts](../src/repositories/wiring/source.ts). Callers see no difference in shape.

Cross-domain assembly (e.g. obligation accounts needing market + price + spool) stays in `ScallopQuery` / `services/query/portfolioCalculations.ts`, not in a single repository.

---

## 6. Write path: how `client.supply()` flows

```
ScallopClient.supply(amount, coinName, ...)
       │  (1-line delegation in v4)
       ▼
LendingService.supply({ builder, query, ... })   // ClientServiceContext (structural)
       │
       ▼
ScallopBuilder.createTxBlock()
       │
       ▼
coreTxBlock.supplyQuick(...)   // GenerateCoreQuickMethod — auto-resolves coin objects
       ▼
builder.executor.signAndSendTxn(txBlock)   // SuiKitTransactionExecutor → CoreClient.signAndExecuteTransaction
       ▼
returns SuiTransactionBlockResponse
```

Client services accept a **structural** `ClientServiceContext` (see [src/services/client/types.ts](../src/services/client/types.ts)) — not the full `ScallopClient`. This is what makes them unit-testable without standing up a real Sui client. The write-path signer/executor lives on the builder (`builder.executor`), modelled on `@mysten/sui`'s `CoreClient`.

---

## 7. Cross-cutting concerns

### Errors

All SDK-internal failures throw a subclass of `ScallopError`. The read layer routes every failure throw through `logError(ctx.logger, new Scallop*Error(...))`; only commented-out `market/` sCoin-swap-rate helpers still carry plain `throw new Error(...)`.

| Class                          | When it fires                                               |
| ------------------------------ | ----------------------------------------------------------- |
| `ScallopRpcError`              | Sui RPC / gRPC failure                                      |
| `ScallopIndexerError`          | Scallop indexer / API HTTP failure                          |
| `ScallopParseError`            | A parser/mapper rejected a payload shape                    |
| `ScallopConfigError`           | `strictInit: true` and required addresses/whitelist missing |
| `ScallopTransactionBuildError` | A tx-builder couldn't construct a Move call                 |

Each carries `cause`, `context`, and structured fields so callers can branch on type instead of string-matching.

### Logging

Pass `{ logger }` to `Scallop`, `ScallopClient`, `ScallopQuery`, `ScallopUtils`, `ScallopAddress`, or `ScallopConstants`. The SDK never calls `console.*` internally (gated by `tests/noConsole.spec.ts`). Default is `noopLogger` — silent. Use `consoleLogger` to opt in.

### Config + strictInit

```ts
const constants = new ScallopConstants({ strictInit: true });
await constants.init();
// throws ScallopConfigError if required core addresses or whitelist sets are missing
```

The validation lives in `src/models/scallopConstants/config/ConfigValidator.ts` (colocated with `ScallopConstants`) and runs through the `AddressConfigSource` / `PoolAddressConfigSource` / `WhitelistConfigSource` boundaries in the same `config/` folder. `constants.whitelist` and `constants.poolAddresses` are frozen immutable snapshots after `init()`.

### `parseObjectAs<T>` gotcha

`src/utils/core.ts:parseObjectAs` unwraps Move object JSON. **When the on-chain JSON has a `value` field, it returns `fields.value` directly (not `{ value: ... }`).** Zod schemas consuming `parseObjectAs` output must match the unwrapped type, not the wrapper. This is the #1 source of "why is my parser empty" confusion.

### Query caching

The repository layer uses `@tanstack/query-core`'s `QueryClient` (shared via `src/repositories/cache.ts`) for on-chain and indexer data. Every network read goes through `ctx.fetchWithCache({ queryKey, queryFn })`; cache keys are centralised in `src/constants/queryKeys.ts` (always include `node: grpc.url` in RPC keys). The network call **must live inside `queryFn`** so `fetchWithCache` provides both in-flight dedup and `staleTime` reuse — a fetch issued before `fetchWithCache` bypasses the cache entirely.

**Pyth price reads** (`price/helpers.ts` — `getPythPricesFromPythApi` / `getPythPricesFromIndexerApi`) always fetch the full, sorted feed-id universe (from `addresses.coins[*].oracle.pyth.feed`) under one stable, subset-independent key (`queryKeys.oracle.getPythAllPriceFeeds`), then filter the cached `feedId → price` map down to the requested coins. So a single-coin `getPythCoinPrice('sui')` and a full `getPythCoinPrices()` share one cache entry. The entry's `staleTime`/`gcTime` is `priceTimeout` (default `5_000` ms, configurable via the `ScallopQuery`/`Scallop` constructor), so within that window all price reads are served from the one cached fetch. Coins with no configured feed default to `0`.

### Batching on-chain object reads

`grpc.client.getObjects` accepts at most 50 ids per call. Helpers that fan out over many objects chunk the id list with `partitionArray(ids, 50)` (`src/utils/vesca.ts`) — see `price/`, `market/`, `spool/`, `poolAddresses/`.

---

## 8. Subpath exports

Consumers can import slim slices instead of the full barrel:

| Subpath                               | Use for                                           |
| ------------------------------------- | ------------------------------------------------- |
| `@scallop-io/sui-scallop-sdk`         | Default — everything (heaviest)                   |
| `@scallop-io/sui-scallop-sdk/client`  | Just `ScallopClient` + minimum deps               |
| `@scallop-io/sui-scallop-sdk/query`   | Just `ScallopQuery` + minimum deps                |
| `@scallop-io/sui-scallop-sdk/builder` | Just `ScallopBuilder` + minimum deps              |
| `@scallop-io/sui-scallop-sdk/errors`  | Typed error classes                               |
| `@scallop-io/sui-scallop-sdk/logger`  | `Logger` interface, `noopLogger`, `consoleLogger` |
| `@scallop-io/sui-scallop-sdk/types`   | Type-only import (no runtime)                     |

Each subpath ships ESM + CJS + matching `.d.ts` / `.d.cts`. Every entry's source is a thin re-export under [`src/entries/`](../src/entries/) (`index`, `client`, `query`, `builder`, `errors`, `logger`, `types`) — that folder _is_ the public surface; everything else under `src/` is internal. Entry points are registered in `tsup.config.ts` + `package.json` `exports`, with a smoke test in `tests/subpathExports.spec.ts`.

---

## 9. Testing layout

Specs live under `tests/`, mirroring the `src/` tree (e.g. `tests/repositories/<domain>/index.spec.ts`, `tests/models/scallopConstants/...`, `tests/utils/...`). Source under `src/` stays spec-free. Specs import the code under test via the `src/` path alias (absolute), never relative.

```
tests/
├── repositories/<domain>/  # per-domain read-layer specs
├── models/, txBuilders/, datasources/, services/, utils/   # mirror src/
├── integration/            # mainnet dry-run specs (need .env)
├── scallopSdk.ts           # shared integration SDK fixture (forced-address overrides)
├── mocks.ts                # shared fakes for unit specs
├── subpathExports.spec.ts  # smoke test for every entry point
└── noConsole.spec.ts       # CI gate: blocks new console.* in SDK internals
```

`vitest.config.ts` defines two **projects**: `unit` (`tests/**/*.spec.ts` minus `tests/integration/**`, network-free) and `integration` (`tests/integration/**`, needs `.env`).

| Script                          | What it runs                          | Needs network? |
| ------------------------------- | ------------------------------------- | -------------- |
| `pnpm test:typecheck`           | `tsc -p ./tests`                      | No             |
| `pnpm test:no-console`          | Just the no-console gate              | No             |
| `pnpm test:unit`                | All `unit`-project specs              | **No**         |
| `pnpm test:query`               | Indexer/RPC query test (integration)  | Yes            |
| `pnpm test:integration`         | Mainnet dry-run tests                 | Yes            |
| `pnpm test`                     | `test:typecheck` + all tests          | Yes            |
| CI (`.github/workflows/ci.yml`) | typecheck → no-console → unit → build | No             |

Integration tests need a `.env` with `SECRET_KEY` (see `.env.example`). They use `inspectTxn` / `devInspectTxn` (dry-run, no broadcast); only tests that explicitly call `signAndSendTxn` submit transactions. Unit specs must stay self-contained (build their own fakes) — never import `scallopSdk.ts`.

---

## 10. Adding new code — where does it go?

| You're adding…                           | Put it in…                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------- |
| A new normal (Move-call) method          | `src/txBuilders/<domain>/moveCalls.ts` + register in `manifest.ts` & `modules.ts`                 |
| A new quick (orchestration) method       | `src/txBuilders/<domain>/quick.ts` + register in `manifest.ts` & `modules.ts`                     |
| A new read (indexer/API or RPC)          | `src/repositories/<domain>/helpers.ts` (+ `types.ts`/`utils.ts`), expose a method on `index.ts`   |
| A new read domain                        | A new `src/repositories/<domain>/` folder + wire it in `repositories/wiring/registry.ts`          |
| A new piece of write-side business logic | `src/services/client/<Name>Service.ts`                                                            |
| Cross-domain read assembly               | `ScallopQuery` or `src/services/query/`                                                           |
| A pure data-shape transform              | The domain's `repositories/<domain>/utils.ts` (or `src/mappers/` for shared gRPC/JSON-RPC shapes) |
| A new RPC/indexer error case             | Throw a typed `Scallop*Error` from `src/errors/` via `logError(...)`                              |
| A new public type                        | `src/types/public/` (semver-governed)                                                             |
| A new internal DTO                       | `src/types/internal/`                                                                             |
| A new entry-point                        | Add to `tsup.config.ts` + `package.json` `exports` + smoke test in `tests/subpathExports.spec.ts` |

Then run `pnpm run test:typecheck && pnpm run test:unit && pnpm run build` before committing.

---

## 11. Further reading

- [`V3_TO_V4.md`](V3_TO_V4.md) — upgrade guide with step-by-step v3 → v4 diffs
- [`V2_TO_V4.md`](V2_TO_V4.md) — upgrade guide with step-by-step v2 → v4 diffs
- [`../CHANGELOG.md`](../CHANGELOG.md) — v4.0.0 BREAKING CHANGES + Added sections
- [`../.claude/CLAUDE.md`](../.claude/CLAUDE.md) — coding conventions for AI assistants
- `node_modules/@mysten/*/docs/llms-index.md` — Sui SDK reference (read indexes first)
