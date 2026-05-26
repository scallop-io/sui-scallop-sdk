# SDK Structure Report

## Executive Summary

The SDK is usable and has real domain knowledge encoded in it. The public entry points are understandable, domain areas are mostly separated by file, and the builder/query split is directionally correct.

Honest opinion: the SDK structure is functional but over-coupled. It looks like it grew from practical needs rather than from a stable architecture. The main risks are hidden dependencies, runtime composition via `Proxy`, weak boundaries between transport/parsing/business logic, and too many large classes/functions doing orchestration plus domain work plus compatibility work.

Best target architecture: keep the current public Facade API for compatibility, but internally move toward explicit modules, typed adapters, repositories, mappers, and use-case services.

## Current Shape

Main dependency chain:

```text
Scallop
  -> ScallopClient
      -> ScallopBuilder
          -> ScallopQuery
              -> ScallopUtils
                  -> ScallopConstants
                      -> ScallopAddress
                          -> ScallopAxios
                              -> ScallopQueryClient
                  -> ScallopSuiKit
                  -> ScallopIndexer
```

Main folders:

- `src/models`: high-level classes, transport wrappers, config, indexer, utilities.
- `src/builders`: transaction-block method generators by domain.
- `src/queries`: domain query functions.
- `src/types`: public/query/builder type definitions.
- `src/utils`: shared parsing, object helpers, indexer fallback, builder helpers.
- `src/constants`: static constants and query keys.

Largest files:

- `src/models/scallopClient.ts`: 1273 lines.
- `src/queries/coreQuery.ts`: 1174 lines.
- `src/queries/portfolioQuery.ts`: 1155 lines.
- `src/models/scallopQuery.ts`: 974 lines.
- `src/models/scallopAddress.ts`: 841 lines.
- `src/models/scallopUtils.ts`: 734 lines.

That size alone is not fatal, but it signals low cohesion and high change risk.

## What Is Already Correct

### Clear Public Facade

`Scallop` as a top-level Facade is good. Users can create `ScallopClient`, `ScallopBuilder`, `ScallopQuery`, `ScallopUtils`, and constants from one object. This is appropriate for an SDK.

Pattern fit: Facade.

### Read/Write Split Exists

The SDK separates:

- query operations in `ScallopQuery` / `src/queries`
- transaction composition in `ScallopBuilder` / `src/builders`
- one-shot user workflows in `ScallopClient`

That is the right conceptual split. It keeps query-heavy and transaction-heavy workflows from being completely mixed.

Pattern fit: Application Service + Builder.

### Domain Modules Are Visible

Files like:

- `coreQuery.ts`
- `spoolQuery.ts`
- `vescaQuery.ts`
- `borrowIncentiveQuery.ts`
- `sCoinQuery.ts`
- `coreBuilder.ts`
- `spoolBuilder.ts`
- `vescaBuilder.ts`

make the domain boundaries visible. This is valuable. A new maintainer can roughly find the right area.

Pattern fit: coarse bounded contexts.

### QueryClient Caching Is A Good Choice

Using `@tanstack/query-core` for RPC/API caching is better than ad hoc maps. Cache keys are centralized in `queryKeys.ts`, which is good.

Pattern fit: cache-as-infrastructure.

### Transport Is Partly Adapter-Based

`ScallopSuiKit`, `ScallopAxios`, and `ScallopIndexer` are wrappers around external APIs. That is the right idea: keep Mysten, SuiKit, axios, and indexer details away from domain code.

Pattern fit: Adapter.

### Dependency Injection Exists

Most constructors accept existing instances or params:

- `client`
- `builder`
- `query`
- `utils`
- `scallopSuiKit`
- `scallopConstants`
- `indexer`
- `axiosInstance`
- `queryClient`

This is good for tests and composition. It needs tightening, but the direction is correct.

### Backward Compatibility Is Considered

Deprecated method aliases are marked, and `ScallopClient` still exposes older query methods. That is reasonable for an SDK with existing users.

## What Is Wrong

### 1. The Main Object Graph Is Too Coupled

The dependency chain is too deep and too implicit. `ScallopClient` depends on `ScallopBuilder`, which depends on `ScallopQuery`, which depends on `ScallopUtils`, which owns constants, Sui client, indexer, cache, and HTTP behavior.

This creates a service-locator feel:

```ts
client.builder.query.utils.scallopSuiKit.queryClient;
```

Problems:

- hard to instantiate only one subsystem cleanly
- hard to test one layer without constructing many others
- changes in constants/network/cache ripple upward
- domain logic reaches through many getters to find dependencies

Best-practice issue: violates Dependency Inversion and Single Responsibility.

Better: compose a `ScallopContext` or dependency container once, then pass small interfaces to modules.

### 2. Inheritance Is Used Where Composition Would Be Safer

`ScallopConstants extends ScallopAddress extends ScallopAxios extends ScallopQueryClient`.

This mixes unrelated concerns:

- constants derivation
- address registry
- HTTP client
- cache owner

Inheritance here is convenience inheritance, not true "is-a" modeling. A constants object is not an address reader, and an address reader is not an axios client.

Best-practice issue: inheritance abuse, Liskov/substitutability not meaningful.

Better:

```text
ScallopConfigService
  has AddressConfigSource
  has PoolAddressConfigSource
  has WhitelistConfigSource
  has Cache
```

Pattern fit: Repository + Composition.

### 3. Runtime `Proxy` Composition Is Clever But Risky

`newScallopTxBlock()` builds tx-block layers and returns a `Proxy` that manually searches multiple tx-block objects.

This works, but it has real costs:

- property resolution is runtime-only
- method conflicts depend on lookup order
- refactors can silently change behavior
- stack traces/debugging are harder
- TypeScript intersection type can claim methods exist even if runtime proxy lookup fails
- tree-shaking and static analysis become weaker

Best-practice issue: dynamic composition hides contracts.

Better options:

- explicit `ScallopTxBlock` class with domain modules as fields: `tx.core.supply()`, `tx.spool.stake()`
- mixin factory with collision checks
- plugin registry that validates unique method names at construction
- generated typed composite from module descriptors

If preserving flat `txBlock.supplyQuick()` API, add a collision detector and a unit test that asserts every declared method is present at runtime.

Pattern fit today: Proxy/Decorator hybrid.
Preferred pattern: explicit Composite or validated Mixin.

### 4. `ScallopClient` Is Too Large And Duplicates Responsibilities

`ScallopClient` is both:

- backward-compatible Facade
- high-level workflow orchestrator
- signer/sender
- transaction builder caller
- query delegator

At 1273 lines, it is doing too much. Deprecated query methods also keep old API surface mixed with new API surface.

Best-practice issue: God object / low cohesion.

Better:

- keep `ScallopClient` as a thin public facade
- move workflows to services:
  - `LendingService`
  - `CollateralService`
  - `BorrowService`
  - `SpoolService`
  - `VeScaService`
  - `ReferralService`
- expose them through `client.lending.supply(...)`, while preserving old methods as thin adapters

Pattern fit: Facade over Application Services.

### 5. Query Logic Mixes Too Many Layers

Query functions often combine:

- RPC/indexer fetching
- dynamic field lookup
- inspect transaction simulation
- parsing raw Move JSON
- price fetching
- BigNumber calculations
- portfolio aggregation
- presentation shape assembly

Example hotspots: `coreQuery.ts`, `portfolioQuery.ts`, `spoolQuery.ts`, `borrowIncentiveQuery.ts`.

This makes bugs like JSON-RPC/gRPC shape drift likely. The recent `pool_type.name` issue is a symptom: raw transport shape leaked into business parsers.

Best-practice issue: no clean separation between data access, mapping, and domain calculation.

Better split:

```text
repositories/
  MarketRepository
  ObligationRepository
  SpoolRepository
  OracleRepository

mappers/
  MarketMapper
  ObligationMapper
  BorrowIncentiveMapper
  MoveTypeMapper

services/
  PortfolioService
  MarketService
  PriceService
```

Pattern fit: Repository + Mapper + Application Service.

### 6. Indexer Fallback Is Brittle

`withIndexerFallback()` monkey-patches instance methods and assumes "last argument is object with `indexer`".

Problems:

- uses `Function`, `any`, and `@ts-ignore`
- hidden behavior at construction time
- argument-position convention can break silently
- method wrapping obscures stack traces
- all fallback rules are same, even when domain methods may need different behavior

Best-practice issue: implicit AOP without type safety.

Better:

```ts
withFallback({
  primary: () => indexerRepo.getMarket(),
  fallback: () => rpcRepo.getMarket(),
  policy: marketFallbackPolicy,
});
```

Or make source explicit:

```ts
query.getMarketPools({ source: 'indexer-first' });
query.getMarketPools({ source: 'rpc' });
```

Pattern fit today: untyped Decorator/AOP.
Preferred pattern: Strategy + Repository.

### 7. Types Are Public, But Runtime Data Is Under-validated

There are many casts:

- `as any`
- `as unknown as`
- raw event `parsedJson`
- object JSON parsed by shape assumptions
- `Record<string, any>`

This is especially risky because Sui JSON differs across JSON-RPC, gRPC, and GraphQL. The SDK already needed `parseMoveTypeName()` to normalize one such difference.

Best-practice issue: TypeScript types are used as assertions, not contracts.

Better:

- define transport DTOs separately from domain types
- validate raw DTOs with Zod or small custom decoders
- centralize Move JSON normalization
- parse BCS when reliable JSON shape is unavailable
- never let raw RPC JSON reach portfolio/business calculations

Pattern fit: Anti-corruption Layer.

### 8. Error Handling Is Not SDK-Grade Yet

There are many `console.error`, `console.warn`, swallowed catches, and generic errors.

Problems:

- SDK consumers cannot control logging
- errors lose context and type
- fallback can hide broken state
- ignored errors make debugging hard

Best-practice issue: infrastructure behavior leaks into user console; no typed error taxonomy.

Better:

- typed errors:
  - `ScallopRpcError`
  - `ScallopIndexerError`
  - `ScallopConfigError`
  - `ScallopParseError`
  - `ScallopTransactionBuildError`
- optional logger interface:
  - `silent`
  - `console`
  - custom logger
- structured error causes
- no direct console output in library code by default

### 9. Config And Constants Are Mutable Global-Like State

`ScallopConstants` mutates many public maps during `initConstants()`. Missing values often become `''`, `undefined`, or empty sets via proxies.

Problems:

- missing required config can become a later transaction failure
- runtime state changes are hard to reason about
- proxies hide absence
- public mutable maps can be modified by consumers

Best-practice issue: mutable shared configuration.

Better:

- load config into immutable snapshot:
  - `Readonly<ScallopConfig>`
  - `ReadonlyMap`
  - `ReadonlySet`
- validate required fields during init
- fail fast for missing protocol-critical addresses
- expose explicit optional APIs for optional features

Pattern fit: Configuration Object.

### 10. `utils` Is A Grab Bag

`ScallopUtils` handles:

- naming/type conversion
- coin selection
- Pyth price fetching
- object parsing
- obligation helper queries
- merge coin helpers
- constants access

This is convenient but not cohesive. It encourages every module to depend on `utils`, which becomes an implicit god dependency.

Best-practice issue: low cohesion.

Better split:

- `CoinTypeRegistry`
- `CoinSelector`
- `PriceOracleClient`
- `ObligationHelper`
- `MoveJsonParser`
- `TxCoinHelper`

Then expose a compatibility `utils` facade if needed.

### 11. API Surface Is Flat And Wide

Everything is re-exported from `src/index.ts`, and `package.json` exposes only `"."`.

Problems:

- poor tree-shaking boundaries
- internal types/helpers become public accidentally
- hard to version internals separately
- consumers cannot import stable submodules

Better:

```json
{
  "exports": {
    ".": "...",
    "./query": "...",
    "./builder": "...",
    "./types": "...",
    "./adapters/sui": "..."
  }
}
```

Keep root export for compatibility, but define intentional subpath exports.

### 12. Tests Are Too Integration-Heavy

The query test suite hits mainnet, Pyth, and indexer. That is valuable for smoke coverage, but not enough for architecture safety.

Problems:

- slow/flaky in restricted networks
- failures often indicate network/indexer shape changes, not code bugs
- hard to test parser edge cases deterministically
- unit coverage for mapping/business calculations is thin

Better:

- keep mainnet tests as `integration`
- add fixture-based mapper tests for JSON-RPC/gRPC shapes
- add contract tests for public facade behavior
- add method-presence/collision tests for tx-block composition
- add no-console/no-swallowing behavior tests

## Design Pattern Assessment

### Facade

Used well at top level (`Scallop`) and partially in `ScallopClient`.

Problem: `ScallopClient` became too thick. Facade should delegate, not contain most orchestration itself.

### Builder

Conceptually right for transaction composition.

Problem: builder is mixed with coin selection, wallet state, oracle updates, and runtime proxy composition. Better as explicit command builders plus services that orchestrate them.

### Adapter

Present in `ScallopSuiKit`, `ScallopAxios`, `ScallopIndexer`.

Problem: adapters leak raw transport shapes into domain code. Need anti-corruption mappers.

### Repository

Only partially present. `ScallopIndexer` acts like a repository, but RPC queries are free functions and not modeled as repositories.

Missing: interface-based repositories for market, obligation, pool, oracle, price, config.

### Strategy

Needed but underused. Indexer-vs-RPC fallback, oracle selection, price source selection, and transaction submit mode should be explicit strategies.

Current fallback wrapping is too implicit.

### Decorator / Proxy

Used heavily for tx-block composition and default-returning config proxies.

Problem: powerful but opaque. Use sparingly; validate aggressively when kept.

### Mapper / Anti-Corruption Layer

Needed urgently. Current raw RPC/indexer shapes leak through many layers.

`parseMoveTypeName()` is a good first step, but the pattern should be generalized.

## Recommended Target Architecture

Suggested internal structure:

```text
src/
  public/
    scallop.ts
    scallopClient.ts

  context/
    ScallopContext.ts
    ScallopConfig.ts

  adapters/
    sui/
      SuiRpcAdapter.ts
      SuiTransactionAdapter.ts
    indexer/
      ScallopIndexerAdapter.ts
    oracle/
      PythAdapter.ts

  repositories/
    MarketRepository.ts
    ObligationRepository.ts
    SpoolRepository.ts
    BorrowIncentiveRepository.ts
    ConfigRepository.ts

  mappers/
    MoveTypeMapper.ts
    MarketMapper.ts
    ObligationMapper.ts
    BorrowIncentiveMapper.ts
    SuiObjectMapper.ts

  services/
    MarketService.ts
    PortfolioService.ts
    LendingService.ts
    BorrowService.ts
    SpoolService.ts
    VeScaService.ts
    PriceService.ts

  transactions/
    ScallopTxBlock.ts
    modules/
      CoreTxModule.ts
      SpoolTxModule.ts
      VeScaTxModule.ts

  types/
    public/
    internal/
```

Public API can remain mostly unchanged:

```ts
const sdk = new Scallop(params);
const query = await sdk.createScallopQuery();
const builder = await sdk.createScallopBuilder();
```

Internally, `ScallopQuery` becomes a facade over services, not a huge method host.

## Practical Refactor Roadmap

### Phase 1: Safety Without Breaking API

1. Add parser/mapping layer for all inspect event payloads.
2. Add fixture tests for JSON-RPC and gRPC payload variants.
3. Add tx-block method collision/runtime-presence tests.
4. Replace direct `console.*` with injectable logger.
5. Replace `withIndexerFallback()` monkey-patching with explicit helper calls in each method.
6. Add strict ESLint rule against new `any` except approved adapter boundaries.

Low API risk, high stability gain.

### Phase 2: Reduce Coupling

1. Introduce `ScallopContext` holding:
   - config snapshot
   - Sui adapter
   - indexer adapter
   - query client/cache
   - logger
2. Make `ScallopUtils` a compatibility facade over smaller services.
3. Move `ScallopConstants` away from inheritance into composed config repositories.
4. Split `ScallopClient` workflows into domain services.

Medium internal churn, public API can stay stable.

### Phase 3: Make Modules Explicit

1. Replace tx-block `Proxy` chain with explicit module composition.
2. Add typed subpath exports.
3. Move deprecated methods into compatibility layer.
4. Separate `integration` and `unit` test commands.

Higher churn, but best long-term maintainability.

## Priority Issues

### High

- Raw transport data leaks into business logic.
- `Proxy` tx-block composition can hide method collisions.
- `ScallopClient`, `ScallopQuery`, `coreQuery`, `portfolioQuery` are too large.
- Indexer fallback is untyped and convention-based.
- Direct console logging and swallowed errors weaken SDK consumer control.

### Medium

- Inheritance chain mixes cache/http/address/constants.
- `utils` is too broad.
- Public exports are too broad and not intentional enough.
- Mutable constants/config can hide missing required fields.
- Too many `any` and casts in core paths.

### Low

- `.DS_Store` files exist under `src`.
- Some comments are stale or compatibility-focused.
- Some naming still reflects deprecated concepts.

## Opinionated Verdict

The SDK is not badly designed; it is under-structured for how much domain behavior it now owns.

The strongest parts are the visible domain modules, top-level facade, query/builder conceptual split, caching choice, and willingness to preserve compatibility.

The weakest parts are hidden coupling and raw data leakage. Most bugs in this kind of SDK will not come from single bad functions; they will come from external shape changes, fallback behavior, and one layer assuming too much about another layer.

Recommended north star:

```text
Public API: stable facade.
Internal architecture: adapters -> repositories -> mappers -> services -> facade.
Transaction API: explicit composite, no unvalidated runtime magic.
```

Do that incrementally, not as one rewrite. The current code can support migration if new boundaries are introduced alongside existing facades.
