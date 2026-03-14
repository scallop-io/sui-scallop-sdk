# Obligation Naming — SDK Integration

## Overview

The `obligation_naming` contract allows users to assign custom names to their Scallop ObligationKeys. This PR adds SDK support for `set_name`, `remove_name`, and querying names.

### On-chain Contract

- **Package ID:** `0x9d16020b034d14ccb622f450bbd449dae3bf235a7fc57b21689645fc1066ab74`
- **NamingRegistry ID:** `0xe948aeff7fa931cb94e70b1bfc15581f34e459fb3747cf927a62697f9cab3671`
- Table key computation: `sha3_256(bcs(obligation_key_id) + bcs(sender))`

---

## Changed / Added Files

### New Files

| File                                      | Description                                                                 |
| ----------------------------------------- | --------------------------------------------------------------------------- |
| `src/types/builder/obligationNaming.ts`   | Type definitions (ObligationNamingIds, Normal/Quick methods, TxBlock types) |
| `src/builders/obligationNamingBuilder.ts` | Builder: `setObligationName`, `removeObligationName` + quick methods        |
| `src/queries/obligationNamingQuery.ts`    | Query: `computeNamingKey`, `getObligationName`, `getObligationNames`        |
| `test/obligationNaming.spec.ts`           | Unit tests (computeNamingKey) + vitest builder/query tests                  |
| `test/obligationNaming.e2e.spec.ts`       | E2E: set name -> query -> remove -> query full flow                         |
| `test/obligationNamingQuery.e2e.spec.ts`  | E2E: query-only tests (existing/fake/wrong owner)                           |

### Modified Files

| File                         | Change                                                            |
| ---------------------------- | ----------------------------------------------------------------- |
| `src/types/address.ts`       | Added `obligationNaming?: { id: string; namingRegistry: string }` |
| `src/types/builder/index.ts` | Export obligation naming types, added to `BaseScallopTxBlock`     |
| `src/builders/index.ts`      | Inserted `newObligationNamingTxBlock` between referral and sCoin  |
| `src/queries/index.ts`       | Export `obligationNamingQuery`                                    |
| `src/models/scallopQuery.ts` | Added `getObligationName()`, `getObligationNames()` methods       |
| `test/mocks.ts`              | Added obligationNaming mock addresses                             |

---

## Current Status

- Build: PASS (`pnpm build`)
- Type check: PASS (`npx tsc --noEmit`)
- E2E set + query + remove: PASS
- E2E query only: PASS

---

## Next Steps Checklist

### 1. Backend API Update (blocked)

The backend needs to include the `obligationNaming` field in the addresses API response:

```json
{
  "obligationNaming": {
    "id": "0x9d16020b034d14ccb622f450bbd449dae3bf235a7fc57b21689645fc1066ab74",
    "namingRegistry": "0xe948aeff7fa931cb94e70b1bfc15581f34e459fb3747cf927a62697f9cab3671"
  }
}
```

**Owner:** Backend team
**Impact:** Until this is done, users must manually patch the address (see `patchAddress` in the e2e tests)

### 2. SDK Changes After API Update

Once the API is live:

- [ ] **Remove `ADDRESS_INTERFACE_PATCH` and `patchAddress`** from e2e tests — manual patching is no longer needed
  - `test/obligationNaming.e2e.spec.ts`
  - `test/obligationNamingQuery.e2e.spec.ts`
- [ ] **Verify** that `builder.address.get('obligationNaming.id')` and `builder.address.get('obligationNaming.namingRegistry')` return correct values from the API
- [ ] Run full e2e to confirm: `npx tsx test/obligationNaming.e2e.spec.ts`

### 3. Code Review & Merge

- [ ] PR review
- [ ] Confirm `pnpm build` passes
- [ ] Confirm `npx tsc --noEmit` has no type errors
- [ ] Merge to develop / main

### 4. Release — Step by Step

#### Pre-release Checks

- [ ] All previous steps (1–3) are completed
- [ ] You are on the `main` branch with latest changes merged
- [ ] Working tree is clean (`git status` shows no uncommitted changes)
- [ ] `pnpm build` passes (ESM, CJS, DTS all succeed)
- [ ] `npx tsc --noEmit` passes with no type errors
- [ ] `npx vitest run test/obligationNaming.spec.ts` — unit tests pass
- [ ] `npx tsx test/obligationNaming.e2e.spec.ts` — e2e full flow passes
- [ ] `npx tsx test/obligationNamingQuery.e2e.spec.ts` — e2e query passes
- [ ] Existing tests still pass: `npx vitest run`

#### Version Bump

```bash
# For a new feature (recommended): minor bump (2.4.1 -> 2.5.0)
pnpm release:minor

# Or for a smaller change: patch bump (2.4.1 -> 2.4.2)
pnpm release:patch
```

This runs `standard-version` which will:

- Bump version in `package.json`
- Update `CHANGELOG.md`
- Create a git commit and tag

#### Verify the Release Commit

```bash
# Check the new version
node -p "require('./package.json').version"

# Check the commit and tag
git log --oneline -3
git tag --sort=-version:refname | head -3
```

#### Push

```bash
# Push commit and tag to remote
git push origin main --follow-tags
```

#### Publish to npm

```bash
# Dry run first to verify what will be published
pnpm publish --dry-run

# Publish (package is configured with "access": "public")
pnpm publish
```

#### Post-release Verification

- [ ] Verify on npm: `npm view @scallop-io/sui-scallop-sdk version`
- [ ] Verify the GitHub tag exists on the remote
- [ ] Notify the team that the new version is published

---

## How to Test

### Prerequisites

- `SECRET_KEY` in `.env` (wallet that owns an ObligationKey)
- An `OBLIGATION_KEY_ID` that your wallet owns

### Unit Tests (no network required)

```bash
npx vitest run test/obligationNaming.spec.ts
```

Tests 4 cases for `computeNamingKey`: format, determinism, different inputs, different owner.

### E2E: Full Flow (requires network + private key)

```bash
npx tsx test/obligationNaming.e2e.spec.ts
```

Steps:

1. Verify computeNamingKey output
2. Query name before set -> null
3. Set name -> submit transaction on-chain
4. Query name after set -> verify name matches
5. Query all obligation names -> list all names
6. (Optional) Remove name -> submit transaction on-chain
7. (Optional) Query name after remove -> null

### E2E: Query Only (requires network + private key, no transactions)

```bash
npx tsx test/obligationNamingQuery.e2e.spec.ts
```

Prerequisite: The obligation key must already have a name set (run the full flow e2e first).

Tests:

1. computeNamingKey format
2. getObligationName — key with existing name
3. getObligationName — non-existent key -> null
4. getObligationName — wrong owner -> null
5. getObligationNames — list all names for sender

### Switching the Test ObligationKey

Update the `OBLIGATION_KEY_ID` constant at the top of the e2e test files.

---

## Technical Notes

- **Query uses `SuiJsonRpcClient` (JSON-RPC v1)** instead of the gRPC v2 `scallopSuiKit.queryGetObject`, because gRPC v2 returns a flattened `.json` format that differs from the nested `data.content.fields` structure used by the contract. This is consistent with how Pyth oracle and `devInspectTxn` are handled in the SDK.
- **Builder passes shared objects as string IDs**, not via `sharedObjectRef`. Only genesis objects like Clock (`0x6`) can use `sharedObjectRef({ initialSharedVersion: '1' })`.
- `obligationNaming` is optional (`?`) in `AddressesInterface`, so this change is backwards-compatible and does not affect existing functionality.
