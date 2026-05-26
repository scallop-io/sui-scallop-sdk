# AGENTS.md

This file provides guidance to coding agents (Codex, Claude Code, Cursor, etc.) when working with code in this repository.

> **Start here:** [`docs/SDK_STRUCTURE.md`](docs/SDK_STRUCTURE.md) is the canonical 5-minute tour of the SDK layout. Read it first if you're new — this file only repeats the strict-must-know bits.

## Commands

```bash
# Build
pnpm run build          # Production build via tsup (multi-entry, ESM + CJS + .d.ts)
pnpm run build:dev      # Development build
pnpm run watch          # Watch mode (types + tsup)

# Test
pnpm run test           # Typecheck + all tests (network — needs .env)
pnpm run test:typecheck # TypeScript check on test/ (tsc -p ./test)
pnpm run test:no-console# CI gate: blocks new console.* in SDK internals
pnpm run test:unit      # Network-free unit tests (21 spec files, 151 tests, <2s)
pnpm run test:query     # Indexer/RPC query tests (needs network)
pnpm run test:integration # Mainnet dry-run tests (needs .env)

# Run a single test file
pnpm run test:unit test/marketService.spec.ts
pnpm run test:integration test/builder.spec.ts

# Lint / Format
pnpm run lint:fix       # ESLint fix
pnpm run format:fix     # Prettier fix
```

CI (`.github/workflows/ci.yml`) runs `test:typecheck → test:no-console → test:unit → build` on every push to `main` and every pull request. No network.

Integration / query / `test` tests require a `.env` file with `SECRET_KEY` set (see `.env.example`). They run against mainnet using `inspectTxn` / `devInspectTxn` (dry-run, no broadcasting). Only tests explicitly calling `signAndSendTxn` submit real transactions.

## Architecture (v4.0.0)

ESM-only TypeScript (`"type": "module"`) built with tsup. Path alias `src/` → `./src/` (configured in `tsconfig.json` and `vitest.config.ts`). Node 22+ only.

Internals follow an **adapters → repositories → mappers → services → facade** layering. Public method signatures on `Scallop` / `ScallopClient` / `ScallopBuilder` / `ScallopQuery` / `ScallopUtils` are preserved across the v4 refactor.

### Model hierarchy (dependency chain)

```
Scallop
  └── ScallopClient
        └── ScallopBuilder
              └── ScallopQuery
                    └── ScallopUtils
                          ├── ScallopConstants  (composes ScallopAddress — see §"v4 breaking change")
                          ├── ScallopSuiKit     (wraps @scallop-io/sui-kit)
                          └── ScallopIndexer    (HTTP API client via axios)
```

Every model exposes its parent via a getter (`client.builder`, `builder.query`, `query.utils`, `utils.constants`, `constants.address`). After constructing any model, call `.init()` before use. `Scallop.createScallopClient()` etc. handle init automatically.

### v4 breaking change — `ScallopConstants` composition

`ScallopConstants` no longer **extends** `ScallopAddress`. It **composes** it: the underlying address adapter is `constants.address`.

- `instanceof ScallopAddress` against a `ScallopConstants` instance now returns `false`. Check `constants.address instanceof ScallopAddress` instead.
- `utils.address` / `query.address` / `builder.address` / `client.address` return the real `ScallopAddress` (not the `ScallopConstants` instance).
- Forwarders are kept on `ScallopConstants` for back-compat: `get`, `set`, `getAddresses`, `setAddresses`, `getId`, `getAllAddresses`, `switchCurrentAddresses`, `queryClient`, `axiosClient`, `axiosInstance`, `scallopAxios`.
- `constants.whitelist` and `constants.poolAddresses` are now **frozen immutable snapshots** populated during `init()`. Mutating them throws. Every whitelist key is always present (missing entries default to empty `Set`s).

### ScallopTxBlock — Proxy-composed transaction block

`ScallopBuilder.createTxBlock()` returns a `ScallopTxBlock`, assembled in [src/builders/index.ts](src/builders/index.ts) by layering specialised tx-block objects through a `Proxy`:

```
coreTxBlock  ←  spoolTxBlock  ←  sCoinTxBlock  ←  referralTxBlock
             ←  borrowIncentiveTxBlock  ←  loyaltyTxBlock  ←  vescaTxBlock
```

Property lookup falls through outermost (core) → innermost (vesca). All domain methods live on the single returned object.

**Two flavours per Move call:**

- `GenerateCoreNormalMethod` — thin Move-call wrappers, synchronous, return `TransactionResult`.
- `GenerateCoreQuickMethod` — async helpers that auto-fetch coins/obligations, call the normal method, transfer leftovers.

**v4 added an explicit module view.** Alongside the flat methods, `tx.core` / `tx.spool` / `tx.vesca` / `tx.borrowIncentive` / `tx.referral` / `tx.loyalty` / `tx.scoin` expose the same functions grouped by domain. Function references are identity-equal (`tx.supplyQuick === tx.core.supplyQuick`). Defined in [src/builders/modules.ts](src/builders/modules.ts), declared in [src/builders/manifest.ts](src/builders/manifest.ts), verified at runtime by [src/builders/verify.ts](src/builders/verify.ts) (throws on collisions or undeclared methods).

### Naming convention for lending operations

`supply` / `supplyQuick` / `depositCollateral` / `depositCollateralQuick` are the canonical names (aligned with Aave/Compound). The old names `deposit` / `depositQuick` / `addCollateral` / `addCollateralQuick` are `@deprecated` (removal scheduled for the next major after v4).

### Read path

`ScallopQuery.*` methods delegate to a service (`MarketService`, `ObligationService`, `LendingReadService`, `SpoolReadService`, `BorrowIncentiveService`, `PriceService`). Services use `runWithSourceFallback` ([src/utils/querySource.ts](src/utils/querySource.ts)) to try the indexer first, then fall back to RPC. Mappers ([src/mappers/](src/mappers/)) normalise gRPC vs JSON-RPC payload shapes and throw `ScallopParseError` on bad input.

### Write path

`ScallopClient.*` write methods delegate to a client-side service (`LendingService`, `CollateralService`, `BorrowService`, `SpoolService`, `VeScaService`, `ReferralService`). Each accepts a structural `ClientServiceContext` ([src/services/client/types.ts](src/services/client/types.ts)) — not the full `ScallopClient` — which makes them unit-testable in isolation.

### `parseObjectAs<T>` — important gotcha

`src/utils/core.ts:parseObjectAs` unwraps Move object JSON. When the on-chain JSON has a `value` field, it returns `fields.value` directly (not `{ value: ... }`). Zod schemas consuming `parseObjectAs` output must match the unwrapped type, not the wrapper. This is the #1 source of "why is my parser empty" bugs.

### Query caching

`ScallopQuery` uses `@tanstack/query-core` (`QueryClient`) for on-chain data. Cache keys are centralised in `src/constants/queryKeys.ts`.

### Errors

All SDK-internal failures throw a subclass of `ScallopError` ([src/errors/](src/errors/)):

| Class                          | When                                                        |
| ------------------------------ | ----------------------------------------------------------- |
| `ScallopRpcError`              | Sui RPC / gRPC failure                                      |
| `ScallopIndexerError`          | Scallop indexer HTTP failure                                |
| `ScallopParseError`            | A mapper rejected a payload shape                           |
| `ScallopConfigError`           | `strictInit: true` and required addresses/whitelist missing |
| `ScallopTransactionBuildError` | A tx-builder couldn't construct a Move call                 |

Throw the typed one — don't `throw new Error(...)` from SDK internals.

### Logging

Pass `{ logger }` to `Scallop` / `ScallopClient` / `ScallopQuery` / `ScallopUtils` / `ScallopAddress` / `ScallopConstants`. **The SDK never calls `console.*` internally** — `test:no-console` enforces this on every commit. Default is `noopLogger`. Use `consoleLogger` to opt in.

### `strictInit`

```ts
const constants = new ScallopConstants({ strictInit: true });
await constants.init(); // throws ScallopConfigError if required addresses/whitelist missing
```

Validation lives in `src/config/ConfigValidator.ts`. Defaults to `false` (best-effort init).

### Types layout

```
src/types/
  public/         # ⭐ The semver-governed type surface (the only barrel that is API)
  internal/       # DTOs / transport types (Origin*, Parsed*, Calculated*) — NOT re-exported from root
  builder/        # Canonical TxBlock method signatures
  query/          # Canonical return types
  constant/       # Enums, xOracle types
  address.ts, sui.ts, utils.ts
  index.ts        # delegates to ./public — preserves the v3 root barrel
```

When adding a new public type, put it under `src/types/public/`. When adding a DTO/internal type, put it under `src/types/internal/`.

### Subpath exports

Consumers can import slim slices:

```
@scallop-io/sui-scallop-sdk          # default — everything
@scallop-io/sui-scallop-sdk/client   # ScallopClient
@scallop-io/sui-scallop-sdk/query    # ScallopQuery
@scallop-io/sui-scallop-sdk/builder  # ScallopBuilder
@scallop-io/sui-scallop-sdk/errors   # typed errors
@scallop-io/sui-scallop-sdk/logger   # Logger interface + impls
@scallop-io/sui-scallop-sdk/config   # ScallopConfigSnapshot, validators, sources
@scallop-io/sui-scallop-sdk/context  # ScallopContext
@scallop-io/sui-scallop-sdk/mappers  # pure mappers
@scallop-io/sui-scallop-sdk/types    # type-only
```

When adding a new entry-point: register in `tsup.config.ts` + `package.json` `exports` + smoke test in `test/subpathExports.spec.ts`.

## Where does new code go?

| You're adding…                       | Put it in…                                                                   |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| A new Move-call wrapper              | `src/builders/<domain>Builder.ts` + register in `manifest.ts` & `modules.ts` |
| A new read endpoint (indexer or RPC) | `src/queries/<domain>Query.ts`, then expose via a service                    |
| Read-side business logic             | `src/services/<Name>Service.ts`                                              |
| Write-side business logic            | `src/services/client/<Name>Service.ts`                                       |
| Pure data-shape transform            | `src/mappers/<domain>Mapper.ts`                                              |
| New error case                       | Throw a typed `Scallop*Error` from `src/errors/`                             |
| New public type                      | `src/types/public/`                                                          |
| New internal DTO                     | `src/types/internal/`                                                        |

Then run `pnpm test:typecheck && pnpm test:unit && pnpm build` before committing.

## Testing conventions

- Tests use **Vitest** with a 60-second timeout. `vitest.config.ts` sets the path alias `src/` → `./src`.
- Unit tests are **network-free** and run from `test:unit`. Integration tests live in `test:integration` / `test:query`.
- Shared setup is in a single top-level `beforeAll` (not per-describe).
- Dry-run assertions use `inspectTxn(tx)` then check `(result.Transaction ?? result.FailedTransaction).effects?.status.success`.
- Use `expect(value).toBeTruthy()` (not `expect(!!value).toBe(true)`).
- Test-specific wallet state is set up in `test/scallopSdk.ts` using `forceAddressesInterface`, `forcePoolAddressInterface`, and `forceWhitelistInterface` mock overrides.
- The no-console gate ([test/noConsole.spec.ts](test/noConsole.spec.ts)) blocks new `console.*` calls in SDK internals — route through an injected `Logger` instead.

## Commit style

Conventional commits enforced by commitlint (`feat:`, `fix:`, `refactor:`, `chore:`, etc.). Use `pnpm run commit` for the interactive prompt.

## Sui SDK reference

Every `@mysten/*` package ships LLM documentation in its `docs/` directory. Look for `docs/llms-index.md` files inside `node_modules/@mysten/*/` — read the index first to find the page you need, then read that page for details.

## Notes

- Ignore `misc/`.
- `docs/SDK_STRUCTURE_FIX_PLAN.md` tracks remaining workstream items.
- `docs/SDK_STRUCTURE_REPORT.md` is the original problem statement that motivated the v4 refactor.
