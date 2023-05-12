import { SuiTxBlock } from '@scallop-io/sui-kit';
import type { TxBuilderParams } from 'src/types/model';

/**
 * it provides methods for build transaction.
 */
export class ScallopTxBuilder {
  public suiTxBlock: SuiTxBlock;

  constructor(_params?: TxBuilderParams) {
    this.suiTxBlock = new SuiTxBlock();
  }

  /**
   * Get transaction block.
   *
   * @returns sui type transaction block.
   */
  public get txBlock() {
    return this.suiTxBlock.txBlock;
  }

  /**
   * Construct a transaction block for querying market data.
   *
   * @param packageId - The query package id.
   * @param marketId - The market id from protocol package.
   * @returns Sui-Kit type transaction block.
   */
  public queryMarket(packageId: string, marketId: string) {
    const queryTarget = `${packageId}::market_query::market_data`;
    this.suiTxBlock.moveCall(queryTarget, [marketId]);
    return this.suiTxBlock;
  }
}
