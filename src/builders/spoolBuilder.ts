import { TransactionBlock } from '@mysten/sui.js/transactions';
import {
  SUI_CLOCK_OBJECT_ID,
  SUI_TYPE_ARG,
  normalizeStructTag,
} from '@mysten/sui.js/utils';
import { SuiTxBlock as SuiKitTxBlock } from '@scallop-io/sui-kit';
import {
  getStakeAccount,
  getStakeAccounts,
  getStakeAccountsIds,
} from '../queries/spoolQuery';
import { parseOldOriginStakeAccountData, requireSender } from '../utils';
import type { SuiAddressArg, SuiObjectArg } from '@scallop-io/sui-kit';
import type { TransactionResult } from '@mysten/sui.js/transactions';
import type { ScallopBuilder } from '../models';
import type {
  SpoolIds,
  GenerateSpoolNormalMethod,
  GenerateSpoolQuickMethod,
  SuiTxBlockWithSpoolNormalMethods,
  SpoolTxBlock,
  SupportStakeMarketCoins,
  ScallopTxBlock,
  VescaIds,
  OriginOldStakeAccount,
  ParsedOldStakeAccount,
  GenerateSpoolMigrateMethod,
  SuiTxBlockWithSpoolQuickMethods,
} from '../types';
import { requireVeSca } from './vescaBuilder';
import {
  DAPP_DUMP_ADDRESS,
  IS_VE_SCA_TEST,
  OLD_SPOOL_ID,
  OLD_SPOOL_OBJECT,
  OLD_SPOOL_POOLS,
  SUPPORT_SPOOLS,
} from 'src/constants';
import { SuiObjectData } from '@mysten/sui.js/client';

/**
 * Check and get stake account id from transaction block.
 *
 * @description
 * If the stake account id is provided, directly return it.
 * Otherwise, automatically get all stake account ids from the sender.
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
    stakeAccountKey?: SuiAddressArg,
  ]
) => {
  const [
    builder,
    txBlock,
    stakeMarketCoinName,
    stakeAccountId,
    stakeAccountKey,
  ] = params;
  if (
    params.length === 5 &&
    stakeAccountId &&
    stakeAccountKey &&
    typeof stakeAccountId === 'string' &&
    typeof stakeAccountKey === 'string'
  ) {
    const stakeAccountData = await getStakeAccount(
      builder.query,
      stakeMarketCoinName,
      stakeAccountKey,
      stakeAccountId
    );

    return stakeAccountData;
  }

  if (stakeAccountId && stakeAccountKey) {
    return {
      id: stakeAccountId,
      keyId: stakeAccountKey,
    };
  }

  const sender = requireSender(txBlock);
  const stakeAccountsIds = await getStakeAccountsIds(
    builder.query,
    stakeMarketCoinName,
    sender
  );
  if (stakeAccountsIds.length === 0) {
    throw new Error(
      `No stake account id found for marketType ${stakeMarketCoinName} sender ${sender}`
    );
  }
  return stakeAccountsIds[0];
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
    stakeAccountKey?: SuiAddressArg,
  ]
) => {
  const [
    builder,
    txBlock,
    stakeMarketCoinName,
    stakeAccountId,
    stakeAccountKey,
  ] = params;
  const sender = requireSender(txBlock);
  if (
    params.length === 5 &&
    stakeAccountId &&
    stakeAccountKey &&
    typeof stakeAccountId === 'string' &&
    typeof stakeAccountKey === 'string'
  ) {
    const stakeAccount = await getStakeAccount(
      builder.query,
      stakeMarketCoinName,
      stakeAccountKey,
      stakeAccountId
    );

    return [stakeAccount];
  }

  const stakeAccounts = await getStakeAccounts(
    builder.query,
    stakeMarketCoinName,
    sender
  );
  if (stakeAccounts.length === 0) {
    throw new Error(`No stake account found for sender ${sender}`);
  }

  const specificStakeAccounts = stakeAccountId
    ? stakeAccounts.filter((account) => {
        return account.id === stakeAccountId;
      })
    : stakeAccounts;

  return specificStakeAccounts;
};

/**
 * Check and get old stake accounts
 * @param builder
 * @param owner
 * @returns Old stake accounts.
 */
const requireOldStakeAccounts = async (
  builder: ScallopBuilder,
  owner: string
) => {
  let cursor;
  let nextPage;
  const oldStakeAccounts: ParsedOldStakeAccount[] = [];
  const emptyStakeAccounts: SuiObjectData[] = [];

  const filter = {
    MatchAny: SUPPORT_SPOOLS.map((spool) => {
      const coinType = builder.utils.parseCoinType(spool);
      const marketCoinType = `0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf::reserve::MarketCoin<${coinType}>`;
      return {
        StructType: `${OLD_SPOOL_OBJECT}::spool_account::SpoolAccount<${marketCoinType}>`,
      };
    }),
  };

  // get old stake accounts
  do {
    const { data, nextCursor, hasNextPage } = await builder.suiKit
      .client()
      .getOwnedObjects({
        owner,
        filter,
        options: {
          showContent: true,
        },
        limit: 50,
        cursor,
      });

    data.forEach((object) => {
      if (object.data?.content?.dataType === 'moveObject') {
        const originOldStakeAccount = object.data.content
          .fields as any as OriginOldStakeAccount;
        const marketCoinName = builder.utils.parseCoinNameFromType(
          normalizeStructTag(originOldStakeAccount.stake_type.fields.name)
        ) as SupportStakeMarketCoins;
        const parsedOldStakeAccount = parseOldOriginStakeAccountData(
          originOldStakeAccount,
          marketCoinName
        );
        if (parsedOldStakeAccount.stakes > 0) {
          oldStakeAccounts.push(parsedOldStakeAccount);
        } else {
          emptyStakeAccounts.push(object.data);
        }
      }
    });
    if (hasNextPage && nextCursor) {
      nextPage = true;
      cursor = nextCursor;
    } else {
      nextPage = false;
    }
  } while (nextPage);

  return {
    oldStakeAccounts,
    emptyStakeAccounts,
  };
};

/**
 * Return binded stakeAccountId from veScaKey.
 * @param query
 * @param veScaKey
 * @returns stakeAccountId
 */
const getBindedStakeAccountId = async (
  builder: ScallopBuilder,
  veScaKey: string
) => {
  const spoolId = builder.address.get('spool.id');
  const spoolObjectId = builder.address.get('spool.object');
  const veScaPkgId = IS_VE_SCA_TEST
    ? '0xb220d034bdf335d77ae5bfbf6daf059c2cc7a1f719b12bfed75d1736fac038c8'
    : builder.address.get('vesca.id');

  const client = builder.suiKit.client();

  // get spool
  const incentivePoolsResponse = await client.getObject({
    id: spoolId,
    options: {
      showContent: true,
    },
  });

  if (incentivePoolsResponse.data?.content?.dataType !== 'moveObject')
    return false;
  const spoolFields = incentivePoolsResponse.data.content.fields as any;
  const veScaBindTableId = spoolFields.ve_sca_bind.fields.id.id as string;

  // check if veSca is inside the bind table
  const keyType = `${spoolObjectId}::typed_id::TypedID<${veScaPkgId}::ve_sca::VeScaKey>`;
  const veScaBindTableResponse = await client.getDynamicFieldObject({
    parentId: veScaBindTableId,
    name: {
      type: keyType,
      value: veScaKey,
    },
  });

  if (veScaBindTableResponse.data?.content?.dataType !== 'moveObject')
    return false;
  const veScaBindTableFields = veScaBindTableResponse.data.content
    .fields as any;
  // get stakeAccountId pair
  const stakeAccountId = veScaBindTableFields.value.fields.id as string;

  return stakeAccountId;
};

/**
 * Generate old spool normal methods.
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - TxBlock created by SuiKit .
 * @return Spool normal methods.
 */
// const generateSpoolNormalMethod: GenerateSpoolNormalMethod = ({
//   builder,
//   txBlock,
// }) => {
//   const spoolIds: SpoolIds = {
//     spoolPkg: builder.address.get('spool.id'),
//   };
//   return {
//     createStakeAccount: (stakeMarketCoinName) => {
//       const marketCoinType =
//         builder.utils.parseMarketCoinType(stakeMarketCoinName);
//       const stakePoolId = builder.address.get(
//         `spool.pools.${stakeMarketCoinName}.id`
//       );
//       return txBlock.moveCall(
//         `${spoolIds.spoolPkg}::user::new_spool_account`,
//         [stakePoolId, SUI_CLOCK_OBJECT_ID],
//         [marketCoinType]
//       );
//     },
//     stake: (stakeAccount, coin, stakeMarketCoinName) => {
//       const marketCoinType =
//         builder.utils.parseMarketCoinType(stakeMarketCoinName);
//       const stakePoolId = builder.address.get(
//         `spool.pools.${stakeMarketCoinName}.id`
//       );
//       txBlock.moveCall(
//         `${spoolIds.spoolPkg}::user::stake`,
//         [stakePoolId, stakeAccount, coin, SUI_CLOCK_OBJECT_ID],
//         [marketCoinType]
//       );
//     },
//     unstake: (stakeAccount, amount, stakeMarketCoinName) => {
//       const marketCoinType =
//         builder.utils.parseMarketCoinType(stakeMarketCoinName);
//       const stakePoolId = builder.address.get(
//         `spool.pools.${stakeMarketCoinName}.id`
//       );
//       return txBlock.moveCall(
//         `${spoolIds.spoolPkg}::user::unstake`,
//         [stakePoolId, stakeAccount, amount, SUI_CLOCK_OBJECT_ID],
//         [marketCoinType]
//       );
//     },
//     claim: (stakeAccount, stakeMarketCoinName) => {
//       const stakePoolId = builder.address.get(
//         `spool.pools.${stakeMarketCoinName}.id`
//       );
//       const rewardPoolId = builder.address.get(
//         `spool.pools.${stakeMarketCoinName}.rewardPoolId`
//       );
//       const marketCoinType =
//         builder.utils.parseMarketCoinType(stakeMarketCoinName);
//       const rewardCoinName =
//         builder.utils.getSpoolRewardCoinName(stakeMarketCoinName)[0];
//       const rewardCoinType = builder.utils.parseCoinType(rewardCoinName);
//       return txBlock.moveCall(
//         `${spoolIds.spoolPkg}::user::redeem_rewards`,
//         [stakePoolId, rewardPoolId, stakeAccount, SUI_CLOCK_OBJECT_ID],
//         [marketCoinType, rewardCoinType]
//       );
//     },
//   };
// };

// /**
//  * Generate spool quick methods.
//  *
//  * @description
//  * The quick methods are the same as the normal methods, but they will automatically
//  * help users organize transaction blocks, include get stake account info, and transfer
//  * coins to the sender. So, they are all asynchronous methods.
//  *
//  * @param builder - Scallop builder instance.
//  * @param txBlock - TxBlock created by SuiKit .
//  * @return Spool quick methods.
//  */
// const generateSpoolQuickMethod: GenerateSpoolQuickMethod = ({
//   builder,
//   txBlock,
// }) => {
//   return {
//     stakeQuick: async (
//       amountOrMarketCoin,
//       stakeMarketCoinName,
//       stakeAccountId
//     ) => {
//       const sender = requireSender(txBlock);
//       const stakeAccountIds = await requireStakeAccountIds(
//         builder,
//         txBlock,
//         stakeMarketCoinName,
//         stakeAccountId
//       );

//       const marketCoinType =
//         builder.utils.parseMarketCoinType(stakeMarketCoinName);
//       if (typeof amountOrMarketCoin === 'number') {
//         const coins = await builder.utils.selectCoinIds(
//           amountOrMarketCoin,
//           marketCoinType,
//           sender
//         );
//         const [takeCoin, leftCoin] = txBlock.takeAmountFromCoins(
//           coins,
//           amountOrMarketCoin
//         );
//         txBlock.stake(stakeAccountIds[0], takeCoin, stakeMarketCoinName);
//         txBlock.transferObjects([leftCoin], sender);
//       } else {
//         txBlock.stake(
//           stakeAccountIds[0],
//           amountOrMarketCoin,
//           stakeMarketCoinName
//         );
//       }
//     },
//     unstakeQuick: async (amount, stakeMarketCoinName, stakeAccountId) => {
//       const stakeAccounts = await requireStakeAccounts(
//         builder,
//         txBlock,
//         stakeMarketCoinName,
//         stakeAccountId
//       );
//       const stakeMarketCoins: TransactionResult[] = [];
//       for (const account of stakeAccounts) {
//         if (account.staked === 0) continue;
//         const amountToUnstake = Math.min(amount, account.staked);
//         const marketCoin = txBlock.unstake(
//           account.id,
//           amountToUnstake,
//           stakeMarketCoinName
//         );
//         stakeMarketCoins.push(marketCoin);
//         amount -= amountToUnstake;
//         if (amount === 0) break;
//       }
//       return stakeMarketCoins;
//     },
//     claimQuick: async (stakeMarketCoinName, stakeAccountId) => {
//       const stakeAccountIds = await requireStakeAccountIds(
//         builder,
//         txBlock,
//         stakeMarketCoinName,
//         stakeAccountId
//       );
//       const rewardCoins: TransactionResult[] = [];
//       for (const accountId of stakeAccountIds) {
//         const rewardCoin = txBlock.claim(accountId, stakeMarketCoinName);
//         rewardCoins.push(rewardCoin);
//       }
//       return rewardCoins;
//     },
//   };
// };

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
    spoolConfig: builder.address.get('spool.config'),
  };

  const veScaIds: Omit<VescaIds, 'pkgId'> = {
    table: builder.address.get('vesca.table'),
    treasury: builder.address.get('vesca.treasury'),
    config: builder.address.get('vesca.config'),
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
        [spoolIds.spoolConfig, stakePoolId, SUI_CLOCK_OBJECT_ID],
        [marketCoinType]
      );
    },
    completeAccountCreation: (spoolAccount, hotPotato, stakeMarketCoinName) => {
      const marketCoinType =
        builder.utils.parseMarketCoinType(stakeMarketCoinName);
      return txBlock.moveCall(
        `${spoolIds.spoolPkg}::user::complete_spool_account_creation`,
        [spoolIds.spoolConfig, spoolAccount, hotPotato],
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
        [
          spoolIds.spoolConfig,
          stakePoolId,
          stakeAccount,
          coin,
          SUI_CLOCK_OBJECT_ID,
        ],
        [marketCoinType]
      );
    },
    stakeWithVeSca: (
      stakeAccount,
      stakeAccountKey,
      coin,
      stakeMarketCoinName,
      VeScaKey
    ) => {
      const marketCoinType =
        builder.utils.parseMarketCoinType(stakeMarketCoinName);
      const stakePoolId = builder.address.get(
        `spool.pools.${stakeMarketCoinName}.id`
      );
      return txBlock.moveCall(
        `${spoolIds.spoolPkg}::user::stake_with_ve_sca`,
        [
          spoolIds.spoolConfig,
          stakePoolId,
          stakeAccount,
          stakeAccountKey,
          veScaIds.config,
          veScaIds.treasury,
          veScaIds.table,
          VeScaKey,
          coin,
          SUI_CLOCK_OBJECT_ID,
        ],
        [marketCoinType]
      );
    },
    unstake: (stakeAccount, stakeAccountKey, amount, stakeMarketCoinName) => {
      const marketCoinType =
        builder.utils.parseMarketCoinType(stakeMarketCoinName);
      const stakePoolId = builder.address.get(
        `spool.pools.${stakeMarketCoinName}.id`
      );
      return txBlock.moveCall(
        `${spoolIds.spoolPkg}::user::unstake`,
        [
          spoolIds.spoolConfig,
          stakePoolId,
          stakeAccount,
          stakeAccountKey,
          amount,
          SUI_CLOCK_OBJECT_ID,
        ],
        [marketCoinType]
      );
    },
    unstakeWithVeSca: (
      stakeAccount,
      stakeAccountKey,
      amount,
      stakeMarketCoinName,
      veScaKey
    ) => {
      const marketCoinType =
        builder.utils.parseMarketCoinType(stakeMarketCoinName);
      const stakePoolId = builder.address.get(
        `spool.pools.${stakeMarketCoinName}.id`
      );

      return txBlock.moveCall(
        `${spoolIds.spoolPkg}::user::unstake_with_ve_sca`,
        [
          spoolIds.spoolConfig,
          stakePoolId,
          stakeAccount,
          stakeAccountKey,
          veScaIds.config,
          veScaIds.treasury,
          veScaIds.table,
          veScaKey,
          amount,
          SUI_CLOCK_OBJECT_ID,
        ],
        [marketCoinType]
      );
    },
    claim: (
      stakeAccount,
      stakeAccountKey,
      stakeMarketCoinName,
      rewardCoinName
    ) => {
      const stakePoolId = builder.address.get(
        `spool.pools.${stakeMarketCoinName}.id`
      );
      const rewardPoolId = builder.address.get(
        `spool.pools.${stakeMarketCoinName}.rewardPoolId`
      );
      const marketCoinType =
        builder.utils.parseMarketCoinType(stakeMarketCoinName);
      const rewardCoinNames =
        builder.utils.getSpoolRewardCoinName(stakeMarketCoinName);
      if (rewardCoinNames.includes(rewardCoinName) === false) {
        throw new Error(`Invalid reward coin name ${rewardCoinName}`);
      }
      const rewardCoinType = builder.utils.parseCoinType(rewardCoinName);

      return txBlock.moveCall(
        `${spoolIds.spoolPkg}::user::redeem_rewards`,
        [
          spoolIds.spoolConfig,
          stakePoolId,
          rewardPoolId,
          stakeAccount,
          stakeAccountKey,
          SUI_CLOCK_OBJECT_ID,
        ],
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
 * @param txBlock - TxBlock created by SuiKit.
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
      stakeAccountId,
      stakeAccountKey
    ) => {
      const sender = requireSender(txBlock);

      const stakeAccountIds = await requireStakeAccountIds(
        builder,
        txBlock,
        stakeMarketCoinName,
        stakeAccountId,
        stakeAccountKey
      );

      if (stakeAccountIds) {
        const marketCoinType =
          builder.utils.parseMarketCoinType(stakeMarketCoinName);
        if (typeof amountOrMarketCoin === 'number') {
          const coins = await builder.utils.selectCoinIds(
            amountOrMarketCoin,
            marketCoinType,
            sender
          );
          const [takeCoin, leftCoin] = txBlock.takeAmountFromCoins(
            coins,
            amountOrMarketCoin
          );
          txBlock.stake(stakeAccountIds.id, takeCoin, stakeMarketCoinName);
          txBlock.transferObjects([leftCoin], sender);
        } else {
          txBlock.stake(
            stakeAccountIds.id,
            amountOrMarketCoin,
            stakeMarketCoinName
          );
        }
      }
    },
    stakeWithVeScaQuick: async (
      amountOrMarketCoin,
      stakeMarketCoinName,
      stakeAccountId,
      stakeAccountKey,
      veScaKey
    ) => {
      const sender = requireSender(txBlock);
      const stakeAccounts =
        stakeAccountId && stakeAccountKey
          ? [
              {
                id: stakeAccountId,
                keyId: stakeAccountKey,
              },
            ]
          : await requireStakeAccounts(
              builder,
              txBlock,
              stakeMarketCoinName,
              stakeAccountId
            );

      if (!stakeAccounts[0]) return;

      const veSca = await requireVeSca(builder, txBlock, veScaKey);
      const marketCoinType =
        builder.utils.parseMarketCoinType(stakeMarketCoinName);

      // handle coin
      const coinObject =
        typeof amountOrMarketCoin === 'number'
          ? await (async () => {
              const coins = await builder.utils.selectCoinIds(
                amountOrMarketCoin,
                marketCoinType,
                sender
              );
              const [takeCoin, leftCoin] = txBlock.takeAmountFromCoins(
                coins,
                amountOrMarketCoin
              );
              txBlock.transferObjects([leftCoin], sender);
              return takeCoin;
            })()
          : amountOrMarketCoin;

      const bindedStakeAccountId = veSca
        ? await getBindedStakeAccountId(builder, veSca.keyId)
        : undefined;

      if (
        veSca &&
        (!bindedStakeAccountId || bindedStakeAccountId === stakeAccountId)
      ) {
        console.log('1');
        txBlock.stakeWithVeSca(
          stakeAccounts[0].id,
          stakeAccounts[0].keyId,
          coinObject,
          stakeMarketCoinName,
          veSca.keyId
        );
      } else {
        console.log('2');
        txBlock.stake(stakeAccounts[0].id, coinObject, stakeMarketCoinName);
      }
    },
    unstakeQuick: async (
      amount,
      stakeMarketCoinName,
      stakeAccountId,
      stakeAccountKey
    ) => {
      const stakeAccounts = await requireStakeAccounts(
        builder,
        txBlock,
        stakeMarketCoinName,
        stakeAccountId,
        stakeAccountKey
      );
      const stakeMarketCoins: TransactionResult[] = [];
      if (stakeAccounts) {
        for (const account of stakeAccounts) {
          if (account?.staked === 0 || !account) continue;
          const amountToUnstake = Math.min(amount, account.staked);
          const marketCoin = txBlock.unstake(
            account.id,
            account.keyId,
            amountToUnstake,
            stakeMarketCoinName
          );
          stakeMarketCoins.push(marketCoin);
          amount -= amountToUnstake;
          if (amount === 0) break;
        }
      }
      return stakeMarketCoins;
    },
    unstakeWithVeScaQuick: async (
      amount,
      stakeMarketCoinName,
      stakeAccountId,
      veScaKey
    ) => {
      const stakeAccounts = await requireStakeAccounts(
        builder,
        txBlock,
        stakeMarketCoinName,
        stakeAccountId
      );

      const stakeMarketCoins: TransactionResult[] = [];
      if (stakeAccounts) {
        const veSca = await requireVeSca(builder, txBlock, veScaKey);
        const bindedStakeAccountId = veSca
          ? await getBindedStakeAccountId(builder, veSca.keyId)
          : undefined;
        for (const account of stakeAccounts) {
          if (account?.staked === 0 || !account) continue;
          const amountToUnstake = Math.min(amount, account.staked);
          const marketCoin =
            veSca &&
            (!bindedStakeAccountId || bindedStakeAccountId === stakeAccountId)
              ? txBlock.unstakeWithVeSca(
                  account.id,
                  account.keyId,
                  amount,
                  stakeMarketCoinName,
                  veSca.keyId
                )
              : txBlock.unstake(
                  account.id,
                  account.keyId,
                  amountToUnstake,
                  stakeMarketCoinName
                );
          stakeMarketCoins.push(marketCoin);
          amount -= amountToUnstake;
          if (amount === 0) break;
        }
      }
      return stakeMarketCoins;
    },
    claimQuick: async (stakeMarketCoinName, rewardCoinName, stakeAccountId) => {
      const stakeAccounts = await requireStakeAccounts(
        builder,
        txBlock,
        stakeMarketCoinName,
        stakeAccountId
      );

      const rewardCoins: TransactionResult[] = [];
      for (const account of stakeAccounts) {
        if (account) {
          const rewardCoin = txBlock.claim(
            account.id,
            account.keyId,
            stakeMarketCoinName,
            rewardCoinName
          );
          rewardCoins.push(rewardCoin);
        }
      }
      return rewardCoins;
    },
  };
};

/**
 *
 * @param builder - Scallop builder instance.
 * @param txBlock - TxBlock created by SuiKit.
 * @return Spool migrate methods.
 */
const generateSpoolMigrateMethod: GenerateSpoolMigrateMethod = ({
  builder,
  txBlock,
}) => {
  const spoolIds: SpoolIds = {
    spoolPkg: builder.address.get('spool.id'),
    spoolConfig: builder.address.get('spool.config'),
  };
  return {
    migrateNewSpoolQuick: async () => {
      /**
       * STEPS:
       * - Find all old stake account
       * - Claim all pending rewards
       * - Unstake all old stake account and get marketCoins
       * - Create new stake accounts for corresponding old stake, get the spoolAccountKey
       * - If veSCA exists, stake marketCoins with veSCA, otherwise call the normal stake function
       * - Transfer all spoolAccountKeys
       * - Dump empty old stake accounts
       */

      const sender = requireSender(txBlock);
      const { oldStakeAccounts, emptyStakeAccounts } =
        await requireOldStakeAccounts(builder, sender);

      if (oldStakeAccounts.length === 0) {
        return;
      }

      const transferObjects: SuiObjectArg[] = [];
      const filteredOldStakeAccounts = IS_VE_SCA_TEST
        ? oldStakeAccounts.filter((account) =>
            ['ssui', 'susdc'].includes(account.stakeMarketCoinName)
          )
        : oldStakeAccounts;
      for (const stakeAccount of filteredOldStakeAccounts) {
        const {
          id: stakeAccountId,
          stakeMarketCoinName,
          stakeType,
          stakes,
        } = stakeAccount;
        // claim rewards
        const reward = txBlock.moveCall(
          `${OLD_SPOOL_ID}::user::redeem_rewards`,
          [
            OLD_SPOOL_POOLS[stakeMarketCoinName].id,
            OLD_SPOOL_POOLS[stakeMarketCoinName].rewardPoolId,
            stakeAccountId,
            SUI_CLOCK_OBJECT_ID,
          ],
          [stakeType, SUI_TYPE_ARG]
        );
        transferObjects.push(reward);

        // unstake
        const stakeCoin = txBlock.moveCall(
          `${OLD_SPOOL_ID}::user::unstake`,
          [
            OLD_SPOOL_POOLS[stakeMarketCoinName].id,
            stakeAccountId,
            stakes,
            SUI_CLOCK_OBJECT_ID,
          ],
          [stakeType]
        );

        // create new stake accounts for corresponding old stake, get the spoolAccountKey
        const stakePoolId = builder.address.get(
          `spool.pools.${stakeMarketCoinName}.id`
        );

        const newStakeType =
          builder.utils.parseMarketCoinType(stakeMarketCoinName);

        const [newStakeAccount, newStakeAccountKey, hotPotato] =
          txBlock.moveCall(
            `${spoolIds.spoolPkg}::user::new_spool_account`,
            [spoolIds.spoolConfig, stakePoolId, SUI_CLOCK_OBJECT_ID],
            [newStakeType]
          );

        // stake marketCoins with veSCA
        await txBlock.stakeWithVeScaQuick(
          stakeCoin,
          stakeMarketCoinName,
          newStakeAccount,
          newStakeAccountKey
        );

        txBlock.moveCall(
          `${spoolIds.spoolPkg}::user::complete_spool_account_creation`,
          [spoolIds.spoolConfig, newStakeAccount, hotPotato],
          [newStakeType]
        );
        transferObjects.push(newStakeAccountKey);
      }
      if (emptyStakeAccounts.length > 0) {
        // dump empty old stake accounts
        txBlock.transferObjects(emptyStakeAccounts, DAPP_DUMP_ADDRESS);
      }

      if (transferObjects.length > 0) {
        // transfer pending reward and new stake account keys
        txBlock.transferObjects(transferObjects, sender);
      }
    },
    createStakeAccountQuick: async (stakeMarketCoinName, callback) => {
      const [account, accountKey, hotPotato] =
        txBlock.createStakeAccount(stakeMarketCoinName);
      if (callback) await callback(txBlock, account, accountKey);
      txBlock.completeAccountCreation(account, hotPotato, stakeMarketCoinName);
      return accountKey;
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

  const normalTxBlockWithQuickMethod = new Proxy(normalTxBlock, {
    get: (target, prop) => {
      if (prop in quickMethod) {
        return Reflect.get(quickMethod, prop);
      }
      return Reflect.get(target, prop);
    },
  }) as SuiTxBlockWithSpoolQuickMethods;

  const migrateMethod = generateSpoolMigrateMethod({
    builder,
    txBlock: normalTxBlockWithQuickMethod,
  });

  return new Proxy(normalTxBlockWithQuickMethod, {
    get: (target, prop) => {
      if (prop in migrateMethod) {
        return Reflect.get(migrateMethod, prop);
      }
      return Reflect.get(target, prop);
    },
  }) as SpoolTxBlock;
};
