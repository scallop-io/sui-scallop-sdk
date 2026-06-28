# Migrating from v1 to v4

> **TL;DR:** This jump crosses **three** major releases (v2.0.0 → v3.0.0 → v4.0.0). The single biggest shift is in **v2.0.0**: the SDK stopped shipping **static, bundled constants** (addresses, pool addresses, whitelist) and instead **fetches them dynamically at runtime** through the `ScallopConstants` class — so assets can be added/removed without an SDK bump. After that, everything else is the v2 → v4 path: a dependency/runtime bump (`@mysten/sui@2`, `@scallop-io/sui-kit@2`, Node 22, ESM), object-parameter quick methods, the `supply` / `depositCollateral` naming, and the v4 structural refactor (composition, frozen snapshots, peer dep, subpaths, typed errors).
>
> If you only call public methods on `Scallop`, `ScallopClient`, `ScallopBuilder`, `ScallopQuery`, or `ScallopUtils` **and** you weren't importing the old static constant objects directly, most of your code keeps working once you bump deps and runtime.

This guide is split into two parts:

- **Part A** covers the defining v1 break — static constants → runtime `ScallopConstants` (v2.0.0).
- **Part B** is short and defers to [`V2_TO_V4.md`](V2_TO_V4.md) for the full v2 → v4 detail (which in turn links to [`V3_TO_V4.md`](V3_TO_V4.md) for the v4 specifics).

For the _why_ behind any change, the authoritative source is [`CHANGELOG.md`](../CHANGELOG.md). For the new SDK shape, see [`SDK_STRUCTURE.md`](SDK_STRUCTURE.md).

> **Honesty note:** v1 predates the detailed changelog entries, so this guide does **not** reproduce exact v1 API symbol names. Part A describes the _shift_ conceptually and points at the v2.0.0 changelog entry. If you have a v1 app that imported constant objects directly, treat the diffs below as the pattern, not a 1:1 symbol map.

---

## Quick checklist

This consolidates **every** step from v1 all the way to v4.

```
□ Stop importing static constant objects from the SDK — resolve constants at runtime instead (Part A)
   → use the facades (they resolve constants on init()), or getScallopConstants(), or constants.address
□ Bump @scallop-io/sui-scallop-sdk to ^4.0.0
□ Install @mysten/sui@^2 in your own deps (now a peer dependency)
□ Install / bump @scallop-io/sui-kit to ^2
□ Update Node to >=22 in CI and local engines
□ Project must be ESM ("type": "module")
□ Migrate quick-method calls to OBJECT parameters (v2.2.0 break)
□ Rename deposit → supply / addCollateral → depositCollateral (old names **removed in v4**)
□ Update tx-result access → (result.Transaction ?? result.FailedTransaction).status.success
□ Update object access → .object / .json (no nested .data.content / .fields)
□ Replace constants instanceof ScallopAddress → constants.address instanceof ScallopAddress (v4 composition)
□ Stop mutating constants.whitelist / constants.poolAddresses (frozen in v4)
□ Drop ScallopIndexer / ScallopSuiKit / ScallopAxios usage (removed in v4)
□ Optionally adopt subpath imports (/client /query /builder /errors /logger /types) + module-grouped tx view
□ Run typecheck + your tests
```

---

## Part A — v1 → v2: constants became dynamic

### What changed (v2.0.0)

In **v1**, the SDK relied on **static / bundled constants**. Addresses, pool addresses, and the whitelist were shipped _inside_ the SDK package. Adding a new pool or asset meant publishing a new SDK version, and you'd often `import` those constant objects directly to read package IDs, market objects, coin metadata, etc.

**v2.0.0** introduced the `ScallopConstants` class, which **dynamically fetches** addresses / pool-addresses / whitelist from the Scallop API **at runtime**. Assets can be added or removed without an SDK upgrade for each new pool. (See the [v2.0.0 changelog entry](../CHANGELOG.md) — _"all constants in the Scallop SDK will be replaced by the `ScallopConstants` class. This class dynamically fetches necessary data from the API…"_.) **v2.0.1** then added a `getScallopConstants` accessor for grabbing the resolved constants conveniently.

### Practical effect

Code that imported static constant objects directly must instead go through one of:

1. **The SDK facades** (`Scallop`, `ScallopClient`, `ScallopBuilder`, `ScallopQuery`, `ScallopUtils`) — they resolve constants at `init()` time, so the methods you call already have live addresses.
2. **`getScallopConstants()`** (added in v2.0.1) — when you need the resolved constants object directly.
3. **`constants.address`** — the address adapter, for `.get('core.market')`-style lookups (this is the v4-correct accessor; see the next sub-section).

### Migration

```diff
- // v1 — read package IDs / objects straight off a bundled static constant
- import { ADDRESSES, POOL_ADDRESSES } from '@scallop-io/sui-scallop-sdk';
-
- const marketObject = ADDRESSES.mainnet.core.market;
- const suiPool      = POOL_ADDRESSES['sui'];
+ // v2+ — constants are fetched at runtime; go through a facade (auto-init)
+ import { Scallop } from '@scallop-io/sui-scallop-sdk';
+
+ const scallop = new Scallop({ /* networkType, secretKey, ... */ });
+ const query = await scallop.createScallopQuery(); // init() resolves constants
+
+ // Need the raw resolved constants? (getScallopConstants added in v2.0.1)
+ const constants = scallop.getScallopConstants();
+
+ // Address lookups go through the address adapter:
+ const marketObject = constants.address.get('core.market');
```

Because the constants are now fetched, you **must** let the SDK `init()` before you read them. Constructing a facade and calling `await scallop.createScallop*()` handles init automatically; constructing `ScallopConstants` directly requires an explicit `await constants.init()`.

### Dead end to skip: the v2.1 address-merge

> **Heads up — don't build on the v2.1.0 inheritance.**

In **v2.1.0**, `ScallopAddress` was merged **into** `ScallopConstants` as a superclass, so address methods were reachable directly on a `ScallopConstants` instance (and `constants instanceof ScallopAddress` was `true`).

**v4 reversed this.** `ScallopConstants` no longer _extends_ `ScallopAddress` — it now **composes** it at `constants.address`. So if you're jumping v1 → v4, **skip the v2.1 inheritance model entirely**:

- Use `constants.address` for the real `ScallopAddress`.
- `constants.address instanceof ScallopAddress` is the correct check (a bare `constants instanceof ScallopAddress` returns `false` in v4).
- Back-compat forwarders are preserved on `ScallopConstants` (`get`, `set`, `getAddresses`, `setAddresses`, `getId`, `getAllAddresses`, `switchCurrentAddresses`, `queryClient`), so `constants.get('core.market')` still works — but `constants.address.get('core.market')` is the explicit, future-proof form.

Full detail on the composition change is in [`V3_TO_V4.md` § B1](V3_TO_V4.md#b1--scallopconstants-no-longer-extends-scallopaddress).

---

## Part B — v2 → v4: everything else

From v2 onward, your migration is exactly the v2 → v4 path. **See [`V2_TO_V4.md`](V2_TO_V4.md) for the full, step-by-step detail.** The headline items:

- **Quick methods take object parameters** (v2.2.0, BREAKING). Quick methods gradually transitioned to using a single object argument instead of positional args. → [`V2_TO_V4.md`](V2_TO_V4.md)
- **Dependency + runtime bump** (v3.0.0): migrated to `@mysten/sui@2` + `@scallop-io/sui-kit@2`; **Node 22+**, **ESM-only**. → [`V2_TO_V4.md`](V2_TO_V4.md)
- **gRPC client namespace**: API calls now use `SuiGrpcClient` via `client.core.*`. → [`V2_TO_V4.md`](V2_TO_V4.md)
- **Transaction-result access changed**: `result.effects.status.status` → `(result.Transaction ?? result.FailedTransaction).status.success`. A new `devInspectTxn()` (JSON-RPC) bypasses strict gRPC validation. → [`V2_TO_V4.md`](V2_TO_V4.md)
- **Object access changed**: `.data.content` → `.object` / `.json`; nested `.fields` access removed (v2 auto-unwraps). → [`V2_TO_V4.md`](V2_TO_V4.md)
- **Lending naming**: `supply` / `supplyQuick` / `depositCollateral` / `depositCollateralQuick` are canonical (Aave/Compound aligned). Old `deposit` / `depositQuick` / `addCollateral` / `addCollateralQuick` were **removed in v4**. → [`V2_TO_V4.md`](V2_TO_V4.md)
- **v4 structural refactor** (v4.0.0), B1–B6 — each links to its `V3_TO_V4.md` anchor:
  - **B1** — `ScallopConstants` composes `ScallopAddress` instead of extending it (`constants.address`). → [`V3_TO_V4.md` § B1](V3_TO_V4.md#b1--scallopconstants-no-longer-extends-scallopaddress)
  - **B2** — `whitelist` / `poolAddresses` are frozen immutable snapshots (mutation throws). → [`V3_TO_V4.md` § B2](V3_TO_V4.md#b2--whitelist--pooladdresses-are-now-frozen-immutable-snapshots)
  - **B3** — minimum Node 22. → [`V3_TO_V4.md` § B3](V3_TO_V4.md#b3--minimum-node-22)
  - **B4** — public type surface clarified (`/types` subpath; internals under `src/types/internal/`). → [`V3_TO_V4.md` § B4](V3_TO_V4.md#b4--public-type-surface-clarified)
  - **B5** — `@mysten/sui` is now a **peer dependency** (`^2.0.0`); install it yourself. → [`V3_TO_V4.md` § B5](V3_TO_V4.md#b5--mystensui-is-now-a-peer-dependency)
  - **B6** — transport reshaped: `ScallopIndexer`, `ScallopSuiKit`, `ScallopAxios` **removed**. → [`V3_TO_V4.md` § B6](V3_TO_V4.md#b6--transport-reshaped-scallopindexer-scallopsuikit-scallopaxios-removed)
- **v4 opt-in goodies**: subpath imports (`/client`, `/query`, `/builder`, `/errors`, `/logger`, `/types`), module-grouped tx-block view (`tx.core.supplyQuick`), typed errors, pluggable logger, `strictInit`. → [`V3_TO_V4.md` § Optional](V3_TO_V4.md#optional-opt-in-to-v4-only-goodies)

---

## What didn't change

Across the entire v1 → v4 span, at the **facade method level**:

- **Public method signatures and return shapes** on `Scallop`, `ScallopClient`, `ScallopBuilder`, `ScallopQuery`, `ScallopUtils` are preserved (modulo the v2.2.0 object-parameter change to _quick_ methods and the v3 result/object access changes inside what those methods return).
- **Flat tx-block methods** — `tx.supplyQuick`, `tx.stake`, `tx.borrow`, etc. continue to work.
- **The init flow** — `await scallop.createScallopClient()` etc. handle init automatically.

---

## Reporting issues

If you hit a migration snag not covered here:

1. Re-run with `logger: consoleLogger` (v4) to surface the underlying error.
2. Open an issue at https://github.com/scallop-io/sui-scallop-sdk/issues with the error and your v1 → v4 diff.

We treat broken read paths (`getMarketPools`, `getObligationAccount`, etc.) as **regressions**, not breaking changes — please report.
