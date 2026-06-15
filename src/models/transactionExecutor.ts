import type {
  DerivePathParams,
  SuiKit,
  SuiTransactionBlockResponse,
  SuiTxBlock,
  Transaction,
} from '@scallop-io/sui-kit';

/**
 * SDK-agnostic write-path seam: sign and execute (broadcast) a transaction
 * regardless of the underlying Sui SDK. Consumers (client services, the builder)
 * depend on this interface, never on a concrete SDK — so swapping sui-kit for
 * `@mysten/sui` (or anything else) is a one-class change.
 *
 * Reads do NOT belong here — they flow through `repositories/` →
 * `OnChainDataSource`. Dry-run (`inspectTxn`) stays on the raw `SuiKit` (exposed
 * via the model `suiKit` getters) until a write-path consumer needs it abstracted.
 */
export interface TransactionExecutor {
  signAndSendTxn(
    tx: Uint8Array | Transaction | SuiTxBlock,
    derivePathParams?: DerivePathParams
  ): Promise<SuiTransactionBlockResponse>;
}

/** `TransactionExecutor` backed by `@scallop-io/sui-kit`. */
export class SuiKitTransactionExecutor implements TransactionExecutor {
  constructor(private readonly suiKit: SuiKit) {}

  signAndSendTxn(
    tx: Uint8Array | Transaction | SuiTxBlock,
    derivePathParams?: DerivePathParams
  ) {
    return this.suiKit.signAndSendTxn(tx, derivePathParams);
  }
}
