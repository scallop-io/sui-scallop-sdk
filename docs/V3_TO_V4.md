# Migrating from v3 to v4

> **TL;DR:** If you only call public methods on `Scallop`, `ScallopClient`, `ScallopBuilder`, `ScallopQuery`, or `ScallopUtils` — your code keeps working without changes. Bump the dep, run your tests, ship.
>
> Keep reading if you do any of these:
>
> 1. **Inherit from `ScallopConstants`** (subclass it in your own code).
> 2. **Check `instanceof ScallopAddress`** against a `ScallopConstants` instance.
> 3. **Mutate `constants.whitelist` or `constants.poolAddresses` directly** (calling `.add()` / `.delete()` / `.clear()` on them).
> 4. **Import from non-public paths** like `src/types/internal/`, deep internal modules.
> 5. **Target Node < 22** (you can't — v4 requires Node 22+).

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
□ Run typecheck + your tests
```

---

## B1 — `ScallopConstants` no longer extends `ScallopAddress`

### What changed

`ScallopConstants` now **composes** a `ScallopAddress` instead of extending one. The address adapter is exposed at `constants.address`. The full inheritance chain `ScallopConstants → ScallopAddress → ScallopAxios → ScallopQueryClient` is dismantled.

### Impact matrix

| If your v3 code did…                                                 | …in v4 you must…                                                  | Forwarder available?        |
| -------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------- |
| `constants.get('core.market')`                                       | nothing — keeps working                                           | ✅ yes                      |
| `constants.getAddresses()`                                           | nothing                                                           | ✅ yes                      |
| `constants.setAddresses(...)`                                        | nothing                                                           | ✅ yes                      |
| `constants.read(addressId)`                                          | call `constants.address.read(addressId)`                          | ❌ removed (use `.address`) |
| `constants.queryClient`                                              | nothing                                                           | ✅ yes                      |
| `constants.axiosInstance`                                            | nothing                                                           | ✅ yes                      |
| `constants.scallopAxios`                                             | nothing                                                           | ✅ yes                      |
| `constants.switchCurrentAddresses('testnet')`                        | nothing                                                           | ✅ yes                      |
| `constants instanceof ScallopAddress`                                | check `constants.address instanceof ScallopAddress`               | —                           |
| `class MyConstants extends ScallopConstants` and then `super.read()` | replace `super.X()` with `this.address.X()`                       | —                           |
| `utils.address.get('core.market')`                                   | nothing — `utils.address` now returns the _real_ `ScallopAddress` | —                           |

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

Available subpaths: `/client`, `/query`, `/builder`, `/errors`, `/logger`, `/config`, `/context`, `/mappers`, `/types`. Each ships ESM + CJS + matching `.d.ts`. See [`SDK_STRUCTURE.md` §8](SDK_STRUCTURE.md#8-subpath-exports).

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

## What didn't change

- **All public method signatures and return shapes** on `Scallop`, `ScallopClient`, `ScallopBuilder`, `ScallopQuery`, `ScallopUtils`.
- **All flat tx-block methods** — `tx.supplyQuick`, `tx.stake`, `tx.borrow`, etc. continue to work exactly as before.
- **`@deprecated` aliases** like `tx.deposit`, `tx.addCollateral`, `client.addCollateral` are still present (planned removal in the next major after v4).
- **The init flow** — `await scallop.createScallopClient()` etc. handle init automatically, same as v3.
- **The `parseObjectAs<T>` gotcha** — see [`SDK_STRUCTURE.md` §7](SDK_STRUCTURE.md#7-cross-cutting-concerns) for the still-valid warning about `.value` field unwrapping.

---

## Reporting issues

If you hit a migration snag not covered here:

1. Re-run with `logger: consoleLogger` to surface the underlying error.
2. Open an issue at https://github.com/scallop-io/sui-scallop-sdk/issues with the error and your v3 → v4 diff.

We treat broken v3 read paths (`getMarketPools`, `getObligationAccount`, etc.) as **regressions**, not breaking changes — please report.
