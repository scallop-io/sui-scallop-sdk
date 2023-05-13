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

  /**
   * Construct a transaction block for querying obligation data.
   *
   * @param packageId - The query package id.
   * @param obligationId - The obligation id from protocol package.
   * @returns Sui-Kit type transaction block.
   */
  public queryObligation(packageId: string, obligationId: string) {
    const queryTarget = `${packageId}::obligation_query::obligation_data`;
    this.suiTxBlock.moveCall(queryTarget, [obligationId]);
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for open obligation and take
   * key, id and hot potato obligation objects.
   *
   * @returns Sui-Kit type transaction block.
   */
  public openObligation(packageId: string) {
    const queryTarget = `${packageId}::open_obligation::open_obligation`;
    this.suiTxBlock.moveCall(queryTarget, []);
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for open obligation and share obligation
   * and transfer obligation key object to owner.
   *
   * @returns Sui-Kit type transaction block.
   */
  public openObligationEntry(packageId: string) {
    const queryTarget = `${packageId}::open_obligation::open_obligation_entry`;
    this.suiTxBlock.moveCall(queryTarget, []);
    return this.suiTxBlock;
  }
}
