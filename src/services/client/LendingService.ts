import type { SuiObjectArg } from '@scallop-io/sui-kit';
import type { TransactionObjectArgument } from '@mysten/sui/transactions';
import type { ScallopTxBlock } from 'src/types/index.js';
import type { ClientServiceContext, ClientTxResult } from './types.js';

export class LendingService {
  constructor(private readonly ctx: ClientServiceContext) {}

  async supply<S extends boolean>(
    poolCoinName: string,
    amount: number,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    const sender = walletAddress ?? this.ctx.walletAddress;
    txBlock.setSender(sender);

    const sCoin = await txBlock.supplyQuick(amount, poolCoinName);
    txBlock.transferObjects([sCoin], sender);

    if (sign) {
      return (await this.ctx.executor.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }

  async withdraw<S extends boolean>(
    poolCoinName: string,
    amount: number,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    const sender = walletAddress ?? this.ctx.walletAddress;
    txBlock.setSender(sender);

    const coin = await txBlock.withdrawQuick(amount, poolCoinName);
    txBlock.transferObjects([coin], sender);

    if (sign) {
      return (await this.ctx.executor.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }

  async flashLoan<S extends boolean>(
    poolCoinName: string,
    amount: number,
    callback: (
      txBlock: ScallopTxBlock,
      coin: TransactionObjectArgument | string
    ) => SuiObjectArg | Promise<SuiObjectArg>,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    const sender = walletAddress ?? this.ctx.walletAddress;
    txBlock.setSender(sender);

    const [coin, loan] = txBlock.borrowFlashLoan(amount, poolCoinName);
    txBlock.repayFlashLoan(await callback(txBlock, coin), loan, poolCoinName);

    if (sign) {
      return (await this.ctx.executor.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }
}
