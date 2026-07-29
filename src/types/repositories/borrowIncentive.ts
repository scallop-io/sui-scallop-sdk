// Public result types owned by the `borrowIncentive` repository. Internal DTOs
// (`Origin*`/`Parsed*Pool*`/`Calculated*`, `*QueryInterface`,
// `BorrowIncentiveAccountKey`) stay in the repo, reachable only via
// `src/types/internal/`.
export type {
  BorrowIncentivePool,
  BorrowIncentivePools,
  BorrowIncentivePoolPoints,
  BorrowIncentiveAccounts,
  ParsedBorrowIncentiveAccountData,
  ParsedBorrowIncentiveAccountPoolData,
} from 'src/repositories/borrowIncentive/types.js';
