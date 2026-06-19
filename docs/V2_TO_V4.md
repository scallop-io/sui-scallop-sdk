# Migrating from v2 to v4

> **TL;DR:** You're crossing **two** major releases (v3.0.0 → v4.0.0). The bulk of the work is the v2 → v3 jump: bump to `@mysten/sui@2` + `@scallop-io/sui-kit@2`, move to Node 22 / ESM, and — if you're below v2.2.0 — adopt object-param quick methods. If you only call public methods on `Scallop`, `ScallopClient`, `ScallopBuilder`, `ScallopQuery`, or `ScallopUtils`, the facade surface is unchanged across all three majors; most of the diff is dependency/runtime plus the v4 `@mysten/sui` peer-dep.
>
> Keep reading if you do any of these:
>
> 1. **Touch raw Sui transaction results or on-chain object JSON** (the shape changed in v3).
> 2. **Call the old lending names** `deposit` / `addCollateral` (and the `*Quick` family) — **removed in v4**; use the canonical names.
> 3. **Call quick methods with positional args** and you're on v2.0/v2.1 — v2.2.0 moved them to object params.
> 4. **Subclass `ScallopConstants`, check `instanceof ScallopAddress`, mutate `whitelist`/`poolAddresses`, or use `ScallopIndexer` / `ScallopSuiKit` / `ScallopAxios`** — all reshaped in v4 (see Part B).
> 5. **Target Node < 22** (you can't — v3+ requires Node 22+).

This guide is split into the two hops. For the v3 → v4 details we link straight to [`V3_TO_V4.md`](V3_TO_V4.md) rather than re-pasting every diff. For the _why_, see [`CHANGELOG.md`](../CHANGELOG.md). For the new SDK shape, see [`SDK_STRUCTURE.md`](SDK_STRUCTURE.md).

---

## Quick checklist

```
□ Bump @scallop-io/sui-scallop-sdk to ^4.0.0
□ Install @mysten/sui@^2 in your own deps          (v3: a dep — v4: now a PEER dependency)
□ Install @scallop-io/sui-kit@^2 in your own deps  (v3 migration)
□ Update Node to >=22 in CI and local engines      (was 18 in v2)
□ Confirm your project is ESM ("type": "module")   (v3+ is ESM-only)
□ Quick methods take an OBJECT param               (v2.2.0+; required if coming from v2.0/v2.1)
□ Migrate raw result access → (result.Transaction ?? result.FailedTransaction).status.success
□ Migrate raw object access → .object / .json (was .data.content)
□ Use the new lending names: supply / supplyQuick / depositCollateral / depositCollateralQuick
□ Replace `constants instanceof ScallopAddress` → `constants.address instanceof ScallopAddress`   (B1)
□ Remove any code that mutates `constants.whitelist` / `constants.poolAddresses`                   (B2)
□ Replace `scallop.createScallopIndexer()` → `createScallopQuery()` + its read methods             (B6)
□ Drop `.scallopSuiKit` access → `utils.onchain` (reads) / `builder.suiKit` / `builder.executor`   (B6)
□ Re-route any deep `src/types/internal/...` imports through the public barrel or /types           (B4)
□ Run typecheck + your tests
```

---

## Part A — v2 → v3

`v3.0.0` migrated the whole SDK onto `@mysten/sui@2` and `@scallop-io/sui-kit@2`. The facade method signatures and return shapes did **not** change — but if you ever touched raw Sui results or on-chain object JSON, those shapes did.

### A1 — Dependency & runtime bump

```diff
  // package.json
  "engines": {
-   "node": ">=18"
+   "node": ">=22"
  },
- "type": "commonjs"          // or unset
+ "type": "module"            // v3+ is ESM-only
```

Install the v2-line peers/deps the SDK now expects:

```bash
npm install @mysten/sui@^2 @scallop-io/sui-kit@^2
```

```diff
  # .github/workflows/your-ci.yml
  - uses: actions/setup-node@v6.4.0
    with:
-     node-version: '20'
+     node-version: '22'
```

> ESM-only means no `require('@scallop-io/sui-scallop-sdk')` — use `import`. If you're stuck on CJS, transpile or move your entrypoint to ESM.

### A2 — Raw transaction result access

**Only relevant if you read raw Sui transaction results yourself** (e.g. `client.signAndSendTxn(...)` and then inspect the result). If you only act on the facade's return values, skip this.

The underlying client moved to `SuiGrpcClient` with the `client.core.*` namespace, and the result shape flattened:

```diff
- if (result.effects.status.status === 'success') {
+ if ((result.Transaction ?? result.FailedTransaction).status.success) {
    // ...
  }
```

v3 also added `devInspectTxn()` (JSON-RPC) alongside `inspectTxn()` — use it to bypass strict gRPC validation when dry-running.

### A3 — Raw on-chain object field access

**Only relevant if you fetch raw objects and read their fields yourself.** v2's `@mysten/sui@1` exposed object contents under `.data.content`; v2 of the client (via `SuiGrpcClient`) exposes them as `.object` / `.json`, and auto-unwraps the nested `.fields`:

```diff
- const market = obj.data.content.fields.value;
+ const market = obj.json.value;   // fields are auto-unwrapped by the v2 client
```

> Heads-up on the `parseObjectAs<T>` gotcha that came with this: when the JSON has a `value` field, the unwrap returns `fields.value` directly (not `{ value: ... }`). See [`SDK_STRUCTURE.md` §7](SDK_STRUCTURE.md#7-cross-cutting-concerns).

### A4 — Lending method renames

v3 added Aave/Compound-aligned names and **deprecated** (did not remove) the old ones. They all still work, but switch when convenient:

```diff
- client.deposit(...)                 // deprecated
+ client.supply(...)

- client.depositAndStake(...)         // deprecated
+ client.supplyAndStake(...)

- tx.depositQuick({ ... })            // deprecated
+ tx.supplyQuick({ ... })

- tx.addCollateralQuick({ ... })      // deprecated
+ tx.depositCollateralQuick({ ... })

- tx.deposit(...)                     // deprecated normal method
+ tx.supply(...)

- tx.addCollateral(...)               // deprecated normal method
+ tx.depositCollateral(...)
```

### A5 — Object-param quick methods (only if coming from v2.0 / v2.1)

v2.2.0 began transitioning all quick methods to a **single object parameter** instead of positional args. If your last v2 release is v2.0.x or v2.1.x, you must adopt the object form before moving on (v2.2+ users are already done):

```diff
- tx.borrowQuick(amount, 'sui', obligationId, obligationKey);
+ tx.borrowQuick({ amount, poolCoinName: 'sui', obligationId, obligationKey });
```

Apply the same shape to the other quick methods (veSCA quick methods led the transition in v2.2.0). Check each method's current signature against the [builder types](../src/types/builder/).

---

## Part B — v3 → v4

These are the v4.0.0 breaking changes. Each is one line here; click through to [`V3_TO_V4.md`](V3_TO_V4.md) for the full diff and impact matrix.

- **B1 — `ScallopConstants` no longer extends `ScallopAddress`.** It now composes one at `constants.address`; forwarders (`get`, `getAddresses`, `set`, …) still work, but `constants instanceof ScallopAddress` is now `false`. → [V3_TO_V4.md#b1--scallopconstants-no-longer-extends-scallopaddress](V3_TO_V4.md#b1--scallopconstants-no-longer-extends-scallopaddress)

- **B2 — `whitelist` / `poolAddresses` are frozen immutable snapshots after `init()`.** Mutating them throws; override via `forceWhitelistInterface` / `forcePoolAddressInterface`. Reading is unchanged. → [V3_TO_V4.md#b2--whitelist--pooladdresses-are-now-frozen-immutable-snapshots](V3_TO_V4.md#b2--whitelist--pooladdresses-are-now-frozen-immutable-snapshots)

- **B3 — Minimum Node 22.** Already satisfied if you completed Part A (v3 also required Node 22). → [V3_TO_V4.md#b3--minimum-node-22](V3_TO_V4.md#b3--minimum-node-22)

- **B4 — Public type surface clarified.** Types are public only via the root barrel or the `/types` subpath; deep `src/types/internal/...` paths are unsupported. → [V3_TO_V4.md#b4--public-type-surface-clarified](V3_TO_V4.md#b4--public-type-surface-clarified)

- **B5 — `@mysten/sui` is now a peer dependency (`^2.0.0`).** You must install it yourself (you already did this in Part A — just keep it in your own `package.json`, not relying on the SDK to ship it). → [V3_TO_V4.md#b5--mystensui-is-now-a-peer-dependency](V3_TO_V4.md#b5--mystensui-is-now-a-peer-dependency)

- **B6 — Transport reshaped.** `ScallopIndexer` (+ `Scallop.createScallopIndexer()`), `ScallopSuiKit`, and `ScallopAxios` were removed. Reads go through `utils.onchain` (`OnChainDataSource`); writes through `builder.executor` (`TransactionExecutor`) with raw `builder.suiKit`. Indexer/coin-price reads are now `ScallopQuery` methods. The `ScallopIndexerError` typed error is unaffected. → [V3_TO_V4.md#b6--transport-reshaped-scallopindexer-scallopsuikit-scallopaxios-removed](V3_TO_V4.md#b6--transport-reshaped-scallopindexer-scallopsuikit-scallopaxios-removed)

### v4 subpath exports

v4 ships slim subpaths (ESM + CJS + `.d.ts`): `/client`, `/query`, `/builder`, `/errors`, `/logger`, `/types`.

```diff
- import { ScallopClient } from '@scallop-io/sui-scallop-sdk';
+ import { ScallopClient } from '@scallop-io/sui-scallop-sdk/client';
```

### Optional: opt in to v4-only goodies

Not required to upgrade — see [`V3_TO_V4.md` → "Optional: opt in to v4-only goodies"](V3_TO_V4.md#optional-opt-in-to-v4-only-goodies) for full examples:

- **Module-grouped tx view** — `tx.core.supplyQuick` is identity-equal to `tx.supplyQuick`.
- **Typed errors** — `ScallopRpcError`, `ScallopParseError`, etc. from `/errors`.
- **Pluggable logger** — pass `consoleLogger` (default is silent `noopLogger`); the SDK never calls `console.*` itself.
- **`strictInit`** — `new ScallopConstants({ strictInit: true })` throws `ScallopConfigError` on missing required config.

---

## What didn't change

- **All public method signatures and return shapes** on `Scallop`, `ScallopClient`, `ScallopBuilder`, `ScallopQuery`, `ScallopUtils` — across v2, v3, and v4.
- **All flat tx-block methods** — `tx.supplyQuick`, `tx.stake`, `tx.borrow`, etc. continue to work.
- The long-deprecated aliases `tx.deposit`, `tx.addCollateral`, `client.deposit`, `client.addCollateral`, `client.depositAndStake`, etc. were **removed in v4** — migrate to the canonical names.
- **The init flow** — `await scallop.createScallopClient()` etc. handle init automatically.

---

## Reporting issues

If you hit a migration snag not covered here:

1. Re-run with `logger: consoleLogger` (v4) to surface the underlying error.
2. Open an issue at https://github.com/scallop-io/sui-scallop-sdk/issues with the error and your before/after diff.

We treat broken read paths (`getMarketPools`, `getObligationAccount`, etc.) as **regressions**, not breaking changes — please report.
