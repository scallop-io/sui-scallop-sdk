# AGENTS.md

Guidance for coding agents working in this repo.

> Start here: [`docs/SDK_STRUCTURE.md`](docs/SDK_STRUCTURE.md). This file is the short operational checklist.

## Commands

```bash
# Build
pnpm run build             # production: tsup --env.NODE_ENV production
pnpm run build:dev         # development tsup build
pnpm run watch             # clean + tsc watch + tsup watch

# Test
pnpm run test              # typecheck + all unit/integration projects; needs network/.env
pnpm run test:typecheck    # tsc -p ./tests
pnpm run test:no-console   # CI gate: no console.* in SDK internals
pnpm run test:unit         # network-free unit specs
pnpm run test:repo         # unit repository specs only
pnpm run test:query        # integration query.spec.ts; needs network/.env
pnpm run test:integration  # all integration specs; needs network/.env
pnpm run test:all          # vitest run

# Run a focused spec
pnpm run test:unit tests/repositories/market/index.spec.ts
pnpm run test:integration tests/integration/builder.spec.ts

# Lint / format
pnpm run lint:fix
pnpm run format:fix
```

CI runs `test:typecheck -> test:no-console -> test:unit -> build`. No network.

Never read or print `.env*` contents. Integration/query/full `test` need `.env` with `SECRET_KEY`, but only users should inspect it. Integration tests use `inspectTxn` / `devInspectTxn` dry-runs unless a test explicitly calls `signAndSendTxn`.

## Architecture

ESM TypeScript (`"type": "module"`), Node `>=22`, tsup multi-entry build, path alias `src/` -> `./src/`.

Facade chain:

```text
Scallop
  -> ScallopClient        # write facade
      -> ScallopBuilder   # owns SuiKit + TransactionExecutor
          -> ScallopQuery # read facade; delegates to repositories
              -> ScallopUtils
                  -> OnChainDataSource
                  -> ScallopConstants
                      -> ScallopAddress
```

Init: call `.init()` after manual construction. `Scallop.createScallopClient()` / `createScallopBuilder()` / `createScallopQuery()` / `createScallopUtils()` handle init.

Parent getters: `client.builder`, `builder.query`, `query.utils`, `utils.constants`, `constants.address`. `ScallopClient` also forwards `suiKit`, `executor`, `onchain`.

`ScallopConstants` composes `ScallopAddress`; it no longer extends it. Use `constants.address instanceof ScallopAddress`. Forwarders remain for back-compat: `get`, `set`, `getAddresses`, `setAddresses`, `getId`, `getAllAddresses`, `switchCurrentAddresses`, `queryClient`, `axiosClient`, `axiosInstance`, `scallopAxios`.

## Directory Map

```text
src/
  entries/                    # public entry points (every tsup entry; thin re-exports)
    index.ts client.ts query.ts builder.ts errors.ts logger.ts types.ts
  models/                     # Scallop* facade classes
    scallop.ts
    scallopClient/
    scallopBuilder/
    scallopQuery/
    scallopUtils/
    scallopConstants/         # constants + colocated config sources/validator
    scallopAddress/
    suiKit.ts                 # newSuiKit()
    transactionExecutor.ts    # SuiKitTransactionExecutor
  txBuilders/                 # ScallopTxBlock builders (write-path construction)
    core/ spool/ sCoin/ referral/ borrowIncentive/ loyaltyProgram/ vesca/
    oracles/
    manifest.ts modules.ts verify.ts index.ts
  datasources/                # raw transports
    onchain.ts rateLimiter.ts api.ts indexer.ts
  repositories/               # read layer; one folder per domain
    base.ts cache.ts types.ts utils.ts
    market/ obligation/ spool/ price/ borrowIncentive/ coinBalance/
    flashloan/ isolatedAssets/ xOracle/ veSca/ loyaltyProgram/
    veScaLoyaltyProgram/ referral/ poolAddresses/ addressApi/
    wiring/
  services/
    client/                   # write-side business logic
    query/                    # cross-domain read calculations
  mappers/                    # shared shape normalization; currently moveTypeMapper
  errors/ logger/ types/ utils/ constants/
```

## Transaction Builder

`ScallopBuilder.createTxBlock()` returns a Proxy-composed `ScallopTxBlock` from [`src/txBuilders/index.ts`](src/txBuilders/index.ts):

```text
core -> spool -> sCoin -> referral -> borrowIncentive -> loyaltyProgram -> vesca
```

Method types:

- normal methods: sync Move-call wrappers; return `TransactionResult`
- quick methods: async helpers; fetch coins/obligations, call normal method, transfer leftovers

Module view: `tx.core`, `tx.spool`, `tx.vesca`, `tx.borrowIncentive`, `tx.referral`, `tx.loyalty`, `tx.scoin`. Flat and module refs are identity-equal. Keep [`src/txBuilders/manifest.ts`](src/txBuilders/manifest.ts), [`src/txBuilders/modules.ts`](src/txBuilders/modules.ts), [`src/txBuilders/verify.ts`](src/txBuilders/verify.ts) in sync.

Canonical lending names: `supply` / `supplyQuick` / `depositCollateral` / `depositCollateralQuick`. Legacy `deposit*` / `addCollateral*` remain deprecated.

## Read Path

`ScallopQuery.*` delegates to `this.repos.<domain>`, wired by [`src/repositories/wiring/registry.ts`](src/repositories/wiring/registry.ts). Repositories pick data source with `QuerySource` (`onchain` | `api` | `api-first`) and use `runWithDataSourceFallback` in [`src/repositories/utils.ts`](src/repositories/utils.ts).

Parsing lives in each domain repository (`utils.ts`, `schema.ts`, `mapper.ts`, `bcs.ts` as needed). `src/mappers/` is only for shared transport-shape normalization.

Repository network reads go through `ctx.fetchWithCache(...)`; shared `QueryClient` is in [`src/repositories/cache.ts`](src/repositories/cache.ts). Cache keys live in [`src/constants/queryKeys.ts`](src/constants/queryKeys.ts); RPC keys include `node: onchain.url`.

For bulk object reads, `onchain.client.getObjects` max is 50 ids/call. Use `partitionArray(ids, 50)` from [`src/utils/vesca.ts`](src/utils/vesca.ts).

## Write Path

`ScallopClient.*` delegates to services in [`src/services/client/`](src/services/client/):

- `LendingService`: supply / withdraw / flashLoan
- `CollateralService`: depositCollateral / withdrawCollateral
- `BorrowService`: openObligation / borrow / repay
- `SpoolService`: createStakeAccount / stake / unstake / claim
- `VeScaService`: veSCA flows
- `ReferralService`: referral flows

Services accept structural `ClientServiceContext` from [`src/services/client/types.ts`](src/services/client/types.ts), not full `ScallopClient`.

## Errors / Logging / Config

SDK internals throw typed `ScallopError` subclasses from [`src/errors/`](src/errors/):

| Class                          | Use                                      |
| ------------------------------ | ---------------------------------------- |
| `ScallopRpcError`              | Sui RPC / gRPC failures                  |
| `ScallopIndexerError`          | Scallop indexer / API HTTP failures      |
| `ScallopParseError`            | parser/mapper rejected payload           |
| `ScallopConfigError`           | `strictInit` config validation failed    |
| `ScallopTransactionBuildError` | tx-builder failed to construct Move call |

No internal `console.*`; route through injected `Logger`. Default `noopLogger`; opt in with `consoleLogger`. Gate: [`tests/noConsole.spec.ts`](tests/noConsole.spec.ts).

`strictInit` validation lives in [`src/models/scallopConstants/config/ConfigValidator.ts`](src/models/scallopConstants/config/ConfigValidator.ts). `constants.whitelist` and `constants.poolAddresses` are frozen snapshots after `init()`.

`parseObjectAs<T>` gotcha: [`src/utils/core.ts`](src/utils/core.ts) unwraps Move object JSON. If `fields.value` exists, return is `fields.value`, not `{ value: ... }`.

## Types / Exports

Public semver-governed types live in [`src/types/public/`](src/types/public/). Internal DTOs live in [`src/types/internal/`](src/types/internal/) and are not root API.

Subpath exports:

```text
@scallop-io/sui-scallop-sdk
@scallop-io/sui-scallop-sdk/client
@scallop-io/sui-scallop-sdk/query
@scallop-io/sui-scallop-sdk/builder
@scallop-io/sui-scallop-sdk/errors
@scallop-io/sui-scallop-sdk/logger
@scallop-io/sui-scallop-sdk/types
```

New entry point: update [`tsup.config.ts`](tsup.config.ts), `package.json` `exports`, and [`tests/subpathExports.spec.ts`](tests/subpathExports.spec.ts).

## Where New Code Goes

| Adding                     | Put it in                                                        |
| -------------------------- | ---------------------------------------------------------------- |
| Move-call wrapper          | `src/txBuilders/<domain>/` + `manifest.ts` + `modules.ts`        |
| Read method                | `src/repositories/<domain>/helpers.ts` + `index.ts`              |
| Read domain                | `src/repositories/<domain>/` + `repositories/wiring/registry.ts` |
| Cross-domain read assembly | `ScallopQuery` or `src/services/query/`                          |
| Write-side business logic  | `src/services/client/<Name>Service.ts`                           |
| Pure domain transform      | `src/repositories/<domain>/utils.ts` / `schema.ts` / `mapper.ts` |
| Shared transport transform | `src/mappers/`                                                   |
| Public type                | `src/types/public/`                                              |
| Internal DTO               | `src/types/internal/`                                            |
| Error case                 | typed `Scallop*Error` from `src/errors/`                         |

Before commit: `pnpm run test:typecheck && pnpm run test:unit && pnpm run build`.

## Testing

Specs live under `tests/`, mirroring `src/`. Unit project includes `tests/**/*.spec.ts` excluding `tests/integration/**`; integration project includes `tests/integration/**/*.spec.ts`.

Rules:

- Unit tests are network-free; never import `tests/scallopSdk.ts`.
- Integration tests may use `tests/scallopSdk.ts` fixture and forced-address overrides.
- Use a single top-level `beforeAll` for shared setup.
- Dry-run assertions check `(result.Transaction ?? result.FailedTransaction).effects?.status.success`.
- Prefer `expect(value).toBeTruthy()` over `expect(!!value).toBe(true)`.

## Commit / References

Conventional commits enforced by commitlint. Use `pnpm run commit` for prompt.

Sui SDK docs: read `node_modules/@mysten/*/docs/llms-index.md` first, then the referenced page.

Ignore `misc/`.
