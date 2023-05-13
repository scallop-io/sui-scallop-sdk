import { SuiTxBlock } from '@scallop-io/sui-kit';
import type { TxBuilderParams, SupportCoinType } from 'src/types';

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
   * @param packageId - The protocol package id.
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
   * @param packageId - The protocol package id.
   * @returns Sui-Kit type transaction block.
   */
  public openObligationEntry(packageId: string) {
    const queryTarget = `${packageId}::open_obligation::open_obligation_entry`;
    this.suiTxBlock.moveCall(queryTarget, []);
    return this.suiTxBlock;
  }

  /**
   * Construct a transaction block for mint the test coin.
   *
   * @remarks
   *  Only be used on the test network.
   *
   * @param packageId - The testCoin package id.
   * @param treasuryId - The treasury Id from testCoin package.
   * @param coinName - Types of coins supported on the test network.
   * @param amount - The amount of coins minted and received.
   * @returns Sui-Kit type transaction block.
   */
  mintTestCoin(
    packageId: string,
    treasuryId: string,
    coinName: SupportCoinType,
    amount: number
  ) {
    const target = `${packageId}::${coinName}::mint`;
    return this.suiTxBlock.moveCall(target, [treasuryId, amount]);
  }

  /**
   * Construct a transaction block for mint and transfer the test coin to recipient.
   *
   * @remarks
   *  Only be used on the test network.
   *
   * @param packageId - The protocol package id.
   * @param treasuryId - The treasury Id from testCoin package.
   * @param coinName - Types of coins supported on the test network.
   * @param amount - The amount of coins minted and received.
   * @param recipient - The recipient's wallet address.
   * @returns Sui-Kit type transaction block.
   */
  mintTestCoinEntry(
    packageId: string,
    treasuryId: string,
    coinName: SupportCoinType,
    amount: number,
    recipient: string
  ) {
    const target = `${packageId}::${coinName}::mint`;
    console.log(treasuryId);
    const coin = this.suiTxBlock.moveCall(target, [treasuryId, amount]);
    this.suiTxBlock.transferObjects([coin], recipient);
    return this.suiTxBlock;
  }
}
