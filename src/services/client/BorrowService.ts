import type { TransactionResult } from '@mysten/sui/transactions';
import type { ClientServiceContext, ClientTxResult } from './types.js';
import { ScallopTransactionBuildError } from 'src/errors/index.js';

/**
 * Application service for borrow-side lifecycle operations:
 *  - obligation creation
 *  - borrow / repay
 *  - supply + auto-stake convenience
 *  - borrow-incentive stake / unstake / claim
 *
 * Each method preserves the public ScallopClient signature one-to-one.
 */
export class BorrowService {
  constructor(private readonly ctx: ClientServiceContext) {}

  async openObligation<S extends boolean>(
    sign: S = true as S
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    txBlock.openObligationEntry();
    if (sign) {
      return (await this.ctx.scallopSuiKit.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }

  async borrow<S extends boolean>(
    poolCoinName: string,
    amount: number,
    sign: S = true as S,
    obligationId: string,
    obligationKey: string,
    walletAddress?: string,
    isSponsoredTx?: boolean
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    const sender = walletAddress ?? this.ctx.walletAddress;
    txBlock.setSender(sender);

    const availableStake =
      this.ctx.constants.whitelist.lending.has(poolCoinName);
    if (sign && availableStake) {
      await txBlock.unstakeObligationQuick(obligationId, obligationKey);
    }
    const coin = await txBlock.borrowQuick(
      amount,
      poolCoinName,
      obligationId,
      obligationKey,
      { isSponsoredTx }
    );
    txBlock.transferObjects([coin], sender);
    if (sign && availableStake) {
      await txBlock.stakeObligationWithVeScaQuick(obligationId, obligationKey);
    }

    if (sign) {
      return (await this.ctx.scallopSuiKit.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }

  async repay<S extends boolean>(
    poolCoinName: string,
    amount: number,
    sign: S = true as S,
    obligationId: string,
    obligationKey: string,
    walletAddress?: string,
    isSponsoredTx?: boolean
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    const sender = walletAddress ?? this.ctx.walletAddress;
    txBlock.setSender(sender);

    const availableStake =
      this.ctx.constants.whitelist.lending.has(poolCoinName);
    if (sign && availableStake) {
      await txBlock.unstakeObligationQuick(obligationId, obligationKey);
    }
    await txBlock.repayQuick(amount, poolCoinName, obligationId, isSponsoredTx);
    if (sign && availableStake) {
      await txBlock.stakeObligationWithVeScaQuick(obligationId, obligationKey);
    }

    if (sign) {
      return (await this.ctx.scallopSuiKit.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }

  async supplyAndStake<S extends boolean>(
    stakeCoinName: string,
    amount: number,
    sign: S = true as S,
    stakeAccountId?: string,
    walletAddress?: string
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    const sender = walletAddress ?? this.ctx.walletAddress;
    txBlock.setSender(sender);

    const stakeMarketCoinName =
      this.ctx.utils.parseMarketCoinName<string>(stakeCoinName);
    const stakeAccounts =
      await this.ctx.query.getStakeAccounts(stakeMarketCoinName);
    const targetStakeAccount = stakeAccountId ?? stakeAccounts[0]?.id;

    const marketCoin = await txBlock.supplyQuick(amount, stakeCoinName, false);
    if (targetStakeAccount) {
      await txBlock.stakeQuick(
        marketCoin,
        stakeMarketCoinName,
        targetStakeAccount
      );
    } else {
      const account = txBlock.createStakeAccount(stakeMarketCoinName);
      await txBlock.stakeQuick(marketCoin, stakeMarketCoinName, account);
      txBlock.transferObjects([account], sender);
    }

    if (sign) {
      return (await this.ctx.scallopSuiKit.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }

  async stakeObligation<S extends boolean>(
    obligationId: string,
    obligationKeyId: string,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    txBlock.setSender(walletAddress ?? this.ctx.walletAddress);
    await txBlock.stakeObligationWithVeScaQuick(obligationId, obligationKeyId);

    if (sign) {
      return (await this.ctx.scallopSuiKit.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }

  async unstakeObligation<S extends boolean>(
    obligationId: string,
    obligationKeyId: string,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    txBlock.setSender(walletAddress ?? this.ctx.walletAddress);
    await txBlock.unstakeObligationQuick(obligationId, obligationKeyId);

    if (sign) {
      return (await this.ctx.scallopSuiKit.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }

  async claimBorrowIncentive<S extends boolean>(
    obligationId: string,
    obligationKeyId: string,
    sign: S = true as S,
    walletAddress?: string
  ): Promise<ClientTxResult<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    const sender = walletAddress ?? this.ctx.walletAddress;
    txBlock.setSender(sender);

    const rewardCoinsCollection: Record<string, TransactionResult[]> = {};
    const obligationAccount =
      await this.ctx.query.getObligationAccount(obligationId);
    if (!obligationAccount) {
      throw new ScallopTransactionBuildError('Obligation not found', {
        context: { obligationId },
      });
    }
    const rewardCoinNames = Object.values(obligationAccount.borrowIncentives)
      .filter((t): t is NonNullable<typeof t> => !!t)
      .flatMap(({ rewards }) =>
        rewards.filter(({ availableClaimAmount }) => availableClaimAmount > 0)
      )
      .flatMap(({ coinName }) => coinName);

    for (const rewardCoinName of rewardCoinNames) {
      const rewardCoin = await txBlock.claimBorrowIncentiveQuick(
        rewardCoinName,
        obligationId,
        obligationKeyId
      );
      if (!rewardCoinsCollection[rewardCoinName]) {
        rewardCoinsCollection[rewardCoinName] = [rewardCoin];
      } else {
        rewardCoinsCollection[rewardCoinName].push(rewardCoin);
      }
    }

    txBlock.transferObjects(
      Object.values(rewardCoinsCollection).map((rewardCoins) => {
        const mergeDest = rewardCoins[0];
        if (rewardCoins.length > 1) {
          txBlock.mergeCoins(mergeDest, rewardCoins.slice(1));
        }
        return mergeDest;
      }),
      sender
    );

    if (sign) {
      return (await this.ctx.scallopSuiKit.signAndSendTxn(
        txBlock
      )) as ClientTxResult<S>;
    }
    return txBlock.txBlock as ClientTxResult<S>;
  }
}
