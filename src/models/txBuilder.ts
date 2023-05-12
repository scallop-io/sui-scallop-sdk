import { SuiTxBlock } from '@scallop-io/sui-kit';
import type { TxBuilderParams } from 'src/types/model';

export class ScallopTxBuilder {
  public suiTxBlock: SuiTxBlock;

  constructor(_params?: TxBuilderParams) {
    this.suiTxBlock = new SuiTxBlock();
  }

  public get txBlock() {
    return this.suiTxBlock.txBlock;
  }
}
