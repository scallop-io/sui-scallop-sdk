import type {
  SuiTransactionBlockResponse,
  SuiObjectArg,
} from '@scallop-io/sui-kit';
import type { Transaction, TransactionResult } from '@mysten/sui/transactions';
import type { SuiObjectData } from 'src/types/index.js';
import type { ClientServiceContext } from './types.js';
import { ScallopTransactionBuildError } from 'src/errors/index.js';

type VeScaClaimResult<S extends boolean> = S extends true
  ? SuiTransactionBlockResponse
  : { tx: Transaction; scaCoin: TransactionResult };

type SignedOrTx<S extends boolean> = S extends true
  ? SuiTransactionBlockResponse
  : Transaction;

/**
 * Application service for veSCA operations:
 *  - lock / extend / claim helpers (thin wrappers over the tx-block quick
 *    methods, so callers can stay on the service object instead of touching
 *    `tx` directly).
 *  - claim-all-unlocked-SCA aggregation across every veSCA owned by the
 *    wallet (parity with the legacy ScallopClient method).
 */
export class VeScaService {
  constructor(private readonly ctx: ClientServiceContext) {}

  async lockSca<S extends boolean>(
    params: {
      amountOrCoin?: SuiObjectArg | number;
      lockPeriodInDays?: number;
      autoCheck?: boolean;
      veScaKey?: SuiObjectData | string;
    },
    sign: S = true as S,
    walletAddress?: string
  ): Promise<SignedOrTx<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    txBlock.setSender(walletAddress ?? this.ctx.walletAddress);
    await txBlock.lockScaQuick(params);
    if (sign) {
      return (await this.ctx.executor.signAndSendTxn(txBlock)) as SignedOrTx<S>;
    }
    return txBlock.txBlock as SignedOrTx<S>;
  }

  async extendLockPeriod<S extends boolean>(
    params: {
      lockPeriodInDays: number;
      autoCheck?: boolean;
      veScaKey?: SuiObjectData | string;
    },
    sign: S = true as S,
    walletAddress?: string
  ): Promise<SignedOrTx<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    txBlock.setSender(walletAddress ?? this.ctx.walletAddress);
    await txBlock.extendLockPeriodQuick(params);
    if (sign) {
      return (await this.ctx.executor.signAndSendTxn(txBlock)) as SignedOrTx<S>;
    }
    return txBlock.txBlock as SignedOrTx<S>;
  }

  async extendLockAmount<S extends boolean>(
    params: {
      scaAmount: number;
      autoCheck?: boolean;
      veScaKey?: SuiObjectData | string;
    },
    sign: S = true as S,
    walletAddress?: string
  ): Promise<SignedOrTx<S>> {
    const txBlock = this.ctx.builder.createTxBlock();
    txBlock.setSender(walletAddress ?? this.ctx.walletAddress);
    await txBlock.extendLockAmountQuick(params);
    if (sign) {
      return (await this.ctx.executor.signAndSendTxn(txBlock)) as SignedOrTx<S>;
    }
    return txBlock.txBlock as SignedOrTx<S>;
  }

  async claimAllUnlockedSca<S extends boolean>(
    sign: S = true as S,
    walletAddress?: string
  ): Promise<VeScaClaimResult<S>> {
    const sender = walletAddress ?? this.ctx.walletAddress;
    const veScaKeys = (
      (await this.ctx.query.getVeScas({ walletAddress: sender })) ?? []
    ).map(({ keyId }) => keyId);
    if (veScaKeys.length === 0) {
      throw new ScallopTransactionBuildError('No veSCA found in the wallet', {
        context: { walletAddress: sender },
      });
    }

    const tx = this.ctx.builder.createTxBlock();
    tx.setSender(sender);

    const scaCoins: TransactionResult[] = [];
    await Promise.all(
      veScaKeys.map(async (veScaKey) => {
        try {
          const scaCoin = await tx.redeemScaQuick({
            veScaKey,
            transferSca: false,
          });
          if (!scaCoin) return;
          scaCoins.push(scaCoin);
        } catch (e) {
          this.ctx.utils.logger.warn(
            'redeemScaQuick failed for veScaKey; skipping',
            { veScaKey, message: (e as Error)?.message }
          );
        }
      })
    );

    if (scaCoins.length === 0) {
      throw new ScallopTransactionBuildError(
        'No unlocked SCA found in the veSCA accounts',
        { context: { walletAddress: sender, veScaKeyCount: veScaKeys.length } }
      );
    }

    if (scaCoins.length > 1) {
      tx.mergeCoins(scaCoins[0], scaCoins.slice(1));
    }
    await this.ctx.utils.mergeSimilarCoins(tx, scaCoins[0], 'sca', sender);

    if (sign) {
      return (await this.ctx.executor.signAndSendTxn(
        tx
      )) as VeScaClaimResult<S>;
    }
    return {
      tx: tx.txBlock,
      scaCoin: scaCoins[0],
    } as VeScaClaimResult<S>;
  }
}
