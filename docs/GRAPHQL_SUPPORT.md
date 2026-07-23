# GraphQL Support

How the SDK reads on-chain data over **Sui GraphQL** as an alternative to gRPC, and
the per-domain query optimizations that GraphQL enables. Companion to
[`SDK_STRUCTURE.md`](./SDK_STRUCTURE.md).

> **Status:** opt-in. Default transport stays gRPC. Re-run
> `pnpm test tests/integration/query.spec.ts` with `readTransport: 'graphql'`
> against mainnet to validate the current two-datasource model end-to-end.

---

## 1. Enabling it

```ts
const sdk = new Scallop({
  addressId: '695fcdc084f790c04eb068dc',
  network: 'mainnet',
  fullnodeUrl: 'https://fullnode.mainnet.sui.io:443', // gRPC endpoint
  readTransport: 'graphql', // ← opt in
  // graphqlUrl defaults to https://graphql.mainnet.sui.io/graphql
  // graphqlClient?: SuiGraphQLClient  // full transport override
});
```

- `readTransport: 'grpc' | 'graphql'` — default `'grpc'`. It no longer selects the Core
  read client (that is always gRPC — see §2); it only flips `preferGraphql`, so repos with
  a native GraphQL query prefer it.
- `graphqlUrl` / `graphqlClient` — GraphQL endpoint / preconfigured client backing
  `GraphQLDataSource` (the native-primitives datasource: `multiGetBalances` and the
  dynamic-field walkers). Used whenever a native GraphQL read runs.
- **Precedence (Core client):** an explicit `suiClient` wins (used as-is); otherwise the
  Core read client is **always** a `SuiGrpcClient` built against `fullnodeUrl`.
- **Guardrail:** `readTransport: 'graphql'` does **not** move the Core path onto GraphQL —
  Core is always gRPC. It only enables `preferGraphql` so native GraphQL reads are used
  where one exists. `graphqlUrl` / `graphqlClient` configure `GraphQLDataSource` only.

---

## 2. Two datasources: Core (gRPC) + native GraphQL primitives

There are two read datasources, split by **role**, not by a switchable transport:

- **`GrpcDataSource`** ([`src/datasources/grpc.ts`](../src/datasources/grpc.ts)) — the
  Core-API read path (`getObjects`, `getDynamicField`, `listDynamicFields`,
  `listOwnedObjects`, `getBalance`, `simulateTransaction`, …). It is **always gRPC**.
- **`GraphQLDataSource`** ([`src/datasources/graphql.ts`](../src/datasources/graphql.ts)) —
  GraphQL-**native** primitives the Core API can't express in one round trip
  (`multiGetBalances`, `listDynamicFieldsWithValues`, `multiGetDynamicFields`).

`readTransport: 'graphql'` no longer routes the Core path over GraphQL. It only flips
`preferGraphql`, so repos that *have* a native GraphQL query prefer it (strictly — see
§4); everything else stays on gRPC.

```
readTransport: 'grpc'     Core reads → GrpcDataSource (gRPC)        (default)
readTransport: 'graphql'  Core reads → GrpcDataSource (gRPC);  native reads → GraphQLDataSource
```

> **History:** an earlier revision made `OnChainDataSource` transport-agnostic and ran
> the *entire* Core path over `SuiGraphQLClient.core` when `readTransport: 'graphql'`.
> That "Core-over-GraphQL" mode was removed — it carried GraphQL-only quirks (the
> ~5000-byte payload cap forcing `maxObjectsPerBatch`, and a `listBalances` cursor bug)
> for reads that are happier on gRPC. GraphQL is now used only where it's a native win.

---

## 3. Transport-level adaptations

GraphQL behaves differently from gRPC in two ways the SDK had to absorb:

### 3a. GraphQL payload cap (query splitting) — `GraphQLDataSource`-internal

The Sui GraphQL endpoint rejects a query whose payload exceeds **~5000 bytes**. This
cap is now purely a `GraphQLDataSource` concern: its own native queries
(`multiGetBalances`, and the `getObjects`-style value fetches behind
`listDynamicFieldsWithValues` / `multiGetDynamicFields`) **chunk** their input arrays
into sub-batches that stay under the limit and merge the results (per-object `Error`s
preserved).

The Core read path is unaffected — `GrpcDataSource` always talks gRPC, which has no
~5000-byte cap and keeps its native 50-ids-per-`getObjects` batch. The old Core-path
`maxObjectsPerBatch` / `DEFAULT_GRAPHQL_MAX_OBJECTS_PER_BATCH = 25` splitting existed
only to paper over the removed Core-over-GraphQL mode and no longer applies.

### 3b. Rate limiting

Both datasources are token-bucket rate limited (default 10 tokens/s). `GrpcDataSource`
throttles every Core call via a proxy; `GraphQLDataSource` throttles each `client.query`
in its own `RateLimiter`. These are **independent** buckets, but the registry now forwards
the resolved `tokensPerSecond` (a `RepositoryDeps` field, forwarded by `ScallopQuery`) to `GraphQLDataSource`, so
both datasources are capped under the **same** policy value instead of the GraphQL side
silently defaulting.

**Tuning:** the 10 tokens/s default protects shared public fullnodes. If your app points
the SDK at a suitably provisioned RPC endpoint you control, pass a higher `tokensPerSecond`
at construction — it flows to both the gRPC and GraphQL buckets. Do not raise it against
a public endpoint. Note also that the browser CORS `OPTIONS` preflights seen in a network
trace are **not** SDK transport calls; reducing them is an app-side concern (same-origin
proxying / server-side aggregation), out of scope for the SDK.

---

## 4. Native GraphQL primitives

Two reusable methods on `GraphQLDataSource`
([`src/datasources/graphql.ts`](../src/datasources/graphql.ts)), both self-caching and
rate-limited, that gRPC's Core API can't express in one round trip:

| Method                                     | What it does                                                                                                                                       | gRPC equivalent                                                               |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `listDynamicFieldsWithValues(parentId)`    | Pages a table returning each field's **name + value inline**; derives `fieldId` via `deriveDynamicFieldID` (matches Core).                         | `listDynamicFields` (metadata only) **+** a separate `getObjects` for values. |
| `multiGetDynamicFields(parentId, names[])` | Fetches **N specific fields by name** in one aliased query (`f0: dynamicField(name:…) f1: …`), chunked, aligned to input order (missing → `null`). | N separate `getDynamicField` calls.                                           |
| `multiGetBalances(address, coinTypes[])`   | Balances for a known set of coin types (chunked ≤15/query under the payload cap, merged).                                                          | No multi-coin balance call.                                                   |

Selection of which path runs is centralized in
[`src/repositories/utils.ts`](../src/repositories/utils.ts):

- `runByReadTransport({ preferGraphql, graphql, onchain, … })` — selects the path
  **strictly by transport**: the native GraphQL query when the GraphQL transport is
  active, else the gRPC/Core path. `preferGraphql` is derived from
  `readTransport === 'graphql'` in the registry.

There is **no automatic cross-transport fallback**: `readTransport: 'graphql'` means
all-GraphQL and `'grpc'` means all-gRPC. A failing native GraphQL query **propagates its
error** rather than silently degrading to the Core path — failing loud surfaces a broken
query instead of masking it as a silent perf regression. (A prior revision fell back to
the gRPC/Core path on any GraphQL error; that was removed to make the transport strict.)

---

## 5. Query optimizations (gRPC → GraphQL) — REVIEW THESE

Each optimized read is **gated behind `preferGraphql` (strict — no cross-transport
fallback)**, so the default (grpc) path is untouched and the graphql path runs only the
native query. "Round trips" counts network requests for one logical read (before internal
batching splits).

| #   | Domain / method                                                               | gRPC pattern                                                                                              | GraphQL pattern                                                                                                                                                                                                                                | Round trips                       | Mechanism                                  | Code                                                                                                     |
| --- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 1   | **poolAddresses** `getPoolAddresses` (onchain rebuild)                        | 1 `getObject` (market) + **~11 paged `listDynamicFields` scans** + 1 batched `getObjects` for values      | 1 market read + **one `listDynamicFieldsWithValues` scan per source table** with values inline; the 4 market-keyed reads (borrowFee/supplyLimit/borrowLimit/isolatedAsset) collapse into a single market scan                                  | ~13 → ~7, no separate value fetch | `listDynamicFieldsWithValues`              | [`poolAddresses/helpers.ts`](../src/repositories/poolAddresses/helpers.ts) `getPoolAddressesFromGraphQL` |
| 2   | **flashloan** `getFlashLoanFees`                                              | full `listDynamicFields` scan of the fee table + batched `getObjects` for values                          | one `listDynamicFieldsWithValues` scan, values inline                                                                                                                                                                                          | 2+ → 1                            | `listDynamicFieldsWithValues`              | [`flashloan/helpers.ts`](../src/repositories/flashloan/helpers.ts) `getFlashloanFeesFromGraphQL`         |
| 3   | **obligation** `getObligationNames`                                           | `listOwnedObjects` (keys) + **N `getDynamicField`** on the global naming registry                         | `listOwnedObjects` + **one aliased `multiGetDynamicFields`** (N→1)                                                                                                                                                                             | 1+N → 1+1                         | `multiGetDynamicFields`                    | [`obligation/helpers.ts`](../src/repositories/obligation/helpers.ts) `getObligationNamesFromGraphQL`     |
| 4   | **veSca** `getVeScasByAddress`                                                | `listOwnedObjects` (keys) + **N `getDynamicField`** on the global veSca table                             | `listOwnedObjects` + **derive field ids offline** (`deriveDynamicFieldID`) + **one chunked `getObjects`** (N→1); parses value via `content` + `VeScaBcs` to preserve the field object's `version`/`digest` (tx ref)                            | 1+N → 1+1                         | derive-ids + batched `getObjects`          | [`veSca/helpers.ts`](../src/repositories/veSca/helpers.ts) `getVeScasByAddressBatchedFromOnChain`        |
| 5   | **coinBalance** `getCoinAmounts` / `getSCoinAmounts` / `getMarketCoinAmounts` | `listBalances` pages **every** balance the address holds, then filters client-side to the requested coins | resolve names → coin types, then **one `multiGetBalances`** for exactly those types (chunked ≤15 under the payload cap); absent types default to `0`. Uses the gRPC `listBalances`-all path when the transport is grpc | full wallet scan → 1 (or ⌈N/15⌉)  | `multiGetBalances` / gRPC `listBalances` (strict by transport) | [`coinBalance/helpers.ts`](../src/repositories/coinBalance/helpers.ts) `getAmountsByCoinType`            |

**Why #3 and #4 differ:** both are owner-key → _global-table_ lookups, so a full table
scan would be an **anti-optimization** (scanning every user's entries to find one user's
few). #3 fetches only the value string, so the aliased `dynamicField` batch is perfect.
#4 needs the field object's `version`/`digest` (a tx-building ref) that the aliased
`dynamicField` query does **not** expose — so it derives ids + batches `getObjects`,
which is transport-agnostic (also helps gRPC when opted in) and keeps the ref.

**#5 follows the read transport** (like every other row). `getCoinAmounts` & friends
pass `ctx.preferGraphql` (derived from `readTransport === 'graphql'`) into
`runByReadTransport`: on the **graphql** transport they use `multiGetBalances`; on
**grpc** they read balances straight from the fullnode via the shared `listBalances`
snapshot. This matters for **read-after-write freshness** — the GraphQL indexer trails
the fullnode by a checkpoint or two, so serving balances from it right after a
supply/withdraw showed a stale amount; the gRPC fullnode reflects the write immediately.
(Earlier revisions forced `preferGraphql: true` here regardless of transport, on the
assumption the gRPC balance service was unstable; that was reverted once it caused stale
post-write balances.) The gRPC pager carries a cursor-advance safety net (stop if
`hasNextPage` is reported but the cursor doesn't advance), which also neutralizes the old
GraphQL infinite-loop hazard where the transport `listBalances` adapter ignored the
cursor.

> **Cache-invalidation note (dApp consumers).** The GraphQL balance read self-caches
> under `queryKeys.rpc.getCoinBalancesByTypes` (address + coin-type set), a **different**
> key from the old `getAllCoinBalances`. Consumers that invalidate balances after a tx
> must also invalidate the `['rpc', 'getCoinBalancesByTypes']` prefix, or a refetch of a
> parent query (e.g. `getLendings`) will re-read the stale cached balance.

---

## 6. Deliberately NOT rewritten (and why)

| Domain                                                                                                 | Reason                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **xOracle** `getAssetOracles` / switchboard registry                                                   | Already calls `listDynamicFields({ include: { value: true } })` — values already come back inline in one round trip. Works over GraphQL transport unchanged.                                       |
| **market** `getMarkets`, **obligation** data, **borrowIncentive** pools/accounts, **spool**, **price** | Use Move `*_query` `simulateTransaction` (devInspect), which returns everything in one call already — GraphQL can't collapse them further. They still benefit from Tier-1 transport compatibility. |
| **borrowIncentive** bindings, **loyaltyProgram**, **veScaLoyaltyProgram**                              | Single `getObject` + single `getDynamicField` lookups — 1–2 round trips, nothing to collapse.                                                                                                      |
| **addressApi**                                                                                         | Pure REST (Scallop API), not on-chain.                                                                                                                                                             |

(coinBalance is now optimized — see §5 row 5.)

---

## 7. Safety model

- **Opt-in:** gRPC remains the default; nothing changes unless `readTransport: 'graphql'`.
- **Strict transport (no fallback):** every Tier-2 read runs through `runByReadTransport`,
  which selects the native GraphQL path or the gRPC path by transport and does **not**
  cross over. A failing GraphQL query propagates (fail loud), so a broken native query is
  visible rather than masked as a silent perf regression.
- **Parity by construction:** optimized paths reuse the existing parse/BCS helpers
  (`VeScaBcs`, the per-domain `TypeName`/coin-type parsers) so output equals the gRPC
  path. veSca even shares a pure `computeVeSca` between both paths.
- **Validation:** unit tests mock each native method; `tests/integration/query.spec.ts`
  (fixture `readTransport: 'graphql'`) passed 56/56 against mainnet.

## 8. Known follow-ups

_(none open)_

### Resolved

- `GraphQLDataSource` now receives `tokensPerSecond` threaded through the registry
  (`RepositoryDeps`, forwarded by `ScallopQuery`) instead of silently defaulting, so it
  shares the on-chain transport's cap — see §3b.
- The amount readers use `multiGetBalances` on the graphql transport and the gRPC
  `listBalances`-all path (`listAllBalancesAsMap`) on the grpc transport, selected strictly
  by transport (no cross-transport fallback). The old infinite-loop hazard is neutralized
  by a cursor-advance safety net in that pager. The debug `console.log`s were removed.
- The gRPC `listBalances`-all scan is now memoised under one `getAllCoinBalances` cache
  key, so the coin / sCoin / market-coin amount readers share a single wallet scan per
  `node + address` instead of each re-paging every balance.
- `getObjects` and `multiGetBalances` both **chunk** to stay under the GraphQL ~5000-byte
  query-payload cap.
