import type { SuiClientTypes } from '@mysten/sui/client';
import type { SignatureWithBytes, Signer } from '@mysten/sui/cryptography';
import type { Transaction } from '@mysten/sui/transactions';
import type { DerivePathParams, SuiKit, SuiTxBlock } from '@scallop-io/sui-kit';

/**
 * Response detail level requested for executed transactions. Matches the shape
 * the SDK has always returned (`SuiTransactionBlockResponse` is
 * `TransactionResult<this include>`), so callers keep seeing balanceChanges /
 * effects / events / objectTypes.
 */
const DEFAULT_TX_INCLUDE = {
  effects: true,
  events: true,
} as const;
export type DefaultTxInclude = typeof DEFAULT_TX_INCLUDE;

type TxResult = SuiClientTypes.TransactionResult<DefaultTxInclude>;

/**
 * SDK-agnostic write-path seam, modelled on the native `@mysten/sui`
 * `CoreClient` transaction interface (`signTransaction` / `executeTransaction` /
 * `signAndExecuteTransaction`) rather than any one wallet SDK. Consumers (client
 * services, the builder) depend on this interface only — swapping the underlying
 * SDK is a one-class change.
 *
 * Reads do NOT belong here — they flow through `repositories/` →
 * `OnChainDataSource`. Dry-run (`inspectTxn`) stays on the raw `SuiKit` (exposed
 * via the model `suiKit` getters) until a write-path consumer needs it abstracted.
 */
export interface TransactionExecutor {
  /** Sign a transaction (build it first if needed); returns signature + bytes. */
  signTransaction(
    tx: Uint8Array | Transaction | SuiTxBlock,
    derivePathParams?: DerivePathParams
  ): Promise<SignatureWithBytes>;

  /** Submit an already-signed transaction. */
  executeTransaction(
    options: SuiClientTypes.ExecuteTransactionOptions<DefaultTxInclude>
  ): Promise<TxResult>;

  /**
   * Sign and submit in one call (the common write path). `signer` defaults to
   * the executor's wallet keypair; `derivePathParams` selects a derived keypair.
   */
  signAndExecuteTransaction(options: {
    transaction: Uint8Array | Transaction;
    additionalSignatures?: string[];
    signer?: Signer;
    derivePathParams?: DerivePathParams;
  }): Promise<TxResult>;

  /**
   * Convenience over {@link signAndExecuteTransaction} that also accepts a
   * `SuiTxBlock` (unwrapping its underlying `Transaction`). This is what the
   * write services and builder call; it delegates to the native path above.
   */
  signAndSendTxn(
    tx: Uint8Array | Transaction | SuiTxBlock,
    derivePathParams?: DerivePathParams
  ): Promise<TxResult>;
}

/**
 * `TransactionExecutor` backed by a `SuiKit`: it routes execution through the
 * native `suiKit.client.core` (CoreClient) and draws the signer from the kit's
 * keypair. Only the SDK-specific bits (which client, which signer) live here.
 */
export class SuiKitTransactionExecutor implements TransactionExecutor {
  constructor(private readonly suiKit: SuiKit) {}

  private get client() {
    return this.suiKit.client.core;
  }

  signTransaction(
    tx: Uint8Array | Transaction | SuiTxBlock,
    derivePathParams?: DerivePathParams
  ) {
    return this.suiKit.signTxn(tx, derivePathParams);
  }

  executeTransaction(
    options: SuiClientTypes.ExecuteTransactionOptions<DefaultTxInclude>
  ) {
    return this.client.executeTransaction({
      include: DEFAULT_TX_INCLUDE,
      ...options,
    });
  }

  signAndExecuteTransaction({
    transaction,
    additionalSignatures,
    signer,
    derivePathParams,
  }: {
    transaction: Uint8Array | Transaction;
    additionalSignatures?: string[];
    signer?: Signer;
    derivePathParams?: DerivePathParams;
  }) {
    return this.client.signAndExecuteTransaction({
      transaction,
      additionalSignatures,
      include: DEFAULT_TX_INCLUDE,
      signer: signer ?? this.suiKit.getKeypair(derivePathParams),
    });
  }

  signAndSendTxn(
    tx: Uint8Array | Transaction | SuiTxBlock,
    derivePathParams?: DerivePathParams
  ) {
    // Unwrap a SuiTxBlock to its underlying mysten `Transaction`; pass bytes /
    // Transaction through untouched.
    const transaction =
      tx instanceof Uint8Array ? tx : 'txBlock' in tx ? tx.txBlock : tx;
    return this.signAndExecuteTransaction({ transaction, derivePathParams });
  }
}
