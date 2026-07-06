import { requireSender } from '../../utils/builder.js';
import type { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import type { SuiAddressArg } from '@scallop-io/sui-kit';
import type { TransactionResult } from '@mysten/sui/transactions';
import type {
  GenerateSpoolQuickMethod,
  SpoolActionContext,
  SuiTxBlockWithSpoolNormalMethods,
} from 'src/types/index.js';

/**
 * Check and get stake account id from transaction block.
 *
 * @description
 * If the stake account id is provided, directly return it.
 * Otherwise, automatically get all stake account id from the sender.
 *
 * @param ctx - Spool action context (provides `reads.getAllStakeAccounts`).
 * @param txBlock - TxBlock created by SuiKit.
 * @param stakeMarketCoinName - The name of the market coin supported for staking.
 * @param stakeAccountId - Stake account id.
 * @return Stake account ids.
 */
const requireStakeAccountIds = async (
  ...params: [
    ctx: SpoolActionContext,
    txBlock: SuiKitTxBlock,
    stakeMarketCoinName: string,
    stakeAccountId?: SuiAddressArg,
  ]
) => {
  const [ctx, txBlock, stakeMarketCoinName, stakeAccountId] = params;
  if (params.length === 4 && stakeAccountId) return [stakeAccountId];
  const sender = requireSender(txBlock);
  const stakeAccounts = await ctx.reads.getAllStakeAccounts(sender);
  if (stakeAccounts[stakeMarketCoinName].length === 0) {
    throw new Error(`No stake account id found for sender ${sender}`);
  }
  return stakeAccounts[stakeMarketCoinName].map((account: any) => account.id);
};

/**
 * Check and get stake accounts information from transaction block.
 *
 * @description
 * If the stake account id is provided, directly return its account.
 * Otherwise, automatically get all stake account from the sender.
 *
 * @param ctx - Spool action context (provides `reads.getAllStakeAccounts`).
 * @param txBlock - TxBlock created by SuiKit.
 * @param stakeMarketCoinName - The name of the market coin supported for staking.
 * @param stakeAccountId - Stake account id.
 * @return Stake accounts.
 */
const requireStakeAccounts = async (
  ...params: [
    ctx: SpoolActionContext,
    txBlock: SuiKitTxBlock,
    stakeMarketCoinName: string,
    stakeAccountId?: SuiAddressArg,
  ]
) => {
  const [ctx, txBlock, stakeMarketCoinName, stakeAccountId] = params;
  const sender = requireSender(txBlock);
  const stakeAccounts = await ctx.reads.getAllStakeAccounts(sender);
  if (stakeAccounts[stakeMarketCoinName].length === 0) {
    throw new Error(`No stake account found for sender ${sender}`);
  }

  const specificStakeAccounts = stakeAccountId
    ? stakeAccounts[stakeMarketCoinName].filter((account: any) => {
        return account.id === stakeAccountId;
      })
    : stakeAccounts[stakeMarketCoinName];

  return specificStakeAccounts;
};

const stakeHelper = async (
  ctx: SpoolActionContext,
  txBlock: SuiTxBlockWithSpoolNormalMethods,
  stakeAccount: SuiAddressArg,
  coinName: string,
  amount: number,
  sender: string,
  isSCoin: boolean = false
) => {
  try {
    const { takeCoin, leftCoin, totalAmount } = isSCoin
      ? await ctx.coins.selectSCoin(txBlock, coinName, amount, sender)
      : await ctx.coins.selectMarketCoin(txBlock, coinName, amount, sender);
    if (isSCoin) {
      const marketCoin = txBlock.burnSCoin(coinName, takeCoin);
      txBlock.stake(stakeAccount, marketCoin, coinName);
    } else {
      txBlock.stake(stakeAccount, takeCoin, coinName);
    }
    txBlock.transferObjects([leftCoin], sender);
    return totalAmount;
  } catch (_e) {
    return 0;
  }
};

/**
 * Generate spool quick methods.
 *
 * @description
 * The quick methods are the same as the normal methods, but they will automatically
 * help users organize transaction blocks, including getting stake account info, and transferring
 * coins to the sender. So, they are all asynchronous methods.
 *
 * @param ctx - Spool action context (reads, coins).
 * @param txBlock - TxBlock created by SuiKit .
 * @return Spool quick methods.
 */
export const generateSpoolQuickMethod: GenerateSpoolQuickMethod = ({
  ctx,
  txBlock,
}) => {
  return {
    stakeQuick: async (
      amountOrMarketCoin,
      stakeMarketCoinName,
      stakeAccountId
    ) => {
      const sender = requireSender(txBlock);
      const stakeAccountIds = await requireStakeAccountIds(
        ctx,
        txBlock,
        stakeMarketCoinName,
        stakeAccountId
      );

      if (stakeAccountIds.length === 0) {
        throw new Error(`No stakeAccountIds found for user ${sender}`);
      }

      if (typeof amountOrMarketCoin === 'number') {
        // try stake market coin
        const stakedMarketCoinAmount = await stakeHelper(
          ctx,
          txBlock,
          stakeAccountIds[0],
          stakeMarketCoinName,
          amountOrMarketCoin,
          sender
        );

        amountOrMarketCoin -= stakedMarketCoinAmount;
        // no market coin, try sCoin
        if (amountOrMarketCoin > 0) {
          await stakeHelper(
            ctx,
            txBlock,
            stakeAccountIds[0],
            stakeMarketCoinName,
            amountOrMarketCoin,
            sender,
            true
          );
        }
      } else {
        txBlock.stake(
          stakeAccountIds[0],
          amountOrMarketCoin,
          stakeMarketCoinName
        );
      }
    },
    unstakeQuick: async (
      amount,
      stakeMarketCoinName,
      stakeAccountId,
      returnSCoin = true
    ) => {
      const stakeAccounts = await requireStakeAccounts(
        ctx,
        txBlock,
        stakeMarketCoinName,
        stakeAccountId
      );
      const toTransfer: TransactionResult[] = [];
      for (const account of stakeAccounts) {
        if (account.staked === 0) continue;
        const amountToUnstake = Math.min(amount, account.staked);
        const marketCoin = txBlock.unstake(
          account.id,
          amountToUnstake,
          stakeMarketCoinName
        );

        // convert to new sCoin
        if (returnSCoin) {
          const sCoin = txBlock.mintSCoin(stakeMarketCoinName, marketCoin);
          toTransfer.push(sCoin);
        } else {
          toTransfer.push(marketCoin);
        }

        amount -= amountToUnstake;
        if (amount <= 0) break;
      }

      if (toTransfer.length > 0) {
        const mergedCoin = toTransfer[0];

        if (toTransfer.length > 1) {
          txBlock.mergeCoins(mergedCoin, toTransfer.slice(1));
        }
        return mergedCoin;
      }
    },
    claimQuick: async (stakeMarketCoinName, stakeAccountId) => {
      const stakeAccountIds = await requireStakeAccountIds(
        ctx,
        txBlock,
        stakeMarketCoinName,
        stakeAccountId
      );
      const rewardCoins: TransactionResult[] = [];
      for (const accountId of stakeAccountIds) {
        const rewardCoin = await txBlock.claim(accountId, stakeMarketCoinName);
        rewardCoins.push(rewardCoin);
      }
      return rewardCoins;
    },
  };
};
