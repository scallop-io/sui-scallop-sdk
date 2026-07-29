import type { SuiObjectArg } from '@scallop-io/sui-kit';
import type { ClientServiceContext, ClientTxResult } from './types.js';

/**
 * Application service for referral lifecycle:
 *  - bindToReferral
 *  - claimReferralRevenue
 *  - burnReferralTicket
 *
 * Thin wrappers around the tx-block referral methods so callers can stay on
 * the service object instead of touching `tx` directly.
 */
export class ReferralService {
  constructor(private readonly ctx: ClientServiceContext) {}

  async bindToReferral<S extends boolean>(
    veScaKeyId: string,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    txBlock.setSender(walletAddress ?? this.ctx.walletAddress);
    txBlock.bindToReferral(veScaKeyId);

    if (sign) {
      return (await this.ctx.executor.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }

  async claimReferralRevenue<S extends boolean>(
    veScaKey: SuiObjectArg,
    coinNames?: string[],
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    txBlock.setSender(walletAddress ?? this.ctx.walletAddress);
    const targetCoinNames = coinNames ?? [
      ...this.ctx.constants.whitelist.lending,
    ];
    await txBlock.claimReferralRevenueQuick(veScaKey, targetCoinNames);

    if (sign) {
      return (await this.ctx.executor.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }

  async burnReferralTicket<S extends boolean>(
    ticket: SuiObjectArg,
    poolCoinName: string,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    txBlock.setSender(walletAddress ?? this.ctx.walletAddress);
    txBlock.burnReferralTicket(ticket, poolCoinName);

    if (sign) {
      return (await this.ctx.executor.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }
}
