# SDK Structure

A guided tour of how `@scallop-io/sui-scallop-sdk` is laid out. Read this first if you're new to the codebase or returning after a long break.

> **Audience:** SDK contributors and integrators who want to understand the moving parts without reading every file.
> **Companion docs:** [`SDK_STRUCTURE_REPORT.md`](SDK_STRUCTURE_REPORT.md) (problem statement) and [`SDK_STRUCTURE_FIX_PLAN.md`](SDK_STRUCTURE_FIX_PLAN.md) (workstreams + status).

---

## 1. The 30-second mental model

The SDK has a stable public facade over a still-evolving internal split. Think in two paths:

```text
Write path:
ScallopClient method
  -> client service
  -> ScallopBuilder / ScallopTxBlock
  -> ScallopSuiKit
  -> Sui transaction

Read path:
ScallopQuery method
  -> read service
  -> repository or lower-level query function
  -> mapper / parser
  -> typed return value
```

Supporting pieces:

- `ScallopConstants` owns protocol config: addresses, pool addresses, whitelist, decimals.
- `ScallopAddress` is the address/HTTP adapter composed by `ScallopConstants`.
- `ScallopIndexer` is the REST/indexer adapter.
- `ScallopSuiKit` is the Sui client adapter.
- `src/mappers/` is the transport boundary for Move JSON, JSON-RPC, and gRPC shape differences.
- `src/services/portfolioCalculations.ts` holds pure math extracted from portfolio queries.
- `src/errors/`, `src/logger/`, `src/types/public`, and `src/types/internal` are cross-cutting support layers.

Important caveat: this is not a pure clean architecture yet. Some legacy query files still do orchestration, parsing, and calculation together. The current direction is facade -> service -> repository/adapter -> mapper, while keeping old public imports and method signatures working.

---

## 2. The public facade

These are the names you import. They form a dependency chain — each holds a reference to the next.

```
Scallop
  └── ScallopClient        // signs & sends transactions, high-level user actions
        └── ScallopBuilder // composes ScallopTxBlocks
              └── ScallopQuery  // reads protocol state
                    └── ScallopUtils  // type lookups, coin metadata, pyth, etc.
                          ├── ScallopConstants  // pool addresses, whitelist, decimals
                          │     └── ScallopAddress  // address registry + HTTP
                          ├── ScallopSuiKit      // wraps @scallop-io/sui-kit (Sui client)
                          └── ScallopIndexer     // Scallop REST indexer (axios)
```

**Init:** every model exposes `.init()`. You don't usually call it yourself — `Scallop.createScallopClient()` / `createScallopBuilder()` / `createScallopQuery()` handle it.

**Parent accessors:** each model exposes its dependencies as getters (`client.builder`, `builder.query`, `query.utils`, `utils.constants`, `constants.address`). This makes the chain navigable without re-instantiating anything.

> ⚠️ **v4 change:** `ScallopConstants` used to _extend_ `ScallopAddress`. As of v4 it **composes** it — reach the address adapter via `constants.address`. Most call sites are unaffected because `constants.get(...)`, `constants.getAddresses(...)`, etc. still work via forwarders.

---

## 3. Directory map

```
src/
├── index.ts                 # Public root barrel — what's re-exported defines the SDK API
├── models/                  # The facade classes (Scallop, ScallopClient, ScallopBuilder, ...)
│
├── builders/                # Transaction-block builders
│   ├── coreBuilder.ts       # supply, borrow, deposit collateral, ...
│   ├── spoolBuilder.ts      # stake / unstake spool
│   ├── borrowIncentiveBuilder.ts
│   ├── vescaBuilder.ts
│   ├── referralBuilder.ts
│   ├── sCoinBuilder.ts
│   ├── loyaltyProgramBuilder.ts
│   ├── oracles/             # pyth + xOracle price-feed builders
│   ├── manifest.ts          # ⭐ Per-module method manifest
│   ├── modules.ts           # ⭐ Per-domain module objects (tx.core, tx.spool, …)
│   ├── verify.ts            # Runtime collision / presence checker for ScallopTxBlock
│   └── index.ts             # newScallopTxBlock — Proxy that layers all builders
│
├── queries/                 # Lower-level read functions (called by services)
│   ├── coreQuery.ts         # market pools, collaterals, lendings
│   ├── borrowIncentiveQuery.ts
│   ├── borrowLimitQuery.ts
│   ├── supplyLimitQuery.ts
│   ├── isolatedAssetQuery.ts
│   ├── portfolioQuery.ts    # getUserPortfolio + getObligationAccount orchestration
│   ├── xOracleQuery.ts
│   ├── spoolQuery.ts
│   └── ... (vescaQuery, referralQuery, priceQuery, sCoinQuery, ...)
│
├── services/                # ⭐ Read-side business logic (extracted from ScallopQuery)
│   ├── MarketService.ts
│   ├── ObligationService.ts
│   ├── LendingReadService.ts
│   ├── SpoolReadService.ts
│   ├── BorrowIncentiveService.ts
│   ├── PriceService.ts
│   ├── portfolioCalculations.ts   # Pure-math helpers (TVL, risk, available borrow/withdraw)
│   └── client/              # Write-side business logic (extracted from ScallopClient)
│       ├── LendingService.ts        # supply / withdraw / flashLoan
│       ├── CollateralService.ts     # depositCollateral / withdrawCollateral
│       ├── BorrowService.ts         # openObligation / borrow / repay
│       ├── SpoolService.ts          # createStakeAccount / stake / unstake / claim
│       ├── VeScaService.ts          # stake/unstake obligation, claim unlocked SCA
│       ├── ReferralService.ts
│       └── types.ts                 # ClientServiceContext structural type
│
├── repositories/            # ⭐ Adapters: indexer-first / RPC-only data sources
│   ├── marketRepository.ts          # interface
│   ├── obligationRepository.ts      # interface
│   ├── indexerMarketRepository.ts   # Scallop indexer impl
│   ├── rpcMarketRepository.ts       # forced-RPC impl
│   ├── scallopQueryMarketRepository.ts      # ScallopQuery-backed (default)
│   └── scallopQueryObligationRepository.ts
│
├── mappers/                 # ⭐ Anti-corruption layer
│   ├── moveTypeMapper.ts            # Normalise gRPC vs JSON-RPC TypeName shapes
│   ├── obligationMapper.ts
│   ├── borrowIncentiveMapper.ts
│   ├── marketMapper.ts
│   └── spoolMapper.ts
│
├── config/                  # ⭐ Config-source composition
│   ├── ScallopConfig.ts             # loadScallopConfigSnapshot()
│   ├── ScallopConfigSnapshot.ts     # immutable snapshot type
│   ├── ConfigValidator.ts           # assertConfigSnapshot() (powers strictInit)
│   ├── AddressConfigSource.ts       # reads from ScallopAddress
│   ├── PoolAddressConfigSource.ts
│   └── WhitelistConfigSource.ts
│
├── context/                 # ⭐ ScallopContext — narrow structural type for services & tests
│
├── errors/                  # ⭐ Typed error hierarchy
│   ├── ScallopError.ts              # base
│   ├── ScallopRpcError.ts
│   ├── ScallopIndexerError.ts
│   ├── ScallopParseError.ts         # thrown by mappers
│   ├── ScallopConfigError.ts        # thrown by strictInit
│   └── ScallopTransactionBuildError.ts
│
├── logger/                  # ⭐ Logger abstraction (no console.* in internals)
│   ├── Logger.ts
│   ├── noopLogger.ts        # default
│   └── consoleLogger.ts     # opt-in
│
├── types/                   # ⭐ Public vs internal type boundary
│   ├── public/              # The semver-governed type surface
│   ├── internal/            # DTOs / transport types — NOT re-exported from root
│   ├── builder/, query/, constant/  # Canonical type defs (still here for now)
│   ├── address.ts, sui.ts, utils.ts
│   └── index.ts             # Delegates to ./public
│
├── utils/
│   ├── querySource.ts       # ⭐ runWithSourceFallback + resolveQuerySource
│   ├── core.ts              # parseObjectAs<T> (see gotcha in §7)
│   ├── url.ts, indexer.ts, query.ts, math.ts, ...
│
├── constants/               # queryKeys, API_BASE_URL, etc.
└── client/, query/, builder/  # Subpath-export entry points (re-export from above)
```

⭐ = layer added or formalised in **v4.0.0**.

---

## 4. The `ScallopTxBlock` — the Proxy-composed transaction block

`ScallopBuilder.createTxBlock()` returns a `ScallopTxBlock`. It looks like one object, but is actually multiple builder-objects layered through a `Proxy` in [src/builders/index.ts](../src/builders/index.ts):

```
coreTxBlock  ←  spoolTxBlock  ←  sCoinTxBlock  ←  referralTxBlock
            ←  borrowIncentiveTxBlock  ←  loyaltyTxBlock  ←  vescaTxBlock
```

Property lookup falls through from outermost (core) to innermost (vesca). All domain methods (`tx.supplyQuick`, `tx.stake`, `tx.borrowQuick`, `tx.lockSca`, `tx.bindToReferral`, …) live on the single returned object.

**Two flavours per Move call:**

- `GenerateCoreNormalMethod` — thin wrappers around Move calls. Synchronous. Returns a `TransactionResult`.
- `GenerateCoreQuickMethod` — async helpers that auto-fetch coins/obligations, call the normal method, transfer leftovers back to the sender.

**v4 added an explicit module view.** Alongside the flat methods, `tx.core`, `tx.spool`, `tx.vesca`, `tx.borrowIncentive`, `tx.referral`, `tx.loyalty`, `tx.scoin` expose the same functions grouped by domain. Function references match exactly (`tx.supplyQuick === tx.core.supplyQuick`). The grouping is non-breaking — flat methods still work and the deprecation will come in a later major.

**Naming convention for lending:** `supply` / `supplyQuick` / `depositCollateral` / `depositCollateralQuick` are canonical (Aave/Compound aligned). The legacy `deposit` / `depositQuick` / `addCollateral` / `addCollateralQuick` are `@deprecated`.

---

## 5. Read path: how `getMarketPools()` flows

```
ScallopQuery.getMarketPools()
       │  (1-line delegation in v4)
       ▼
MarketService.getMarketPools()
       │  decides source (indexer-first w/ RPC fallback)
       ▼
runWithSourceFallback()  ←  src/utils/querySource.ts
       │  ├── primary  → IndexerMarketRepository.getMarketPools()
       │  │                       │
       │  │                       ▼
       │  │              ScallopIndexer (axios)  → /pools
       │  │                       │
       │  │                       ▼
       │  │              marketMapper.parsePools()
      │  └── fallback → RpcMarketRepository.getMarketPools()
       │                          │
       │                          ▼
       │                 ScallopSuiKit (sui-kit)  → on-chain reads
       │                          │
       │                          ▼
       │                 marketMapper.parsePools()
       ▼
returns typed MarketPool[]
```

If the indexer fails, fallback runs and the failure is logged via the injected `Logger` (default: `noopLogger`). Callers see no difference in shape.

---

## 6. Write path: how `client.supply()` flows

```
ScallopClient.supply(amount, coinName, ...)
       │  (1-line delegation in v4)
       ▼
LendingService.supply({ client, builder, query, ... })   // ClientServiceContext
       │
       ▼
ScallopBuilder.createTxBlock()
       │
       ▼
coreTxBlock.supplyQuick(...)   // GenerateCoreQuickMethod
       │  auto-resolves coin objects, builds Move call
       ▼
ScallopSuiKit.signAndSendTxn(txBlock)
       ▼
returns SuiTransactionBlockResponse
```

Services accept a **structural** `ClientServiceContext` (see `src/services/client/types.ts`) — not the full `ScallopClient`. This is what makes them unit-testable without standing up a real Sui client.

---

## 7. Cross-cutting concerns

### Errors

New architecture-layer failures throw a subclass of `ScallopError`; some
legacy builder/query/util paths still throw plain `Error` and are tracked as
follow-up cleanup:

| Class                          | When it fires                                               |
| ------------------------------ | ----------------------------------------------------------- |
| `ScallopRpcError`              | Sui RPC / gRPC failure                                      |
| `ScallopIndexerError`          | Scallop indexer HTTP failure                                |
| `ScallopParseError`            | A mapper rejected a payload shape                           |
| `ScallopConfigError`           | `strictInit: true` and required addresses/whitelist missing |
| `ScallopTransactionBuildError` | A tx-builder couldn't construct a Move call                 |

Each carries `cause`, `context`, and structured fields so callers can branch on type instead of string-matching.

### Logging

Pass `{ logger }` to `Scallop`, `ScallopClient`, `ScallopQuery`, `ScallopUtils`, `ScallopAddress`, or `ScallopConstants`. The SDK never calls `console.*` internally (gated by `test/noConsole.spec.ts`). Default is `noopLogger` — silent. Use `consoleLogger` to opt in.

### Config + strictInit

```ts
const constants = new ScallopConstants({ strictInit: true });
await constants.init();
// throws ScallopConfigError if required core addresses or whitelist sets are missing
```

The validation lives in `src/config/ConfigValidator.ts` and runs through the `AddressConfigSource` / `PoolAddressConfigSource` / `WhitelistConfigSource` boundaries.

### `parseObjectAs<T>` gotcha

`src/utils/core.ts:parseObjectAs` unwraps Move object JSON. **When the on-chain JSON has a `value` field, it returns `fields.value` directly (not `{ value: ... }`).** Zod schemas consuming `parseObjectAs` output must match the unwrapped type, not the wrapper. This is the #1 source of "why is my parser empty" confusion.

### Query caching

`ScallopQuery` uses `@tanstack/query-core`'s `QueryClient` for on-chain data. Cache keys are centralised in `src/constants/queryKeys.ts`.

---

## 8. Subpath exports

Consumers can import slim slices instead of the full barrel:

| Subpath                               | Use for                                             |
| ------------------------------------- | --------------------------------------------------- |
| `@scallop-io/sui-scallop-sdk`         | Default — everything (heaviest)                     |
| `@scallop-io/sui-scallop-sdk/client`  | Just `ScallopClient` + minimum deps                 |
| `@scallop-io/sui-scallop-sdk/query`   | Just `ScallopQuery` + minimum deps                  |
| `@scallop-io/sui-scallop-sdk/builder` | Just `ScallopBuilder` + minimum deps                |
| `@scallop-io/sui-scallop-sdk/errors`  | Typed error classes                                 |
| `@scallop-io/sui-scallop-sdk/logger`  | `Logger` interface, `noopLogger`, `consoleLogger`   |
| `@scallop-io/sui-scallop-sdk/config`  | `ScallopConfigSnapshot`, validators, config sources |
| `@scallop-io/sui-scallop-sdk/context` | `ScallopContext`                                    |
| `@scallop-io/sui-scallop-sdk/mappers` | Pure mapping functions                              |
| `@scallop-io/sui-scallop-sdk/types`   | Type-only import (no runtime)                       |

Each subpath ships ESM + CJS + matching `.d.ts` / `.d.cts`.

---

## 9. Testing layout

```
test/
├── *.spec.ts                # ~21 unit specs, all network-free, <2s total
├── scallopSdk.ts            # Shared test SDK setup (forced-address overrides)
└── noConsole.spec.ts        # CI gate: blocks new console.* in SDK internals
```

| Script                          | What it runs                          | Needs network? |
| ------------------------------- | ------------------------------------- | -------------- |
| `pnpm test:typecheck`           | `tsc -p ./test`                       | No             |
| `pnpm test:no-console`          | Just the no-console gate              | No             |
| `pnpm test:unit`                | 21 spec files, 152 tests              | **No**         |
| `pnpm test:query`               | Indexer/RPC query tests               | Yes            |
| `pnpm test:integration`         | Mainnet dry-run tests                 | Yes            |
| `pnpm test`                     | `test:typecheck && test:all`          | Yes            |
| CI (`.github/workflows/ci.yml`) | typecheck → no-console → unit → build | No             |

Integration tests need a `.env` with `SECRET_KEY` (see `.env.example`). They use `inspectTxn` / `devInspectTxn` (dry-run, no broadcast); only tests that explicitly call `signAndSendTxn` submit transactions.

---

## 10. Adding new code — where does it go?

| You're adding…                           | Put it in…                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| A new Move-call wrapper                  | `src/builders/<domain>Builder.ts` + register in `manifest.ts` & `modules.ts`                     |
| A new read endpoint (indexer or RPC)     | `src/queries/<domain>Query.ts`, then expose via a service                                        |
| A new piece of read-side business logic  | `src/services/<Name>Service.ts`                                                                  |
| A new piece of write-side business logic | `src/services/client/<Name>Service.ts`                                                           |
| A pure data-shape transform              | `src/mappers/<domain>Mapper.ts`                                                                  |
| A new RPC/indexer error case             | Throw a typed `Scallop*Error` from `src/errors/`                                                 |
| A new public type                        | `src/types/public/` (semver-governed)                                                            |
| A new internal DTO                       | `src/types/internal/`                                                                            |
| A new entry-point                        | Add to `tsup.config.ts` + `package.json` `exports` + smoke test in `test/subpathExports.spec.ts` |

Then run `pnpm run test:typecheck && pnpm run test:unit && pnpm run build` before committing.

---

## 11. Further reading

- [`SDK_STRUCTURE_REPORT.md`](SDK_STRUCTURE_REPORT.md) — original problem statement
- [`SDK_STRUCTURE_FIX_PLAN.md`](SDK_STRUCTURE_FIX_PLAN.md) — workstreams, execution status, remaining items
- [`../CHANGELOG.md`](../CHANGELOG.md) — v4.0.0 BREAKING CHANGES + Added sections
- [`../.claude/CLAUDE.md`](../.claude/CLAUDE.md) — coding conventions for AI assistants
- `node_modules/@mysten/*/docs/llms-index.md` — Sui SDK reference (read indexes first)
