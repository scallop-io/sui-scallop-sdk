import { SuiTxBlock } from '@scallop-io/sui-kit';
import type {
  BorrowIncentiveRepoContext,
  BorrowIncentiveAccounts,
  BorrowIncentiveAccountsQueryInterface,
  BorrowIncentivePoolPoints,
  BorrowIncentivePools,
  BorrowIncentivePoolsQueryInterface,
  BorrowIncentiveReadArgs,
  GetBindedVeScaKeyContext,
  GetBindedObligationContext,
} from './types.js';
import { getSharedObjectData, parseObjectAs } from 'src/utils/object.js';
import { getDynamicFieldOrNull, logError } from '../utils.js';
import { bcs } from '@mysten/sui/bcs';
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
import { SuiClientTypes } from '@mysten/sui/client';
import { encodeDynamicFieldNameForV2 } from 'src/utils/dynamicField.js';
import { IncentiveAccountBcs } from './bcs.js';

export const getBorrowIncentivePoolsFromOnChain = async (
  ctx: BorrowIncentiveRepoContext,
  { coinNames, coinPrices }: BorrowIncentiveReadArgs
): Promise<BorrowIncentivePools> => {
  const { onchain, metadata, fetchWithCache } = ctx;
  const { borrowIncentive } = metadata.addresses;
  const tx = new SuiTxBlock();
  const queryTarget = `${borrowIncentive.query}::incentive_pools_query::incentive_pools_data`;

  const fetchOptions = {
    objectId: borrowIncentive.incentivePools,
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
      args: [borrowIncentive.incentivePools],
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
  const { metadata, fetchWithCache, onchain } = ctx;
  const { borrowIncentive } = metadata.addresses;
  const tx = new SuiTxBlock();
  const queryTarget = `${borrowIncentive.query}::incentive_account_query::incentive_account_data`;

  const [incentiveAccountVersion, obligationDataVersion] = await Promise.all([
    fetchWithCache({
      queryKey: queryKeys.rpc.getSharedObject({
        objectId: borrowIncentive.incentiveAccounts,
        node: onchain.url,
      }),
      queryFn: () =>
        getSharedObjectData(onchain, {
          tx,
          mutable: true,
          objectId: borrowIncentive.incentiveAccounts,
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
      args: [borrowIncentive.incentiveAccounts, obligationId],
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

export const getBindedVeScaKeyByObligationIdFromOnChain = async (
  ctx: GetBindedVeScaKeyContext,
  obligationId: string
) => {
  const {
    metadata: { addresses },
  } = ctx;

  const fetchOptions: SuiClientTypes.GetDynamicFieldOptions = {
    parentId: addresses.borrowIncentive.incentiveAccountsTableId,
    name: encodeDynamicFieldNameForV2({
      type: `${addresses.borrowIncentive.object}::typed_id::TypedID<${addresses.core.object}::obligation::Obligation>`,
      value: obligationId,
    }),
  };

  const result = await getDynamicFieldOrNull(ctx, fetchOptions);
  if (!result) return null;

  const parsed = IncentiveAccountBcs.parse(result.dynamicField.value.bcs);
  return parsed.binded_ve_sca_key;
};

export const getBindedObligation = async (
  ctx: GetBindedObligationContext,
  veScaKey: string
) => {
  const {
    onchain,
    fetchWithCache,
    metadata: { addresses },
  } = ctx;
  const { borrowIncentive, vesca } = addresses;

  const fetchOptions: SuiClientTypes.GetObjectOptions<{ json: true }> = {
    objectId: borrowIncentive.incentivePools,
    include: {
      json: true,
    },
  };
  const incentivePoolsObject = await fetchWithCache({
    queryKey: queryKeys.rpc.getObject(fetchOptions),
    queryFn: () => onchain.getObject(fetchOptions),
  });

  if (!incentivePoolsObject.object) {
    throw logError(
      ctx.logger,
      `Failed to fetch incentive pool object with id ${borrowIncentive.incentivePools}`
    );
  }

  // the veSca bind table id lives inside the incentive pools object
  const veScaBindTableId = parseObjectAs<{ ve_sca_bind: { id: string } }>(
    incentivePoolsObject.object
  ).ve_sca_bind.id;

  // look up the veSca key in the bind table → bound obligation id
  const keyType = `${borrowIncentive.object}::typed_id::TypedID<${vesca.object}::ve_sca::VeScaKey>`;
  const result = await getDynamicFieldOrNull(ctx, {
    parentId: veScaBindTableId,
    name: encodeDynamicFieldNameForV2({
      type: keyType,
      value: veScaKey,
    }),
  });
  if (!result) return null;

  return bcs.Address.parse(result.dynamicField.value.bcs);
};
