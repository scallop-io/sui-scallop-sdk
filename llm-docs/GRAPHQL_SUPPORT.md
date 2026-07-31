# GraphQL Support

How the SDK reads on-chain data over **Sui GraphQL** as an alternative to gRPC, and
the per-domain query optimizations that GraphQL enables. Companion to
[`SDK_STRUCTURE.md`](./SDK_STRUCTURE.md).

> **Status:** opt-in, full read-transport parity. Default transport stays gRPC.
> `tests/integration/query-graphql.spec.ts` (the `graphQLScallopSDK` fixture) runs the
> same read suite as `query.spec.ts` end-to-end against mainnet on the graphql transport.
> §1–§7 document the shipped behavior; [§8](#8-design-rationale--why-transport-parity-is-free)
> is the design rationale (why this was a wiring change, not 30 hand-written queries).

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

- `readTransport: 'grpc' | 'graphql'` — default `'grpc'`. Selects the Core read client
  **wholesale** (see §2): `'grpc'` → a `SuiGrpcClient` built from `fullnodeUrl`;
  `'graphql'` → the `SuiGraphQLClient` itself. It also flips `preferGraphql`, so repos
  with a fewer-round-trip native GraphQL query additionally prefer it over the (now
  GraphQL-backed) generic Core path — an optimization on top of the transport switch,
  not the mechanism providing it.
- `graphqlUrl` / `graphqlClient` — GraphQL endpoint / preconfigured client. On the
  graphql transport this backs **both** the Core read path and `GraphQLDataSource` (the
  native-primitives datasource: `multiGetBalances` and `multiGetDynamicFields`).
- **Precedence (Core client):** on `'grpc'`, an explicit `suiClient` wins (used as-is),
  else a `SuiGrpcClient` is built from `fullnodeUrl`. On `'graphql'`, an explicit
  `graphqlClient` wins, else a `SuiGraphQLClient` is built from `graphqlUrl`.
  `fullnodeUrl` is still accepted on the graphql transport but no longer builds the Core
  client there — it only configures the independent write-path `SuiKit`
  (`builder.executor`), which always uses gRPC regardless of `readTransport`.

---

## 2. Two datasources: transport-selected Core + native GraphQL primitives

There are two read datasources. `GrpcDataSource` is **transport-selected** (its class name
is historical); `GraphQLDataSource` is native-primitive-only:

- **`GrpcDataSource`** ([`src/datasources/grpc.ts`](../src/datasources/grpc.ts)) — the
  Core-API read path (`getObjects`, `getDynamicField`, `listDynamicFields`,
  `listOwnedObjects`, `getBalance`, `simulateTransaction`, …). It wraps whichever client
  `initReadClients` selected for `readTransport` — a `SuiGrpcClient.core` on
  `'grpc'`, a `SuiGraphQLClient.core` on `'graphql'` — because both satisfy
  `ClientWithCoreApi` and implement the same `TransportMethods` contract (see
  [`SDK_STRUCTURE.md` §1](./SDK_STRUCTURE.md) and §8). On `'graphql'` it also caps
  `getObjects` batches at `DEFAULT_GRAPHQL_MAX_OBJECTS_PER_BATCH` (25) to stay under the
  ~5000-byte query-payload limit (see §3a), and its cache keys are namespaced by
  `graphqlUrl` instead of `fullnodeUrl`.
- **`GraphQLDataSource`** ([`src/datasources/graphql/`](../src/datasources/graphql/)) —
  GraphQL-**native** primitives the generic Core path can't express in one round trip
  (`multiGetBalances`, `multiGetDynamicFields`).

`readTransport: 'graphql'` routes **every** Core read over GraphQL end-to-end — this is a
full transport switch, not an opportunistic optimization. `preferGraphql` is a second,
independent flip: repos that _have_ a native GraphQL query additionally prefer it
(strictly — see §4) over the generic (already GraphQL-backed) Core path, since the native
query is fewer round trips. Everything on `'grpc'` stays on gRPC throughout.

```
readTransport: 'grpc'     Core reads → GrpcDataSource (gRPC)     ; native reads: n/a       (default)
readTransport: 'graphql'  Core reads → GrpcDataSource (GraphQL)  ; native reads → GraphQLDataSource
```

On `readTransport: 'graphql'`, `initReadClients` swaps the Core read client
to the `SuiGraphQLClient` (see §8), so
every Core read runs over GraphQL. The ~5000-byte payload cap is handled by
`maxObjectsPerBatch` (§3a). Verified end-to-end: the full mainnet read suite
(`query-graphql.spec.ts`) passes against the GraphQL-backed Core client.

---

## 3. Transport-level adaptations

GraphQL behaves differently from gRPC in two ways the SDK had to absorb:

### 3a. GraphQL payload cap (query splitting) — `GraphQLDataSource`-internal

The Sui GraphQL endpoint rejects a query whose payload exceeds **~5000 bytes**. This
cap is now purely a `GraphQLDataSource` concern: its own native queries
(`multiGetBalances`, and the `getObjects`-style value fetches behind
`multiGetDynamicFields`) **chunk** their input arrays
into sub-batches that stay under the limit and merge the results (per-object `Error`s
preserved).

The Core read path **is** affected when it's GraphQL-backed: on the `'grpc'` transport
`GrpcDataSource` keeps its native 50-ids-per-`getObjects` batch (no cap needed — gRPC has
no payload limit); on `'graphql'` the registry passes
`maxObjectsPerBatch: DEFAULT_GRAPHQL_MAX_OBJECTS_PER_BATCH` (25), so oversized `getObjects`
requests are transparently split into ordered sub-batches and merged (see
[`withObjectBatchLimit`](../src/datasources/grpc.ts)).

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
([`src/datasources/graphql/`](../src/datasources/graphql/)), both self-caching and
rate-limited, that gRPC's Core API can't express in one round trip:

| Method                                     | What it does                                                                                                                                       | gRPC equivalent                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `multiGetDynamicFields(parentId, names[])` | Fetches **N specific fields by name** in one aliased query (`f0: dynamicField(name:…) f1: …`), chunked, aligned to input order (missing → `null`). | N separate `getDynamicField` calls. |
| `multiGetBalances(address, coinTypes[])`   | Balances for a known set of coin types (chunked ≤15/query under the payload cap, merged).                                                          | No multi-coin balance call.         |

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

| #   | Domain / method                                                               | gRPC pattern                                                                                              | GraphQL pattern                                                                                                                                                                                                        | Round trips                       | Mechanism                                                      | Code                                                                                                     |
| --- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 1   | **poolAddresses** `getPoolAddresses` (onchain rebuild)                        | 1 `getObject` (market) + **~11 paged `listDynamicFields` scans** + 1 batched `getObjects` for values      | 1 market read + **one `listDynamicFieldsWithValues` scan per source table** with values inline; the 4 market-keyed reads (borrowFee/supplyLimit/borrowLimit/isolatedAsset) collapse into a single market scan          | ~13 → ~7, no separate value fetch | `listDynamicFieldsWithValues`                                  | [`poolAddresses/helpers.ts`](../src/repositories/poolAddresses/helpers.ts) `getPoolAddressesFromGraphQL` |
| 2   | **flashloan** `getFlashLoanFees`                                              | full `listDynamicFields` scan of the fee table + batched `getObjects` for values                          | one `listDynamicFieldsWithValues` scan, values inline                                                                                                                                                                  | 2+ → 1                            | `listDynamicFieldsWithValues`                                  | [`flashloan/helpers.ts`](../src/repositories/flashloan/helpers.ts) `getFlashloanFeesFromGraphQL`         |
| 3   | **obligation** `getObligationNames`                                           | `listOwnedObjects` (keys) + **N `getDynamicField`** on the global naming registry                         | `listOwnedObjects` + **one aliased `multiGetDynamicFields`** (N→1)                                                                                                                                                     | 1+N → 1+1                         | `multiGetDynamicFields`                                        | [`obligation/helpers.ts`](../src/repositories/obligation/helpers.ts) `getObligationNamesFromGraphQL`     |
| 4   | **veSca** `getVeScasByAddress`                                                | `listOwnedObjects` (keys) + **N `getDynamicField`** on the global veSca table                             | `listOwnedObjects` + **derive field ids offline** (`deriveDynamicFieldID`) + **one chunked `getObjects`** (N→1); parses value via `content` + `VeScaBcs` to preserve the field object's `version`/`digest` (tx ref)    | 1+N → 1+1                         | derive-ids + batched `getObjects`                              | [`veSca/helpers.ts`](../src/repositories/veSca/helpers.ts) `getVeScasByAddressBatchedFromOnChain`        |
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

| Domain                                                                                                 | Reason                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **xOracle** `getAssetOracles` / switchboard registry                                                   | Already calls `listDynamicFields({ include: { value: true } })` — values already come back inline in one round trip. Works over GraphQL transport unchanged.                                                                                                                                                                             |
| **market** `getMarkets`, **obligation** data, **borrowIncentive** pools/accounts, **spool**, **price** | Use Move `*_query` `simulateTransaction` (devInspect), which returns everything in one call already — a native GraphQL query can't collapse them further. No per-domain rewrite needed: `simulateTransaction` is a Core `TransportMethods` member, so on the graphql transport it already runs over GraphQL via the swapped Core client. |
| **borrowIncentive** bindings, **loyaltyProgram**, **veScaLoyaltyProgram**                              | Single `getObject` + single `getDynamicField` lookups — 1–2 round trips, nothing to collapse.                                                                                                                                                                                                                                            |
| **addressApi**                                                                                         | Pure REST (Scallop API), not on-chain.                                                                                                                                                                                                                                                                                                   |

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
- **Validation:** unit tests mock each native method; `tests/integration/query-graphql.spec.ts`
  (the `graphQLScallopSDK` fixture, `readTransport: 'graphql'`) runs the full read suite
  against mainnet, exercising every Core read (incl. `simulateTransaction`-backed
  reads) over the GraphQL-backed Core client.

---

## 8. Design rationale — why transport parity is free

The goal was to make GraphQL a **complete alternate read transport**, so `readTransport`
selects the read layer wholesale and a deployment with no gRPC egress can run 100% over
GraphQL. That landed as a wiring change rather than 30 hand-written GraphQL queries, for
one reason: in `@mysten/sui`, **both** transport clients already implement the entire Core
API.

- `class SuiGrpcClient extends BaseClient implements SuiClientTypes.TransportMethods` → `core: GrpcCoreClient`
- `class SuiGraphQLClient extends BaseClient implements SuiClientTypes.TransportMethods` → `core: GraphQLCoreClient`

`GraphQLCoreClient` implements — **at runtime**, verified in
`node_modules/@mysten/sui/dist/graphql/core.mjs` — `getObjects`, `getObject`,
`listOwnedObjects`, `listCoins`, `getBalance`, `listBalances`, `getDynamicField`,
`listDynamicFields`, `getCoinMetadata`, `getTransaction`, `getReferenceGasPrice`,
`getProtocolConfig`, `getCurrentSystemState`, `getMoveFunction`, `getChainIdentifier`,
`defaultNameServiceName`, **and `simulateTransaction`** (it runs the GraphQL
`simulateTransaction` query and does the BCS resolution internally). That is exactly the
`CORE_METHODS` set in [`../src/datasources/types.ts`](../src/datasources/types.ts).

**Consequence:** correctness parity across transports is free. Every repo read that goes
through the Core datasource works over GraphQL simply by backing that datasource with
`graphqlClient.core` instead of a gRPC client — no per-read GraphQL port, and no
`dryRunTransactionBlock` decoder, since `simulateTransaction` is already a Core method on
the GraphQL client. The infra was designed for this: `createGrpcDataSource` already took a
`maxObjectsPerBatch` cap documented as _"Set (to a sub-50 cap) only for the GraphQL
transport, whose query-payload limit rejects large multiGetObjects requests."_ — that path
just wasn't wired. GraphQL's **only** differentiator is that a few reads have a
fewer-call variant via query flexibility (the `GraphQLDataSource` native primitives, §4),
which is why those stay an optimization layer rather than a correctness requirement.

**Scope:** the on-chain read path **and** simulation (both Core methods → free). Writes /
signing are always gRPC (`SuiKit` / `builder.executor`). Indexer/API (`api` / `api-first`)
reads are a separate axis — GraphQL only ever replaces the on-chain leg.

### Fail-loud, reframed

An earlier design framed fail-loud around per-read GraphQL ports ("throw when a read has
no GraphQL implementation"). With the client-swap approach that mostly dissolves: in
graphql mode the Core client _is_ GraphQL, so every Core read runs over GraphQL by
construction and there is nothing to silently fall back to. The residual concern is
narrower — a repo calling a Core method `GraphQLCoreClient` doesn't implement. Two
mitigations: the method won't exist on the GraphQL core client, so it surfaces as a clear
runtime `TypeError`; and `runByReadTransport` keeps its strict-by-transport behavior for
the optimization layer (§4), where a failing native GraphQL query propagates rather than
silently degrading to gRPC. An audit of `CORE_METHODS` against `GraphQLCoreClient` shows
full coverage, including `simulateTransaction`.

### Verified before shipping

- **Method coverage.** Every `CORE_METHODS` entry audited against `graphql/core.mjs`,
  including the specific option shapes the repos pass (`include: { json: true }` vs `bcs`).
- **Payload cap.** `maxObjectsPerBatch` is set on the GraphQL-backed Core datasource, so
  `getObjects` / `listOwnedObjects` batches stay under the ~5000-byte query limit (§3a).
- **Rate limiting.** The graphql-backed Core path is neither double-limited nor unlimited;
  both datasources share the resolved `tokensPerSecond` (§3b).
- **`json` vs `bcs` fidelity.** Repo parsers (`parseObjectAs`, per-domain `utils.ts`)
  consume the same `json` shape on both transports, validated against real objects —
  including the nested Move struct / `TypeName` differences `moveTypeMapper` handles.
- **Writes stay gRPC.** Unchanged write/executor path.

## 9. Known follow-ups

- **Native-query optimizations are opportunistic.** Extending the `GraphQLDataSource`
  optimization layer (§4–§5) where profiling shows the generic Core path is call-heavy is
  ongoing, pure perf work — not a correctness gap.

### Resolved

- `GraphQLDataSource` now receives `tokensPerSecond` threaded through the registry
  (`RepositoryDeps`, forwarded by `ScallopQuery`) instead of silently defaulting, so it
  shares the on-chain transport's cap — see §3b.
- The amount readers use `multiGetBalances` on the graphql transport and the gRPC
  `listBalances`-all path (`listAllBalancesAsMap`) on the grpc transport, selected strictly
  by transport (no cross-transport fallback).
- The gRPC `listBalances`-all scan is now memoised under one `getAllCoinBalances` cache
  key, so the coin / sCoin / market-coin amount readers share a single wallet scan per
  `node + address` instead of each re-paging every balance.
- `getObjects` and `multiGetBalances` both **chunk** to stay under the GraphQL ~5000-byte
  query-payload cap.
