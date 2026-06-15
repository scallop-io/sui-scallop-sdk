import type { SuiObjectArg } from '@scallop-io/sui-kit';
import { requireSender } from 'src/utils/index.js';
import type { ClientServiceContext, ClientTxResult } from './types.js';
import { ScallopTransactionBuildError } from 'src/errors/index.js';

/**
 * Application service for spool lifecycle:
 *  - createStakeAccount
 *  - stake / unstake
 *  - unstake + auto-withdraw convenience
 *  - claim spool rewards
 */
export class SpoolService {
  constructor(private readonly ctx: ClientServiceContext) {}

  async createStakeAccount<S extends boolean>(
    marketCoinName: string,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    const sender = walletAddress ?? this.ctx.walletAddress;
    txBlock.setSender(sender);

    const stakeAccount = txBlock.createStakeAccount(marketCoinName);
    txBlock.transferObjects([stakeAccount], sender);

    if (sign) {
      return (await this.ctx.executor.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }

  async stake<S extends boolean>(
    stakeMarketCoinName: string,
    amount: number,
    sign: S = true as S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    const sender = walletAddress ?? this.ctx.walletAddress;
    txBlock.setSender(sender);

    const stakeAccounts =
      await this.ctx.query.getStakeAccounts(stakeMarketCoinName);
    const targetStakeAccount = stakeAccountId ?? stakeAccounts[0]?.id;
    if (targetStakeAccount) {
      await txBlock.stakeQuick(amount, stakeMarketCoinName, targetStakeAccount);
    } else {
      const account = txBlock.createStakeAccount(stakeMarketCoinName);
      await txBlock.stakeQuick(amount, stakeMarketCoinName, account);
      txBlock.transferObjects([account], sender);
    }

    if (sign) {
      return (await this.ctx.executor.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }

  async unstake<S extends boolean>(
    stakeMarketCoinName: string,
    amount: number,
    sign: S = true as S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    const sender = walletAddress ?? this.ctx.walletAddress;
    txBlock.setSender(sender);

    const sCoin = await txBlock.unstakeQuick(
      amount,
      stakeMarketCoinName,
      stakeAccountId
    );

    if (sCoin) {
      const sCoinType = this.ctx.utils.parseSCoinType(stakeMarketCoinName);
      if (!sCoinType) {
        throw new ScallopTransactionBuildError(
          `Invalid sCoin type: ${stakeMarketCoinName}`,
          { context: { stakeMarketCoinName } }
        );
      }
      await this.ctx.utils.mergeSimilarCoins(txBlock, sCoin, sCoinType, sender);
    }

    txBlock.transferObjects([sCoin as SuiObjectArg], sender);

    if (sign) {
      return (await this.ctx.executor.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }

  async unstakeAndWithdraw<S extends boolean>(
    stakeMarketCoinName: string,
    amount: number,
    sign: S = true as S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    const sender = walletAddress ?? this.ctx.walletAddress;
    txBlock.setSender(sender);

    const stakeMarketCoin = await txBlock.unstakeQuick(
      amount,
      stakeMarketCoinName,
      stakeAccountId,
      false
    );
    const stakeCoinName = this.ctx.utils.parseCoinName(stakeMarketCoinName);

    if (stakeMarketCoin) {
      const coin = txBlock.withdraw(stakeMarketCoin, stakeCoinName);
      await this.ctx.utils.mergeSimilarCoins(
        txBlock,
        coin,
        this.ctx.utils.parseCoinType(stakeCoinName),
        requireSender(txBlock)
      );
      txBlock.transferObjects([coin], sender);
    } else {
      throw new ScallopTransactionBuildError(
        `No stake found for ${stakeMarketCoinName}`,
        { context: { stakeMarketCoinName } }
      );
    }

    if (sign) {
      return (await this.ctx.executor.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }

  async claim<S extends boolean>(
    stakeMarketCoinName: string,
    sign: S = true as S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    const sender = walletAddress ?? this.ctx.walletAddress;
    txBlock.setSender(sender);

    const rewardCoins = await txBlock.claimQuick(
      stakeMarketCoinName,
      stakeAccountId
    );
    txBlock.transferObjects(rewardCoins, sender);

    if (sign) {
      return (await this.ctx.executor.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }
}
