import type { ClientServiceContext, ClientTxResult } from './types.js';

export class CollateralService {
  constructor(private readonly ctx: ClientServiceContext) {}

  async depositCollateral<S extends boolean>(
    collateralCoinName: string,
    amount: number,
    sign: S = true as S,
    obligationId?: string,
    walletAddress?: string,
    isSponsoredTx?: boolean
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    const sender = walletAddress ?? this.ctx.walletAddress;
    txBlock.setSender(sender);

    const specificObligationId =
      obligationId ?? (await this.ctx.query.getObligations(sender))[0]?.id;
    if (specificObligationId) {
      await txBlock.depositCollateralQuick(
        amount,
        collateralCoinName,
        specificObligationId,
        isSponsoredTx
      );
    } else {
      const [obligation, obligationKey, hotPotato] = txBlock.openObligation();
      await txBlock.depositCollateralQuick(
        amount,
        collateralCoinName,
        obligation,
        isSponsoredTx
      );
      txBlock.returnObligation(obligation, hotPotato);
      txBlock.transferObjects([obligationKey], sender);
    }

    if (sign) {
      return (await this.ctx.scallopSuiKit.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }

  async withdrawCollateral<S extends boolean>(
    collateralCoinName: string,
    amount: number,
    sign: S = true as S,
    obligationId?: string,
    obligationKey?: string,
    walletAddress?: string,
    isSponsoredTx?: boolean
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    const sender = walletAddress ?? this.ctx.walletAddress;
    txBlock.setSender(sender);

    const collateralCoin = await txBlock.takeCollateralQuick(
      amount,
      collateralCoinName,
      obligationId,
      obligationKey,
      { isSponsoredTx }
    );
    txBlock.transferObjects([collateralCoin], sender);

    if (sign) {
      return (await this.ctx.scallopSuiKit.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }
}
