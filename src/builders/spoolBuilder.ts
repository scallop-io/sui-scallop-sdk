import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui/utils';
import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { spoolRewardCoins } from '../constants/enum';
import { getStakeAccounts } from '../queries/spoolQuery';
import { requireSender } from '../utils';
import type { SuiAddressArg } from '@scallop-io/sui-kit';
import type { TransactionResult } from '@mysten/sui/transactions';
import type { ScallopBuilder } from '../models';
import type {
  SpoolIds,
  GenerateSpoolNormalMethod,
  GenerateSpoolQuickMethod,
  SuiTxBlockWithSpoolNormalMethods,
  SpoolTxBlock,
  SupportStakeMarketCoins,
  ScallopTxBlock,
  SuiTxBlockWithSCoin,
} from '../types';

/**
 * Check and get stake account id from transaction block.
 *
 * @description
 * If the stake account id is provided, directly return it.
 * Otherwise, automatically get all stake account id from the sender.
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - TxBlock created by SuiKit.
 * @param stakeMarketCoinName - The name of the market coin supported for staking.
 * @param stakeAccountId - Stake account id.
 * @return Stake account ids.
 */
const requireStakeAccountIds = async (
  ...params: [
    builder: ScallopBuilder,
    txBlock: SuiKitTxBlock,
    stakeMarketCoinName: SupportStakeMarketCoins,
    stakeAccountId?: SuiAddressArg,
  ]
) => {
  const [builder, txBlock, stakeMarketCoinName, stakeAccountId] = params;
  if (params.length === 4 && stakeAccountId) return [stakeAccountId];
  const sender = requireSender(txBlock);
  const stakeAccounts = await getStakeAccounts(builder, sender);
  if (stakeAccounts[stakeMarketCoinName].length === 0) {
    throw new Error(`No stake account id found for sender ${sender}`);
  }
  return stakeAccounts[stakeMarketCoinName].map((account) => account.id);
};

/**
 * Check and get stake accounts information from transaction block.
 *
 * @description
 * If the stake account id is provided, directly return its account.
 * Otherwise, automatically get all stake account from the sender.
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - TxBlock created by SuiKit.
 * @param stakeMarketCoinName - The name of the market coin supported for staking.
 * @param stakeAccountId - Stake account id.
 * @return Stake accounts.
 */
const requireStakeAccounts = async (
  ...params: [
    builder: ScallopBuilder,
    txBlock: SuiKitTxBlock,
    stakeMarketCoinName: SupportStakeMarketCoins,
    stakeAccountId?: SuiAddressArg,
  ]
) => {
  const [builder, txBlock, stakeMarketCoinName, stakeAccountId] = params;
  const sender = requireSender(txBlock);
  const stakeAccounts = await getStakeAccounts(builder, sender);
  if (stakeAccounts[stakeMarketCoinName].length === 0) {
    throw new Error(`No stake account found for sender ${sender}`);
  }

  const specificStakeAccounts = stakeAccountId
    ? stakeAccounts[stakeMarketCoinName].filter((account) => {
        return account.id === stakeAccountId;
      })
    : stakeAccounts[stakeMarketCoinName];

  return specificStakeAccounts;
};

const stakeHelper = async (
  builder: ScallopBuilder,
  txBlock: SuiTxBlockWithSpoolNormalMethods,
  stakeAccount: SuiAddressArg,
  coinName: SupportStakeMarketCoins,
  amount: number,
  sender: string,
  isSCoin: boolean = false
) => {
  try {
    const { takeCoin, leftCoin, totalAmount } = isSCoin
      ? await builder.selectSCoin(txBlock, coinName, amount, sender)
      : await builder.selectMarketCoin(txBlock, coinName, amount, sender);
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
 * Generate spool normal methods.
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - TxBlock created by SuiKit .
 * @return Spool normal methods.
 */
const generateSpoolNormalMethod: GenerateSpoolNormalMethod = ({
  builder,
  txBlock,
}) => {
  const spoolIds: SpoolIds = {
    spoolPkg: builder.address.get('spool.id'),
  };
  return {
    createStakeAccount: (stakeMarketCoinName) => {
      const marketCoinType =
        builder.utils.parseMarketCoinType(stakeMarketCoinName);
      const stakePoolId = builder.address.get(
        `spool.pools.${stakeMarketCoinName}.id`
      );
      return txBlock.moveCall(
        `${spoolIds.spoolPkg}::user::new_spool_account`,
        [stakePoolId, SUI_CLOCK_OBJECT_ID],
        [marketCoinType]
      );
    },
    stake: (stakeAccount, coin, stakeMarketCoinName) => {
      const marketCoinType =
        builder.utils.parseMarketCoinType(stakeMarketCoinName);
      const stakePoolId = builder.address.get(
        `spool.pools.${stakeMarketCoinName}.id`
      );
      txBlock.moveCall(
        `${spoolIds.spoolPkg}::user::stake`,
        [stakePoolId, stakeAccount, coin, SUI_CLOCK_OBJECT_ID],
        [marketCoinType]
      );
    },
    unstake: (stakeAccount, amount, stakeMarketCoinName) => {
      const marketCoinType =
        builder.utils.parseMarketCoinType(stakeMarketCoinName);
      const stakePoolId = builder.address.get(
        `spool.pools.${stakeMarketCoinName}.id`
      );
      return txBlock.moveCall(
        `${spoolIds.spoolPkg}::user::unstake`,
        [stakePoolId, stakeAccount, amount, SUI_CLOCK_OBJECT_ID],
        [marketCoinType]
      );
    },
    claim: (stakeAccount, stakeMarketCoinName) => {
      const stakePoolId = builder.address.get(
        `spool.pools.${stakeMarketCoinName}.id`
      ) as string;
      const rewardPoolId = builder.address.get(
        `spool.pools.${stakeMarketCoinName}.rewardPoolId`
      ) as string;
      const marketCoinType =
        builder.utils.parseMarketCoinType(stakeMarketCoinName);
      const rewardCoinName = spoolRewardCoins[stakeMarketCoinName];
      const rewardCoinType = builder.utils.parseCoinType(rewardCoinName);
      return txBlock.moveCall(
        `${spoolIds.spoolPkg}::user::redeem_rewards`,
        [stakePoolId, rewardPoolId, stakeAccount, SUI_CLOCK_OBJECT_ID],
        [marketCoinType, rewardCoinType]
      );
    },
  };
};

/**
 * Generate spool quick methods.
 *
 * @description
 * The quick methods are the same as the normal methods, but they will automatically
 * help users organize transaction blocks, include get stake account info, and transfer
 * coins to the sender. So, they are all asynchronous methods.
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - TxBlock created by SuiKit .
 * @return Spool quick methods.
 */
const generateSpoolQuickMethod: GenerateSpoolQuickMethod = ({
  builder,
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
        builder,
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
          builder,
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
            builder,
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
        builder,
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
        builder,
        txBlock,
        stakeMarketCoinName,
        stakeAccountId
      );
      const rewardCoins: TransactionResult[] = [];
      for (const accountId of stakeAccountIds) {
        const rewardCoin = txBlock.claim(accountId, stakeMarketCoinName);
        rewardCoins.push(rewardCoin);
      }
      return rewardCoins;
    },
  };
};

/**
 * Create an enhanced transaction block instance for interaction with spool modules of the Scallop contract.
 *
 * @param builder - Scallop builder instance.
 * @param initTxBlock - Scallop txBlock, txBlock created by SuiKit, or original transaction block.
 * @return Scallop spool txBlock.
 */
export const newSpoolTxBlock = (
  builder: ScallopBuilder,
  initTxBlock?:
    | ScallopTxBlock
    | SuiKitTxBlock
    | Transaction
    | SuiTxBlockWithSCoin
) => {
  const txBlock =
    initTxBlock instanceof Transaction
      ? new SuiKitTxBlock(initTxBlock)
      : initTxBlock
        ? initTxBlock
        : new SuiKitTxBlock();

  const normalMethod = generateSpoolNormalMethod({
    builder,
    txBlock,
  });

  const normalTxBlock = new Proxy(txBlock, {
    get: (target, prop) => {
      if (prop in normalMethod) {
        return Reflect.get(normalMethod, prop);
      }
      return Reflect.get(target, prop);
    },
  }) as SuiTxBlockWithSpoolNormalMethods;

  const quickMethod = generateSpoolQuickMethod({
    builder,
    txBlock: normalTxBlock,
  });

  return new Proxy(normalTxBlock, {
    get: (target, prop) => {
      if (prop in quickMethod) {
        return Reflect.get(quickMethod, prop);
      }
      return Reflect.get(target, prop);
    },
  }) as SpoolTxBlock;
};
