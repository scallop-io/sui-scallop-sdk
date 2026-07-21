# GraphQL Support

How the SDK reads on-chain data over **Sui GraphQL** as an alternative to gRPC, and
the per-domain query optimizations that GraphQL enables. Companion to
[`SDK_STRUCTURE.md`](./SDK_STRUCTURE.md).

> **Status:** opt-in. Default transport stays gRPC. Validated end-to-end against
> mainnet — `pnpm test tests/integration/query.spec.ts` passes 56/56 with
> `readTransport: 'graphql'`.

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

- `readTransport: 'grpc' | 'graphql'` — default `'grpc'`. Threaded through the whole
  model chain (`Scallop → Client → Builder → Query → Utils`).
- `graphqlUrl` / `graphqlClient` — GraphQL endpoint / preconfigured client. Backs the
  GraphQL balance datasource, which the balance reads use only on the `graphql` transport.
- **Precedence:** an explicit `suiClient` wins; else `readTransport === 'graphql'` builds
  a `SuiGraphQLClient`; else a `SuiGrpcClient`.
- **Guardrail:** injecting `graphqlClient` alone does **not** flip the read transport —
  it only configures the balance datasource. Set `readTransport: 'graphql'` to switch.

---

## 2. Why this is mostly wiring, not a rewrite

The on-chain read path was **already transport-agnostic**. `OnChainDataSource`
([`src/datasources/onchain.ts`](../src/datasources/onchain.ts)) only calls the Sui
**Core API** (`getObjects`, `getDynamicField`, `listDynamicFields`, `listOwnedObjects`,
`getBalance`, `simulateTransaction`, …), and `SuiGraphQLClient` implements every one of
those. So flipping the transport makes **every repository read work over GraphQL**
unchanged. `ScallopUtils` just builds the GraphQL client and hands its `.core` to the
same `OnChainDataSource`.

```
readTransport: 'grpc'     OnChainDataSource → SuiGrpcClient.core     (unchanged default)
readTransport: 'graphql'  OnChainDataSource → SuiGraphQLClient.core  (+ Tier-2 native queries)
```

---

## 3. Transport-level adaptations

GraphQL behaves differently from gRPC in two ways the SDK had to absorb:

### 3a. `getObjects` payload cap (query splitting)

The Sui GraphQL endpoint rejects a query whose payload exceeds **~5000 bytes**. A
50-id `MultiGetObjects` request overflows (~5398 B). `OnChainDataSource` now takes an
optional `maxObjectsPerBatch`; under GraphQL it is `DEFAULT_GRAPHQL_MAX_OBJECTS_PER_BATCH = 25`.
A `getObjects` proxy (`withObjectBatchLimit`) transparently splits a larger `objectIds`
array into ordered ≤25-id sub-batches and merges the results (per-object `Error`s
preserved). This fixes **every** call site — the `getObject` coalescer and all direct
`onchain.client.getObjects(...)` calls — at once. gRPC omits the cap and keeps the
native 50.

### 3b. Rate limiting

Both transports are token-bucket rate limited (default 10 tokens/s). `OnChainDataSource`
throttles every Core call via a proxy; `GraphQLDataSource` throttles each `client.query`
in its own `RateLimiter`. Note these are **independent** buckets, and the registry does
not currently forward a custom `tokensPerSecond` to `GraphQLDataSource` (it uses the
default). See [`GRAPHQL_INTEGRATION_PLAN.md`](../GRAPHQL_INTEGRATION_PLAN.md).

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

- `runWithGraphQLFallback({ preferGraphql, graphql, onchain, … })` — when the GraphQL
  transport is active, try the native query; **on any error fall back to the gRPC path**.
  `preferGraphql` is derived from `readTransport === 'graphql'` in the registry.

So an imperfect/unavailable GraphQL query never breaks a read — it only loses the
optimization.

---

## 5. Query optimizations (gRPC → GraphQL) — REVIEW THESE

Each optimized read is **gated behind `preferGraphql` with a gRPC fallback**, so the
default path is untouched. "Round trips" counts network requests for one logical read
(before internal batching splits).

| #   | Domain / method                                                               | gRPC pattern                                                                                              | GraphQL pattern                                                                                                                                                                                                                                | Round trips                       | Mechanism                                  | Code                                                                                                     |
| --- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| 1   | **poolAddresses** `getPoolAddresses` (onchain rebuild)                        | 1 `getObject` (market) + **~11 paged `listDynamicFields` scans** + 1 batched `getObjects` for values      | 1 market read + **one `listDynamicFieldsWithValues` scan per source table** with values inline; the 4 market-keyed reads (borrowFee/supplyLimit/borrowLimit/isolatedAsset) collapse into a single market scan                                  | ~13 → ~7, no separate value fetch | `listDynamicFieldsWithValues`              | [`poolAddresses/helpers.ts`](../src/repositories/poolAddresses/helpers.ts) `getPoolAddressesFromGraphQL` |
| 2   | **flashloan** `getFlashLoanFees`                                              | full `listDynamicFields` scan of the fee table + batched `getObjects` for values                          | one `listDynamicFieldsWithValues` scan, values inline                                                                                                                                                                                          | 2+ → 1                            | `listDynamicFieldsWithValues`              | [`flashloan/helpers.ts`](../src/repositories/flashloan/helpers.ts) `getFlashloanFeesFromGraphQL`         |
| 3   | **obligation** `getObligationNames`                                           | `listOwnedObjects` (keys) + **N `getDynamicField`** on the global naming registry                         | `listOwnedObjects` + **one aliased `multiGetDynamicFields`** (N→1)                                                                                                                                                                             | 1+N → 1+1                         | `multiGetDynamicFields`                    | [`obligation/helpers.ts`](../src/repositories/obligation/helpers.ts) `getObligationNamesFromGraphQL`     |
| 4   | **veSca** `getVeScasByAddress`                                                | `listOwnedObjects` (keys) + **N `getDynamicField`** on the global veSca table                             | `listOwnedObjects` + **derive field ids offline** (`deriveDynamicFieldID`) + **one chunked `getObjects`** (N→1); parses value via `content` + `VeScaBcs` to preserve the field object's `version`/`digest` (tx ref)                            | 1+N → 1+1                         | derive-ids + batched `getObjects`          | [`veSca/helpers.ts`](../src/repositories/veSca/helpers.ts) `getVeScasByAddressBatchedFromOnChain`        |
| 5   | **coinBalance** `getCoinAmounts` / `getSCoinAmounts` / `getMarketCoinAmounts` | `listBalances` pages **every** balance the address holds, then filters client-side to the requested coins | resolve names → coin types, then **one `multiGetBalances`** for exactly those types (chunked ≤15 under the payload cap); absent types default to `0`. Uses the gRPC `listBalances`-all path when the transport is grpc (or on GraphQL failure) | full wallet scan → 1 (or ⌈N/15⌉)  | `multiGetBalances` (+ gRPC `listBalances`) | [`coinBalance/helpers.ts`](../src/repositories/coinBalance/helpers.ts) `getAmountsByCoinType`            |

**Why #3 and #4 differ:** both are owner-key → _global-table_ lookups, so a full table
scan would be an **anti-optimization** (scanning every user's entries to find one user's
few). #3 fetches only the value string, so the aliased `dynamicField` batch is perfect.
#4 needs the field object's `version`/`digest` (a tx-building ref) that the aliased
`dynamicField` query does **not** expose — so it derives ids + batches `getObjects`,
which is transport-agnostic (also helps gRPC when opted in) and keeps the ref.

**#5 follows the read transport** (like every other row). `getCoinAmounts` & friends
pass `ctx.preferGraphql` (derived from `readTransport === 'graphql'`) into
`runWithGraphQLFallback`: on the **graphql** transport they use `multiGetBalances`; on
**grpc** they read balances straight from the fullnode via `listBalances`. This matters
for **read-after-write freshness** — the GraphQL indexer trails the fullnode by a
checkpoint or two, so serving balances from it right after a supply/withdraw showed a
stale amount; the gRPC fullnode reflects the write immediately. (Earlier revisions forced
`preferGraphql: true` here regardless of transport, on the assumption the gRPC balance
service was unstable; that was reverted once it caused stale post-write balances.)
Either way the fallback pager carries a cursor-advance safety net (stop if `hasNextPage`
is reported but the cursor doesn't advance), which also neutralizes the old GraphQL
infinite-loop hazard where the transport `listBalances` adapter ignored the cursor.

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
- **Fallback everywhere:** every Tier-2 read runs through `runWithGraphQLFallback` — a
  GraphQL failure logs a warning and drops to the gRPC path.
- **Parity by construction:** optimized paths reuse the existing parse/BCS helpers
  (`VeScaBcs`, the per-domain `TypeName`/coin-type parsers) so output equals the gRPC
  path. veSca even shares a pure `computeVeSca` between both paths.
- **Validation:** unit tests mock each native method; `tests/integration/query.spec.ts`
  (fixture `readTransport: 'graphql'`) passed 56/56 against mainnet.

## 8. Known follow-ups

- `GraphQLDataSource` ignores a custom `tokensPerSecond` (uses the default) — see §3b.

### Resolved

- The amount readers now use `multiGetBalances` (§5 row 5) with a gRPC `listBalances`-all
  fallback (`listAllBalancesAsMap`). The old infinite-loop hazard is neutralized by a
  cursor-advance safety net in that pager. The debug `console.log`s were removed.
- `getObjects` and `multiGetBalances` both **chunk** to stay under the GraphQL ~5000-byte
  query-payload cap.
