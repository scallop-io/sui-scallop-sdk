import { SuiTxBlock } from '@scallop-io/sui-kit';
import type {
  BorrowIncentiveRepoContext,
  BorrowIncentiveAccounts,
  BorrowIncentiveAccountsQueryInterface,
  BorrowIncentivePoolPoints,
  BorrowIncentivePools,
  BorrowIncentivePoolsQueryInterface,
  BorrowIncentiveReadArgs,
} from './types.js';
import { getSharedObjectData } from 'src/utils/object.js';
import { logError } from '../util.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import {
  mapBorrowIncentiveAccountsEvent,
  mapBorrowIncentivePoolsEvent,
} from 'src/mappers/borrowIncentiveMapper.js';
import type { OptionalKeys } from 'src/types/utils.js';
import {
  calculateBorrowIncentivePoolPointData,
  parseOriginBorrowIncentiveAccountData,
  parseOriginBorrowIncentivePoolData,
} from './utils.js';
import { BigNumber } from 'bignumber.js';

export const getBorrowIncentivePoolsFromOnChain = async (
  ctx: BorrowIncentiveRepoContext,
  { coinNames, coinPrices }: BorrowIncentiveReadArgs
): Promise<BorrowIncentivePools> => {
  const { onchain, addresses, metadata, fetchWithCache } = ctx;
  const tx = new SuiTxBlock();
  const queryTarget = `${addresses.query}::incentive_pools_query::incentive_pools_data`;

  const fetchOptions = {
    objectId: addresses.incentivePools,
    node: onchain.url,
  };
  const incentivePoolsSharedObject = await fetchWithCache({
    queryKey: queryKeys.rpc.getSharedObject({
      ...fetchOptions,
      node: onchain.url,
    }),
    queryFn: () =>
      getSharedObjectData(onchain, {
        tx,
        mutable: true,
        ...fetchOptions,
      }),
  });

  const args = [incentivePoolsSharedObject];
  tx.moveCall(queryTarget, args, []);

  const queryResult = await fetchWithCache({
    queryKey: queryKeys.rpc.getInspectTxn({
      queryTarget,
      args: [addresses.incentivePools],
      node: onchain.url,
    }),
    queryFn: () =>
      onchain.client.simulateTransaction({
        transaction: tx.txBlock,
        include: {
          events: true,
        },
      }),
  });

  const data = queryResult?.Transaction ?? queryResult?.FailedTransaction;
  const borrowIncentivePoolsData = mapBorrowIncentivePoolsEvent(
    data?.events?.[0]?.json as unknown as
      | BorrowIncentivePoolsQueryInterface
      | undefined
  );

  const enabledCoinNames = coinNames ?? [
    ...metadata.whitelist.lending.values(),
  ];

  const borrowIncentivePools: BorrowIncentivePools = {};

  for (const pool of borrowIncentivePoolsData?.incentive_pools ?? []) {
    const borrowIncentivePoolPoints: OptionalKeys<
      Record<string, BorrowIncentivePoolPoints>
    > = {};
    const parsedBorrowIncentivePoolData = parseOriginBorrowIncentivePoolData(
      metadata.parseCoinNameFromType,
      pool
    );

    const poolCoinType = pool.pool_type;
    const poolCoinName = metadata.parseCoinNameFromType(poolCoinType);
    const poolCoinPrice = coinPrices[poolCoinName] ?? 0;
    const poolCoinDecimal = metadata.getCoinDecimal(poolCoinName);
    if (poolCoinDecimal === undefined) {
      throw logError(ctx.logger, `Coin decimal not found for ${poolCoinName}`);
    }

    if (!enabledCoinNames.includes(poolCoinName)) {
      continue;
    }

    for (const [coinName, poolPoint] of Object.entries(
      parsedBorrowIncentivePoolData.poolPoints
    )) {
      if (!poolPoint) continue;
      const rewardCoinType = poolPoint.pointType;
      const rewardCoinName = metadata.parseCoinNameFromType(rewardCoinType);
      const rewardCoinDecimal = metadata.getCoinDecimal(rewardCoinName);
      if (rewardCoinDecimal === undefined) {
        throw logError(
          ctx.logger,
          `Coin decimal not found for ${rewardCoinName}`
        );
      }

      const rewardCoinPrice = coinPrices[rewardCoinName] ?? 0;
      const symbol = metadata.parseSymbol(rewardCoinName);

      const calculatedPoolPoint = calculateBorrowIncentivePoolPointData(
        poolPoint,
        rewardCoinPrice,
        rewardCoinDecimal,
        poolCoinPrice,
        poolCoinDecimal
      );

      if (poolPoint.points > calculatedPoolPoint.accumulatedPoints) {
        borrowIncentivePoolPoints[coinName] = {
          symbol,
          coinName: rewardCoinName,
          coinType: rewardCoinType,
          coinDecimal: rewardCoinDecimal,
          coinPrice: rewardCoinPrice,
          points: poolPoint.points,
          distributedPoint: poolPoint.distributedPoint,
          weightedAmount: poolPoint.weightedAmount,
          ...calculatedPoolPoint,
        };
      }
    }

    const stakedAmount = BigNumber(parsedBorrowIncentivePoolData.staked);
    const stakedCoin = stakedAmount.shiftedBy(-poolCoinDecimal);
    const stakedValue = stakedCoin.multipliedBy(poolCoinPrice);

    borrowIncentivePools[poolCoinName] = {
      coinName: poolCoinName,
      symbol: metadata.parseSymbol(poolCoinName),
      coinType: poolCoinType,
      coinDecimal: poolCoinDecimal,
      coinPrice: poolCoinPrice,
      stakedAmount: stakedAmount.toNumber(),
      stakedCoin: stakedCoin.toNumber(),
      stakedValue: stakedValue.toNumber(),
      points: borrowIncentivePoolPoints,
    };
  }

  return borrowIncentivePools;
};

export const getBorrowIncentiveAccountsFromOnChain = async (
  ctx: BorrowIncentiveRepoContext,
  {
    coinNames,
    obligationId,
  }: {
    obligationId: string;
    coinNames?: string[];
  }
): Promise<BorrowIncentiveAccounts> => {
  const { addresses, metadata, fetchWithCache, onchain } = ctx;
  const tx = new SuiTxBlock();
  const queryTarget = `${addresses.query}::incentive_account_query::incentive_account_data`;

  const [incentiveAccountVersion, obligationDataVersion] = await Promise.all([
    fetchWithCache({
      queryKey: queryKeys.rpc.getSharedObject({
        objectId: addresses.incentiveAccounts,
        node: onchain.url,
      }),
      queryFn: () =>
        getSharedObjectData(onchain, {
          tx,
          mutable: true,
          objectId: addresses.incentiveAccounts,
        }),
    }),
    fetchWithCache({
      queryKey: queryKeys.rpc.getSharedObject({
        objectId: obligationId,
        node: onchain.url,
      }),
      queryFn: () =>
        getSharedObjectData(onchain, {
          tx,
          mutable: true,
          objectId: obligationId,
        }),
    }),
  ]);

  const args = [incentiveAccountVersion, obligationDataVersion];
  tx.moveCall(queryTarget, args, []);

  const queryResult = await fetchWithCache({
    queryKey: queryKeys.rpc.getInspectTxn({
      queryTarget,
      args: [addresses.incentiveAccounts, obligationId],
      node: onchain.url,
    }),
    queryFn: () =>
      onchain.client.simulateTransaction({
        transaction: tx.txBlock,
        include: {
          events: true,
        },
      }),
  });

  const data = queryResult?.Transaction ?? queryResult?.FailedTransaction;
  const borrowIncentiveAccountsQueryData = mapBorrowIncentiveAccountsEvent(
    data?.events?.[0]?.json as unknown as
      | BorrowIncentiveAccountsQueryInterface
      | undefined
  );

  const enabledCoinNames = coinNames ?? [
    ...metadata.whitelist.lending.values(),
  ];

  if (!borrowIncentiveAccountsQueryData) {
    return {};
  }

  return borrowIncentiveAccountsQueryData.pool_records.reduce(
    (accounts, accountData) => {
      const parsedBorrowIncentiveAccount =
        parseOriginBorrowIncentiveAccountData(
          metadata.parseCoinNameFromType,
          accountData
        );
      const poolType = parsedBorrowIncentiveAccount.poolType;
      const coinName = metadata.parseCoinNameFromType(poolType);

      if (enabledCoinNames.includes(coinName)) {
        accounts[coinName] = parsedBorrowIncentiveAccount;
      }

      return accounts;
    },
    {} as BorrowIncentiveAccounts
  );
};
