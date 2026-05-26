# SDK Structure Fix Plan

## Goal

Fix the structural issues identified in `docs/SDK_STRUCTURE_REPORT.md` without breaking the public SDK API.

Primary objective:

```text
Keep public facade stable.
Move internals toward adapters -> repositories -> mappers -> services -> facade.
Reduce hidden runtime behavior.
Improve parser safety and testability.
```

## Non-Goals

- No full rewrite.
- No immediate removal of deprecated public methods.
- No behavior change to current root imports.
- No forced migration for existing SDK users.
- No large transaction API redesign until method-presence/collision tests exist.

## Success Criteria

- Existing public API remains source-compatible.
- `pnpm run build` passes.
- `pnpm run test test/query` passes.
- New mapper/unit tests cover JSON-RPC and gRPC payload variants.
- No new direct `console.*` in SDK internals except via approved logger.
- No new `any` outside adapter/migration boundary files.
- Tx-block runtime methods match declared TypeScript types.

## Execution Status

Completed in earlier passes:

- Workstream 1: mapper/anti-corruption layer for Move type payloads.
- Workstream 2 (initial slice): explicit source strategy on `getTvl`.
- Workstream 3 (initial slice): `Logger` interface + noop/console loggers under `src/logger/`; typed `ScallopError` / `ScallopRpcError` / `ScallopIndexerError` / `ScallopParseError` / `ScallopConfigError` / `ScallopTransactionBuildError` under `src/errors/`. `ScallopUtils` accepts a `logger` param (defaults to `noopLogger`). `runWithSourceFallback` routes fallback warnings through the injected logger. Mappers throw `ScallopParseError` on invalid payloads.
- Workstream 2 (market/spool/lendings slice): `queryMarket`, `getMarketPools`, `getMarketCollaterals`, `getMarketCollateral`, `getSpools`, `getLendings`, `getLending` migrated to explicit `runWithSourceFallback`.
- Workstream 4 (additive): `ScallopContext` + `createScallopContext` under `src/context/`. Exposed via `Scallop.getContext()` for tests/internal services.
- Workstream 6 phase 1: per-module tx-block manifest under `src/builders/manifest.ts`, runtime collision/presence verifier in `src/builders/verify.ts`, unit tests in `test/txBlockManifest.spec.ts`.

Completed in earlier passes:

- Workstream 2 (full fallback migration): all 14 previously monkey-patched methods migrated to `runWithSourceFallback`. `ScallopQuery.initIndexerFallback()` reduced to an empty deprecated stub.
- Workstream 3 (logger pass complete for non-legacy paths): no remaining `console.*` calls in SDK internals outside `src/logger/consoleLogger.ts`, `src/utils/indexer.ts` (legacy helper), and `src/utils/object.ts` (commented-out line). `ScallopAddress`/`ScallopConstants` accept a `logger` param.
- Workstream 5 (additive initial slice + strict-init): `ScallopConfigSnapshot` + `ConfigValidator` under `src/config/`. `ScallopConstants` gains optional `strictInit` flag wiring `assertConfigSnapshot` at the tail of `init()`.
- Workstream 6 Phase 2 (explicit composite tx-block API): per-domain `CoreModule` / `SpoolModule` / `BorrowIncentiveModule` / `VeScaModule` / `ReferralModule` / `LoyaltyModule` / `SCoinModule`; `ScallopTxBlock` widened with `ScallopTxBlockModules`; `newScallopTxBlock` layers a second proxy exposing `tx.core` / `tx.spool` / `tx.vesca` / …. Flat methods unchanged; module-view fn references === flat-method fn references.
- Workstream 8 (initial slice): multi-entry tsup build + `package.json` subpath exports (`./errors`, `./logger`, `./config`, `./context`, `./mappers`). Smoke tests verify each entry resolves.

Completed in earlier passes:

- Workstream 9 (test split): added `vitest.config.ts` (path alias `src/` → `./src`, default 60 s timeout). `package.json` split into `test:unit` (network-free) / `test:integration` (mainnet) / `test:all` / `test`. Pre-existing assertion typo in `test/utils-unit.spec.ts` fixed.

Completed in current pass:

- Workstream 8 (public/internal types split): added `src/types/public/index.ts` as the explicit stable type surface — re-exports the existing six type files (`sui`, `builder/`, `constant/`, `query/`, `address`, `utils`). Documented as the only barrel governed by semver. `src/types/index.ts` now delegates to it via a single `export type * from './public/index.js'`, preserving every previously-reachable name from the root barrel for back-compat. `src/types/internal/` remains the home for non-public DTO/transport types (`MoveTypeName`, `TypeNameField`) — not re-exported from the public surface. `tsup.config.ts` and `package.json` `exports` gain a `./types` subpath pointing at `dist/types.{js,cjs,d.ts,d.cts}` so consumers that want only types can avoid pulling the full runtime barrel. `test/subpathExports.spec.ts` extended with two loadability checks: `src/types/public/index.js` and `src/types/internal/index.js` both resolve independently.
- Workstream 7 (initial slice): added `src/services/portfolioCalculations.ts` and moved the pure TVL aggregation out of `portfolioQuery.ts`; added internal market/obligation repository interfaces plus ScallopQuery-backed adapters under `src/repositories/`. Existing `ScallopQuery` public methods remain the compatibility facade.
- Workstream 9 (no-console/test command slice): added deterministic no-console gate in `test/noConsole.spec.ts`; added `test:no-console` and `test:query` scripts; expanded `test:unit` with repository + portfolio calculation tests.
- Workstream 5 (config source composition slice): added `AddressConfigSource`, `PoolAddressConfigSource`, `WhitelistConfigSource`, and `loadScallopConfigSnapshot()` so config snapshots can be composed/validated through config-source boundaries before the major-version constants inheritance refactor.
- Workstream 7 (repository concrete slice): added concrete market repository adapters for indexer-backed reads and forced-RPC reads. `MarketService` now routes both source branches through repositories.
- Workstream 8 (subpath completion slice): added `./client`, `./query`, and `./builder` package subpaths with build entries and import smoke tests.
- Workstream 7 (client service extraction slice): added `LendingService` and `CollateralService` under `src/services/client/`; `ScallopClient` now delegates `supply`, `withdraw`, `flashLoan`, `depositCollateral`, and `withdrawCollateral` while preserving public method signatures.

- Workstream 7 (full client-service extraction): added `BorrowService`, `SpoolService`, `VeScaService`, `ReferralService` under `src/services/client/`. `ScallopClient` constructor instantiates each one and now delegates `openObligation`, `borrow`, `repay`, `supplyAndStake`, `createStakeAccount`, `stake`, `unstake`, `unstakeAndWithdraw`, `claim`, `stakeObligation`, `unstakeObligation`, `claimBorrowIncentive`, and `claimAllUnlockedSca` to the appropriate service.

- Workstream 4 (service context boundary): added `ClientServiceContext` interface to `src/services/client/types.ts`. All six client-side services accept the structural context instead of `ScallopClient`.

- Workstream 7 (MarketService extraction + ScallopQuery facade slice): added `src/services/MarketService.ts`. `ScallopQuery.{queryMarket,getMarketPools,getMarketCollaterals,getMarketCollateral}` reduced to delegations through repository-backed service methods.

- Workstream 7 (ObligationService extraction + ScallopQuery facade slice): added `src/services/ObligationService.ts`. `ScallopQuery.{getObligations,queryObligation,getObligationAccounts,getObligationAccountsByIds,getObligationAccountById,getObligationAccount}` reduced to one-line delegations.

- Workstream 7 (SpoolReadService + BorrowIncentiveService extraction): added `src/services/SpoolReadService.ts` and `src/services/BorrowIncentiveService.ts`. `ScallopQuery.{getSpools,getSpool,getBorrowIncentivePools}` reduced to one-line delegations.

- Workstream 7 (LendingReadService extraction — completed ScallopQuery source-switch migration): `ScallopQuery.{getLendings,getLending}` reduced to one-line delegations.

- Workstream 7 (portfolio aggregation extraction): lifted the pure-math portion of `getUserPortfolio` into reusable helpers in `src/services/portfolioCalculations.ts`. `getUserPortfolio` reduced to thin orchestration.

- Workstream 7 (PriceService extraction): added `src/services/PriceService.ts`. `ScallopQuery.{getPriceFromPyth,getPricesFromPyth,getCoinPriceByIndexer,getCoinPricesByIndexer,getAllCoinPrices}` reduced to one-line delegations.

Completed in current pass:

- Workstream 8 (internal-DTO type boundary): added `src/types/internal/dto.ts` that re-exports the 21 `Origin*` / `Parsed*` / `Calculated*` DTO types from their current `src/types/query/{core,spool,borrowIncentive}.ts` locations. Internal callers retargeted to import DTOs through `src/types/internal/index.js`. Public-surface back-compat preserved verbatim.

- Workstream 9 (CI gate): added `.github/workflows/ci.yml` running `test:typecheck` → `test:no-console` → `test:unit` → `build` on `push` to `main` and every `pull_request`.

Completed in current pass:

- Workstream 7 (obligation-account math extraction): lifted the per-coin math inside `getObligationAccount` (~400 LOC of inline aggregation in `src/queries/portfolioQuery.ts`) into six pure helpers in `src/services/portfolioCalculations.ts`:
  - `buildObligationCollateralEntry({ assetCoinName, coinType, symbol, coinDecimal, coinPrice, coinAmount, marketCollateral, depositedRawAmount })` — returns the `ObligationCollateral` entry plus the three running-total contributions (`depositedValue`, `borrowCapacityValue`, `requiredCollateralValue`) and an `isDeposited` flag.
  - `buildBorrowIncentiveRewards({ borrowIncentivePool, borrowIncentiveAccount, toMarketCoinName })` — builds the per-pool `rewards` list (veSCA boost, base/boosted APR, point-index growth) and a `contributesRewardedPool` flag. The `toMarketCoinName` callback is injected so the helper stays pure (no dependency on `ScallopUtils`).
  - `buildObligationDebtEntry({ assetCoinName, coinType, symbol, coinDecimal, coinPrice, coinAmount, marketPool, debt, rewards })` — returns the `ObligationDebt` entry (borrow-index growth applied, weighted borrow value, filtered reward set) plus `borrowedValue` / `borrowedValueWithWeight` BigNumbers and an `isBorrowed` flag.
  - `calculateObligationSummary({ totalDepositedValue, totalBorrowedValue, totalBorrowCapacityValue, totalBorrowedValueWithWeight, totalRequiredCollateralValue })` — risk-level (capped at 1; bad-debt at 1 when collateral is 0 and debt > 0), account balance, available collateral, required collateral, unhealthy collateral.
  - `estimateAvailableWithdrawAmount({ obligationCollateral, marketCollateral, totalAvailableCollateralValue, totalBorrowedValueWithWeight })` — applies the cushion factor + caps to deposited / pool deposit amount.
  - `estimateAvailableBorrowAmount({ obligationDebt, marketPool, totalAvailableCollateralValue })` — applies the cushion factor on borrow amount + computes the overshoot-adjusted `requiredRepayAmount` / `requiredRepayCoin`.
    Each helper uses `Pick<>` over the real types where applicable so callers can pass real `ObligationCollateral` / `MarketPool` / etc. objects without manual reshaping. `getObligationAccount` is now thin orchestration: per-collateral / per-incentive-pool / per-debt loops call the matching helper, then `calculateObligationSummary` produces the totals, then the second pass calls the two estimator helpers. Public method signature and return shape preserved verbatim. File sizes: `portfolioQuery.ts` **974 → 746 LOC** (-23%); `portfolioCalculations.ts` 322 → 748 LOC. `test/portfolioCalculations.spec.ts` extended from 7 to 16 cases — every new helper covered, including the bad-debt risk-level path, no-debt withdraw fallback, and the overshoot-cushion direction on `requiredRepayAmount`.

Verification (current pass):

- `pnpm run test:typecheck` ✅
- `pnpm run test:unit` → 152/152 passed (21 spec files, ~1.3 s, no network).
- `pnpm run build` ✅ — multi-entry outputs unchanged.
- `pnpm run test test/query` ✅ — 57 passed, 2 skipped.

Still pending:

- ~~Make `ScallopConstants` a true composition over the new `AddressConfigSource` / `PoolAddressConfigSource` / `WhitelistConfigSource` boundaries — replaces the `extends ScallopAddress extends ScallopAxios` inheritance (major-version concern).~~ ✅ Done in v4.0.0: `ScallopConstants` now composes `address: ScallopAddress` instead of inheriting; `strictInit` validates through `AddressConfigSource` / `PoolAddressConfigSource` / `WhitelistConfigSource`; `whitelist`/`poolAddresses` are eagerly merged runtime-readonly snapshots (no more `Proxy`); `utils.address`/`query.address`/`builder.address`/`client.address` now return the real `ScallopAddress`. Forwarders preserve `constants.get/getAddresses/...` for back-compat.
- Workstream 8 (further): physically relocate the DTO type definitions into `src/types/internal/dto/`-prefixed files in a major version, with `src/types/query/*` becoming a back-compat re-export shim. Today the relocation is import-only; the canonical definitions still live in `src/types/query/*`.
- Workstream 7 (further): file-size budget still not met for `coreQuery.ts`, `ScallopClient`, `ScallopQuery`, `portfolioQuery.ts`, and `portfolioCalculations.ts`.
- Workstream 3 (further): legacy builders/query/util paths still throw plain `Error` in several places; new mappers/client services should use `ScallopError` subclasses.
- Workstream 9 (rest): remove the unused `withIndexerFallback`/`callMethodWithIndexerFallback` helper (and its now-fixed test) in a major version once no SDK code references it.
- Documentation: mark deprecated flat tx-block methods in TSDoc once the explicit composite API is announced.

## Workstreams

## 1. Mapping And Anti-Corruption Layer

Problem addressed:

- Raw RPC/indexer/Move JSON leaks into business logic.
- gRPC and JSON-RPC payload shape differences break parsers.
- Domain code uses casts instead of contracts.

### Target Shape

```text
src/mappers/
  moveTypeMapper.ts
  marketMapper.ts
  obligationMapper.ts
  borrowIncentiveMapper.ts
  spoolMapper.ts
  suiObjectMapper.ts

src/types/internal/
  transport/
  dto/
```

### Tasks

1. Move `parseMoveTypeName()` from `src/utils/query.ts` to `src/mappers/moveTypeMapper.ts`.
2. Add DTO types for raw inspect event payloads.
3. Add mapper functions:
   - `mapMarketEventToMarketData`
   - `mapObligationEventToObligationData`
   - `mapBorrowIncentivePoolsEvent`
   - `mapBorrowIncentiveAccountsEvent`
   - `mapSpoolEvent`
4. Replace direct `.type.name`, `.pool_type.name`, `.point_type.name` access in query files.
5. Add fixture tests for both payload styles:
   - JSON-RPC style: `{ type: { name: "0x..." } }`
   - gRPC style: `{ type: { name: { address, module, name } } }`
6. Add negative tests for malformed payloads.

### Acceptance

- No query/business file directly parses Move type-name object internals.
- Transport shape changes are isolated to mapper tests.
- Mapper errors include payload path and domain context.

## 2. Explicit Data Source Strategy

Problem addressed:

- `withIndexerFallback()` monkey-patches methods.
- Fallback depends on "last argument has indexer".
- Source selection is implicit and hard to test.

### Target Shape

```ts
type QuerySource = 'rpc' | 'indexer' | 'indexer-first';

type QueryOptions = {
  source?: QuerySource;
};
```

### Tasks

1. Add `QuerySource` type.
2. Add `runWithSourceFallback({ source, indexer, rpc, label })`.
3. Update one low-risk method first, for example `getTvl`.
4. Migrate market methods:
   - `getMarketPools`
   - `getMarketPool`
   - `getMarketCollaterals`
   - `getMarketCollateral`
5. Migrate portfolio methods after market methods are stable.
6. Remove `initIndexerFallback()` method wrapping after all wrapped methods are migrated.

### Acceptance

- No method monkey-patching in `ScallopQuery` constructor.
- Fallback behavior is local and typed.
- Existing `{ indexer: boolean }` calls still work through compatibility mapping.

## 3. Typed Error And Logger Layer

Problem addressed:

- SDK internals call `console.error`, `console.warn`, `console.log`.
- Errors are generic and hard for SDK consumers to handle.
- Fallback can hide useful context.

### Target Shape

```text
src/errors/
  ScallopError.ts
  ScallopRpcError.ts
  ScallopIndexerError.ts
  ScallopConfigError.ts
  ScallopParseError.ts
  ScallopTransactionBuildError.ts

src/logger/
  Logger.ts
  noopLogger.ts
  consoleLogger.ts
```

### Tasks

1. Add `Logger` interface:
   - `debug`
   - `info`
   - `warn`
   - `error`
2. Add `logger?: Logger` constructor param at top-level `ScallopParams`.
3. Default to noop logger for library silence.
4. Replace direct console calls in:
   - `ScallopConstants`
   - query files
   - builder oracle files
   - utils/indexer
5. Add typed error classes with `cause`, `code`, and `context`.
6. Wrap mapper failures as `ScallopParseError`.
7. Wrap indexer failures as `ScallopIndexerError`.

### Acceptance

- `rg "console\\." src` only finds approved console logger implementation.
- Public errors are `instanceof ScallopError`.
- Fallback logs through injected logger, not global console.

## 4. Context And Dependency Boundary

Problem addressed:

- Deep dependency chain acts like a service locator.
- Constructors create nested dependencies implicitly.
- `utils` becomes the object everyone reaches through.

### Target Shape

```text
src/context/
  ScallopContext.ts
  createScallopContext.ts
```

`ScallopContext` owns:

- config snapshot
- Sui adapter
- indexer adapter
- query client
- logger
- network
- wallet address provider

### Tasks

1. Introduce internal `ScallopContext`.
2. Build context from existing constructor params.
3. Let existing classes accept `context?: ScallopContext`.
4. Wire `Scallop`, `ScallopClient`, `ScallopBuilder`, `ScallopQuery`, `ScallopUtils` through context.
5. Keep old constructor params functional.
6. Gradually replace `this.query.utils.scallopSuiKit...` chains with direct context dependencies.

### Acceptance

- New code does not add deeper getter chains.
- Unit tests can instantiate services with fake context.
- Public constructors remain compatible.

## 5. Config And Constants Refactor

Problem addressed:

- `ScallopConstants extends ScallopAddress extends ScallopAxios`.
- Config state is mutable and partially proxy-backed.
- Missing required config may fail late.

### Target Shape

```text
src/config/
  ScallopConfig.ts
  AddressConfigSource.ts
  PoolAddressConfigSource.ts
  WhitelistConfigSource.ts
  ConfigValidator.ts
```

### Tasks

1. Introduce immutable `ScallopConfigSnapshot`.
2. Add config loader that composes address, pool address, and whitelist repositories.
3. Add validation for required paths:
   - core market/version/protocol package
   - xOracle
   - coin decimals registry
   - supported coin types
4. Make `ScallopConstants` a compatibility facade over config snapshot.
5. Deprecate direct mutation of public maps.
6. Replace config proxies with explicit getters and `undefined` where optional.

### Acceptance

- Config loading either returns valid snapshot or typed error.
- No required address resolves to empty string silently.
- Existing `constants.get(path)` still works.

## 6. Transaction Block Composition Safety

Problem addressed:

- `Proxy` composition hides collisions.
- Type intersections may disagree with runtime methods.
- Debugging method origin is hard.

### Phase 1: Validate Current Proxy

Tasks:

1. Add method manifest per builder module:
   - core normal
   - core quick
   - spool
   - sCoin
   - referral
   - borrow incentive
   - loyalty
   - veSCA
2. Add startup/runtime collision check in `newScallopTxBlock`.
3. Add unit test that every manifest method exists on returned tx block.
4. Add unit test that no two modules export same method name unless explicitly allowed.

Acceptance:

- Current flat API is safer without breaking users.

### Phase 2: Explicit Composite

Target:

```ts
tx.core.supply(...)
tx.spool.stake(...)
tx.vesca.lock(...)
```

Tasks:

1. Add explicit module fields while preserving flat proxy methods.
2. Mark flat methods as compatibility layer after docs update.
3. Consider generated declarations for module methods.

Acceptance:

- Consumers can choose explicit module API.
- Proxy becomes optional compatibility layer.

## 7. Split Large Services And Queries

Problem addressed:

- Large low-cohesion files.
- Query functions mix fetching, mapping, calculation, presentation.

### Target Shape

```text
src/services/
  marketService.ts
  portfolioService.ts
  priceService.ts
  obligationService.ts
  borrowIncentiveService.ts

src/repositories/
  marketRepository.ts
  obligationRepository.ts
  indexerMarketRepository.ts
  rpcMarketRepository.ts
```

### Tasks

1. Create service layer behind existing `ScallopQuery`.
2. Move pure calculations from `portfolioQuery.ts` into `portfolioCalculations.ts`.
3. Move raw fetches into repositories.
4. Keep existing query functions as compatibility wrappers during migration.
5. Split `ScallopClient` workflows into:
   - `LendingService`
   - `CollateralService`
   - `BorrowService`
   - `SpoolService`
   - `VeScaService`
6. Keep old `ScallopClient.method()` signatures as delegating wrappers.

### Acceptance

- No file over 700 lines after phase completion.
- New services have focused tests.
- Old public methods are thin wrappers.

## 8. API Surface And Package Exports

Problem addressed:

- Root export is broad.
- Internals can become public accidentally.
- No stable subpath exports.

### Target Exports

```json
{
  ".": "...",
  "./query": "...",
  "./builder": "...",
  "./client": "...",
  "./types": "...",
  "./errors": "..."
}
```

### Tasks

1. Add internal/public type folders:
   - `src/types/public`
   - `src/types/internal`
2. Decide official public subpaths.
3. Add package `exports` entries.
4. Keep existing root exports.
5. Add import tests for each export path.

### Acceptance

- Public API is documented by exports.
- Internal mapper/repository types are not accidentally exported.

## 9. Test Restructure

Problem addressed:

- Mainnet tests are useful but too integration-heavy.
- Parser and architecture regressions need deterministic tests.

### Target Commands

```bash
pnpm run test:unit
pnpm run test:integration
pnpm run test:query
pnpm run test:typecheck
```

### Tasks

1. Move mainnet-dependent tests under integration naming or config.
2. Add fixture tests for mappers.
3. Add tx-block composition tests.
4. Add logger/no-console tests.
5. Add config validation tests.
6. Add source fallback tests with fake indexer/RPC clients.

### Acceptance

- Unit tests run without network.
- Integration tests are clearly marked.
- CI can run fast unit suite separately from mainnet smoke suite.

## Execution Order

Recommended order:

1. Mapper layer and fixture tests.
2. Tx-block composition validation.
3. Logger and typed errors.
4. Explicit source fallback.
5. Context introduction.
6. Config snapshot refactor.
7. Service/repository extraction.
8. Package export cleanup.
9. Optional explicit tx module API.

Reason:

- Fixes highest bug risk first.
- Avoids public API breakage.
- Adds safety checks before larger refactors.
- Lets each phase ship independently.

## Milestones

### Milestone 1: Parser Safety

Deliverables:

- `src/mappers/moveTypeMapper.ts`
- domain mapper tests
- no raw `.type.name` parsing in query/business code

Validation:

- `pnpm run test:typecheck`
- mapper unit tests
- `pnpm run test test/query`

### Milestone 2: Runtime Safety

Deliverables:

- tx-block method manifest
- collision detection
- no direct internal `console.*`
- logger interface

Validation:

- tx-block unit tests
- no-console grep gate
- `pnpm run build`

### Milestone 3: Dependency Safety

Deliverables:

- `ScallopContext`
- typed source fallback
- no method monkey-patching in `ScallopQuery`

Validation:

- source fallback unit tests
- public API smoke tests

### Milestone 4: Structural Cleanup

Deliverables:

- config snapshot
- repositories
- services
- smaller `ScallopClient` and query files

Validation:

- file-size budget
- integration query tests
- backward compatibility tests

## Compatibility Policy

For each public method migration:

1. Keep old method signature.
2. Move implementation to new service.
3. Delegate old method to service.
4. Add tests for old and new call path.
5. Mark only newly preferred API in docs.
6. Remove old methods only in a major version.

## Risk Register

### Risk: Refactor breaks existing users

Mitigation:

- compatibility wrappers
- public API snapshot tests
- no removal before major version

### Risk: Mainnet data shape changes during migration

Mitigation:

- mapper fixtures
- typed parse errors
- integration smoke tests

### Risk: New abstraction adds complexity

Mitigation:

- introduce only behind current facades
- one domain at a time
- remove old helper path after adoption

### Risk: Proxy replacement causes transaction regressions

Mitigation:

- validate current proxy first
- keep flat API during explicit composite rollout
- add method collision tests before implementation change

## Definition Of Done

The structure work is done when:

- Public API compatibility tests pass.
- Unit tests run without network.
- Integration tests are separately runnable.
- No raw transport payload is parsed inside services.
- No implicit method monkey-patching remains.
- `ScallopConstants` no longer inherits HTTP/cache behavior.
- `ScallopClient` is mostly facade/delegation.
- Tx-block composition has runtime validation or explicit modules.
- SDK internals use typed errors and injectable logger.
