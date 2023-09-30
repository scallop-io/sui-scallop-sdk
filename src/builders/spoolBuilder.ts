import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui.js/utils';
import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import { spoolRewardType } from '../constants/enum';
import { getStakeAccounts } from '../queries/spoolQuery';
import type { SuiTxArg } from '@scallop-io/sui-kit';
import type { ScallopBuilder } from '../models';
import type {
  SpoolIds,
  GenerateSpoolNormalMethod,
  GenerateSpoolQuickMethod,
  SuiTxBlockWithSpoolNormalMethods,
  SpoolTxBlock,
  SupportCoins,
  SupportStakeMarketCoins,
  ScallopTxBlock,
  TransactionResult,
} from '../types';

/**
 * Check and get the sender from the transaction block.
 *
 * @param txBlock - TxBlock created by SuiKit.
 * @return Sender of transaction.
 */
const requireSender = (txBlock: SuiKitTxBlock) => {
  const sender = txBlock.blockData.sender;
  if (!sender) {
    throw new Error('Sender is required');
  }
  return sender;
};

/**
 * Check and get stake account id from transaction block.
 *
 * @description
 * If the stake account id is provided, direactly return it.
 * Otherwise, automatically get all stake account id from the sender.
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - TxBlock created by SuiKit.
 * @param marketCoinName - The name of the market coin supported for staking.
 * @param stakeAccountId - Stake account id.
 * @return Stake account ids.
 */
const requireStakeAccountIds = async (
  ...params: [
    builder: ScallopBuilder,
    txBlock: SuiKitTxBlock,
    marketCoinName: SupportStakeMarketCoins,
    stakeAccountId?: SuiTxArg,
  ]
) => {
  const [builder, txBlock, marketCoinName, stakeAccountId] = params;
  if (params.length === 4 && stakeAccountId) return [stakeAccountId];
  const sender = requireSender(txBlock);
  const stakeAccounts = await getStakeAccounts(builder.query, sender);
  if (stakeAccounts[marketCoinName].length === 0) {
    throw new Error(`No stake account id found for sender ${sender}`);
  }
  return stakeAccounts[marketCoinName].map((account) => account.id);
};

/**
 * Check and get stake accounts information from transaction block.
 *
 * @description
 * If the stake account id is provided, direactly return its account.
 * Otherwise, automatically get all stake account from the sender.
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - TxBlock created by SuiKit.
 * @param marketCoinName - The name of the market coin supported for staking.
 * @param stakeAccountId - Stake account id.
 * @return Stake accounts.
 */
const requireStakeAccounts = async (
  ...params: [
    builder: ScallopBuilder,
    txBlock: SuiKitTxBlock,
    marketCoinName: SupportStakeMarketCoins,
    stakeAccountId?: SuiTxArg,
  ]
) => {
  const [builder, txBlock, marketCoinName, stakeAccountId] = params;
  const sender = requireSender(txBlock);
  const stakeAccounts = await getStakeAccounts(builder.query, sender);
  if (stakeAccounts[marketCoinName].length === 0) {
    throw new Error(`No stake account found for sender ${sender}`);
  }

  const specificStakeAccounts = stakeAccountId
    ? stakeAccounts[marketCoinName].filter((account) => {
        return account.id === stakeAccountId;
      })
    : stakeAccounts[marketCoinName];

  return specificStakeAccounts;
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
    createStakeAccount: (marketCoinName) => {
      const coinName = marketCoinName.slice(1) as SupportCoins;
      const marketCoinType = builder.utils.parseMarketCoinType(coinName);
      const stakePoolId = builder.address.get(
        `spool.pools.${marketCoinName}.id`
      );
      return txBlock.moveCall(
        `${spoolIds.spoolPkg}::user::new_spool_account`,
        [stakePoolId, SUI_CLOCK_OBJECT_ID],
        [marketCoinType]
      );
    },
    stake: (stakeAccount, coin, marketCoinName) => {
      const coinName = marketCoinName.slice(1) as SupportCoins;
      const marketCoinType = builder.utils.parseMarketCoinType(coinName);
      const stakePoolId = builder.address.get(
        `spool.pools.${marketCoinName}.id`
      );
      txBlock.moveCall(
        `${spoolIds.spoolPkg}::user::stake`,
        [stakePoolId, stakeAccount, coin, SUI_CLOCK_OBJECT_ID],
        [marketCoinType]
      );
    },
    unstake: (stakeAccount, amount, marketCoinName) => {
      const coinName = marketCoinName.slice(1) as SupportCoins;
      const marketCoinType = builder.utils.parseMarketCoinType(coinName);
      const stakePoolId = builder.address.get(
        `spool.pools.${marketCoinName}.id`
      );
      return txBlock.moveCall(
        `${spoolIds.spoolPkg}::user::unstake`,
        [stakePoolId, stakeAccount, amount, SUI_CLOCK_OBJECT_ID],
        [marketCoinType]
      );
    },
    claim: (stakeAccount, marketCoinName) => {
      const stakePoolId = builder.address.get(
        `spool.pools.${marketCoinName}.id`
      );
      const rewardPoolId = builder.address.get(
        `spool.pools.${marketCoinName}.rewardPoolId`
      );
      const coinName = marketCoinName.slice(1) as SupportCoins;
      const marketCoinType = builder.utils.parseMarketCoinType(coinName);
      const rewardCoinName = spoolRewardType[marketCoinName];
      const rewardType = builder.utils.parseCoinType(rewardCoinName);
      return txBlock.moveCall(
        `${spoolIds.spoolPkg}::user::redeem_rewards`,
        [stakePoolId, rewardPoolId, stakeAccount, SUI_CLOCK_OBJECT_ID],
        [marketCoinType, rewardType]
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
    stakeQuick: async (amountOrMarketCoin, marketCoinName, stakeAccountId) => {
      const sender = requireSender(txBlock);
      const stakeAccountIds = await requireStakeAccountIds(
        builder,
        txBlock,
        marketCoinName,
        stakeAccountId
      );

      const coinName = marketCoinName.slice(1) as SupportCoins;
      const marketCoinType = builder.utils.parseMarketCoinType(coinName);
      if (typeof amountOrMarketCoin === 'number') {
        const coins = await builder.utils.selectCoins(
          sender,
          amountOrMarketCoin,
          marketCoinType
        );
        const [takeCoin, leftCoin] = txBlock.takeAmountFromCoins(
          coins,
          amountOrMarketCoin
        );
        txBlock.stake(stakeAccountIds[0], takeCoin, marketCoinName);
        txBlock.transferObjects([leftCoin], sender);
      } else {
        txBlock.stake(stakeAccountIds[0], amountOrMarketCoin, marketCoinName);
      }
    },
    unstakeQuick: async (amount, marketCoinName, stakeAccountId) => {
      const stakeAccounts = await requireStakeAccounts(
        builder,
        txBlock,
        marketCoinName,
        stakeAccountId
      );
      const marketCoins: TransactionResult[] = [];
      for (const account of stakeAccounts) {
        if (account.staked === 0) continue;
        const amountToUnstake = Math.min(amount, account.staked);
        const marketCoin = txBlock.unstake(
          account.id,
          amountToUnstake,
          marketCoinName
        );
        marketCoins.push(marketCoin);
        amount -= amountToUnstake;
        if (amount === 0) break;
      }
      return marketCoins;
    },
    claimQuick: async (marketCoinName, stakeAccountId) => {
      const stakeAccountIds = await requireStakeAccountIds(
        builder,
        txBlock,
        marketCoinName,
        stakeAccountId
      );
      const rewardCoins: TransactionResult[] = [];
      for (const accountId of stakeAccountIds) {
        const rewardCoin = txBlock.claim(accountId, marketCoinName);
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
  initTxBlock?: ScallopTxBlock | SuiKitTxBlock | TransactionBlock
) => {
  const txBlock =
    initTxBlock instanceof TransactionBlock
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
