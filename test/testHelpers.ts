/**
 * Helper to get transaction from SDK v2 SimulateTransactionResult (gRPC only)
 * In SDK v2, the result is a union type with $kind discriminator
 */
export const getTxFromResult = (result: any) => {
  // Handle both inspectTxn (SimulateTransactionResponse) and signAndSendTxn (SuiTransactionBlockResponse)
  return result.Transaction ?? result.FailedTransaction ?? result;
};
