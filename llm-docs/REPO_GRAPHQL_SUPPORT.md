# Repository GraphQL Support — Implementation Plan

> **Status: IMPLEMENTED (Phase A + B + D).** The Core datasource is now backed by the
> GraphQL client on `readTransport: 'graphql'`, giving full read-transport switchability.
> Verified end-to-end against mainnet: `tests/integration/query-graphql.spec.ts` 56/56 +
> `query.spec.ts` 57/57, unit suite 356/356, typecheck + build green. Remaining: Phase C
> (optional native-query optimizations) is ongoing/opportunistic.
> **Companion:** [`GRAPHQL_SUPPORT.md`](GRAPHQL_SUPPORT.md) documents the shipped behavior;
> [`SDK_STRUCTURE.md` §1](SDK_STRUCTURE.md) has the architecture summary. This doc is the
> design rationale + record of what changed.

---

## 1. Goal & principle

Make GraphQL a **complete alternate read transport**, so `readTransport` selects the read layer
wholesale and a deployment with no gRPC egress can run 100% over GraphQL.

**The key realization (this is why the work is small):** in `@mysten/sui`, **both** transport
clients already implement the entire Core API:

- `class SuiGrpcClient extends BaseClient implements SuiClientTypes.TransportMethods` → `core: GrpcCoreClient`
- `class SuiGraphQLClient extends BaseClient implements SuiClientTypes.TransportMethods` → `core: GraphQLCoreClient`

`GraphQLCoreClient` implements — **at runtime**, verified in
`node_modules/@mysten/sui/dist/graphql/core.mjs` — `getObjects`, `getObject`, `listOwnedObjects`,
`listCoins`, `getBalance`, `listBalances`, `getDynamicField`, `listDynamicFields`,
`getCoinMetadata`, `getTransaction`, `getReferenceGasPrice`, `getProtocolConfig`,
`getCurrentSystemState`, `getMoveFunction`, `getChainIdentifier`, `defaultNameServiceName`,
**and `simulateTransaction`** (it runs the GraphQL `simulateTransaction` query and does the BCS
resolution internally). That is exactly the `CORE_METHODS` set in
[`../src/datasources/types.ts`](../src/datasources/types.ts).

**Consequence:** correctness parity across transports is **free**. Every repo read that goes
through the Core datasource works over GraphQL simply by backing that datasource with
`graphqlClient.core` instead of a gRPC client. There is **no** need to hand-write GraphQL
queries per read, and **no** need to decode `dryRunTransactionBlock` — `simulateTransaction` is
already a Core method on the GraphQL client.

GraphQL's **only** differentiator is that a few reads have a more efficient, fewer-call variant
via query flexibility (the `GraphQLDataSource` native primitives — `multiGetBalances`, the nested
dynamic-field walkers). Those stay as an **opt-in optimization layer**, not a correctness
requirement.

**In scope:** the on-chain **read** path **and** simulation (both are Core methods → free).
**Out of scope:** **writes / signing** — always gRPC (the write path stays on `SuiKit` /
`builder.executor`). Indexer/API (`api` / `api-first`) reads are a separate axis; GraphQL only
ever replaces the **on-chain leg**.

---

## 2. Current state

- `initReadClients` ([`../src/models/scallopQuery/index.ts`](../src/models/scallopQuery/index.ts))
  builds the Core client as a **`SuiGrpcClient` even in graphql mode** — so today the Core read
  path is gRPC regardless of `readTransport`.
- The registry's Core datasource is `GrpcDataSource`, which wraps `client.core`
  ([`../src/repositories/wiring/datasources.ts`](../src/repositories/wiring/datasources.ts) →
  `createGrpcDataSource(client, url, { maxObjectsPerBatch })`). It already accepts a
  `maxObjectsPerBatch` cap whose doc-comment says _"Set (to a sub-50 cap) only for the GraphQL
  transport, whose query-payload limit rejects large multiGetObjects requests."_ — i.e. the infra
  was **designed** to be backed by a GraphQL core client; that path just isn't wired yet.
- `GraphQLDataSource` ([`../src/datasources/graphql/`](../src/datasources/graphql/)) implements the
  optimization primitives only: `multiGetBalances`, `listDynamicFieldsWithValues`,
  `multiGetDynamicFields`.

---

## 3. What actually needs to change

1. **Back the Core datasource with the GraphQL core client in graphql mode.** In
   `initReadClients` / the registry, when `readTransport === 'graphql'` build the Core datasource
   from `graphqlClient.core` (with a sub-50 `maxObjectsPerBatch` for the payload cap) instead of a
   gRPC client. This single change routes **all** Core reads — including `simulateTransaction` —
   over GraphQL, giving ~full switchability.
2. **Fix the `query.grpc` typing.** `ScallopQuery.grpc` is typed `SuiGrpcClient`; the Core read
   client must become the transport-agnostic type (a client `implements
SuiClientTypes.TransportMethods`, or its `.core`). Rename for clarity (e.g. `coreReadClient`)
   so "grpc" doesn't imply transport. `ScallopUtils.client` is already typed
   `ClientWithCoreMethods` and needs no change.
3. **Keep the `GraphQLDataSource` optimization layer as-is.** Where a native GraphQL query beats
   the generic core path (balances, dynamic-field walkers), `runByReadTransport` still prefers it.
   Everything else uses the (now GraphQL-backed) Core datasource.
4. **Writes untouched.** `builder.executor` / `SuiKit` stay gRPC.

That's the bulk of it. No per-repo helper rewrites, no `dryRun` decoder, no new
`GraphQLDataSource` methods for correctness.

---

## 4. Fail-loud (reframed)

The earlier "fail loud when a read has no GraphQL implementation" requirement was framed around
per-read GraphQL ports. With the client-swap approach it mostly **dissolves**: in graphql mode the
Core client _is_ GraphQL, so every Core read runs over GraphQL by construction — there is nothing
to silently fall back to.

The residual fail-loud concern is narrower: if a repo calls a Core method that `GraphQLCoreClient`
does **not** implement, it should surface loudly. Two mitigations:

- The method simply won't exist on the GraphQL core client → a clear runtime `TypeError` (or a
  typed `ScallopGraphQLUnsupportedError` if we add a thin guard). Audit `CORE_METHODS` vs
  `GraphQLCoreClient` (see §6 — current audit shows full coverage).
- Keep `runByReadTransport`'s strict-by-transport behavior for the **optimization** layer (a
  failing native GraphQL query propagates, no silent gRPC fallback), which it already does.

---

## 5. Testing strategy

- **Integration parity:** run the full read suite under both `scallopSDK` (grpc) and
  `graphQLScallopSDK` (graphql) fixtures in [`../tests/scallopSdk.ts`](../tests/scallopSdk.ts) — the
  graphql fixture already sets `fullnodeUrl` + `graphqlUrl`. Assert equal typed output. This is
  the real gate: it exercises every repo read over the GraphQL-backed Core client, including
  `simulateTransaction`-based reads (obligation accounts, borrow-incentive accounts, market data,
  coin amounts, veSca).
- **Unit:** assert the Core datasource is built from `graphqlClient.core` in graphql mode with the
  `maxObjectsPerBatch` cap set (extend
  [`../tests/models/scallopQuery/index.spec.ts`](../tests/models/scallopQuery/index.spec.ts)).
- **Payload cap:** verify large obligations/portfolios don't exceed the ~5000-byte GraphQL query
  limit (the `maxObjectsPerBatch` split handles this — test with a wide obligation).

---

## 6. Risks & open questions

1. **`GraphQLCoreClient` method coverage (verify before shipping).** Audit each `CORE_METHODS`
   entry against `graphql/core.mjs`. Current read (runtime) shows all present incl.
   `simulateTransaction`. Confirm none of the used methods throw "not supported on GraphQL" for the
   specific option shapes the repos pass (e.g. `include: { json: true }` vs `bcs`).
2. **Payload cap.** GraphQL rejects >~5000-byte queries; `getObjects` / `listOwnedObjects` batches
   must stay small — handled by `maxObjectsPerBatch`, but confirm it's actually set on the
   GraphQL-backed Core datasource (the existing option exists for exactly this).
3. **Rate limiting.** The Core datasource's rate limiter should apply equally when backed by
   GraphQL; `GraphQLDataSource` has its own limiter. Confirm the graphql-backed core path isn't
   double-limited or unlimited.
4. **`json` vs `bcs` fidelity.** Repo parsers (`parseObjectAs`, per-domain `utils.ts`) currently
   consume the gRPC core client's `json` output. Confirm `GraphQLCoreClient` returns the same
   `json` shape (it implements the same `TransportMethods` contract, but validate on real objects,
   especially nested Move structs / `TypeName` differences that `moveTypeMapper` already handles).
5. **Writes stay gRPC.** No change to the write/executor path. Confirmed.
6. **Effort.** Small: ~1 wiring change (§3.1) + a typing rename (§3.2) + parity test runs. The
   former "port 30 helpers + dryRun decoder" scope is gone.

---

## 7. Phased plan

- **Phase A.** Back the Core datasource with `graphqlClient.core` in graphql mode (§3.1) +
  fix the `coreReadClient` typing (§3.2). Run the integration read suite under the graphql fixture
  and fix any method/shape gaps surfaced (§6.1, §6.4).
- **Phase B.** Add the unit + payload-cap tests (§5). Optionally add the
  `ScallopGraphQLUnsupportedError` guard (§4).
- **Phase C (optional, ongoing).** Extend the `GraphQLDataSource` optimization layer where
  profiling shows the generic core path is call-heavy (pure perf, not correctness).
- **Phase D.** Update `GRAPHQL_SUPPORT.md`, `SDK_STRUCTURE.md`, `README.md` to the new
  "GraphQL = full read transport (Core client swap); native primitives are an optimization" stance.
