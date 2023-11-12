import type { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';

/**
 * Check and get the sender from the transaction block.
 *
 * @param txBlock - TxBlock created by SuiKit.
 * @return Sender of transaction.
 */
export const requireSender = (txBlock: SuiKitTxBlock) => {
  const sender = txBlock.blockData.sender;
  if (!sender) {
    throw new Error('Sender is required');
  }
  return sender;
};
