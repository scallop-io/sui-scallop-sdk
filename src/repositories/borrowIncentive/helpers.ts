import { SuiTxBlock } from '@scallop-io/sui-kit';
import type {
  BorrowIncentiveOnChainContext,
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
import { ScallopRpcError, ScallopParseError } from 'src/errors/index.js';
import { bcs } from '@mysten/sui/bcs';
import { queryKeys } from 'src/constants/queryKeys.js';
import type { OptionalKeys } from 'src/types/utils.js';
import {
  calculateBorrowIncentivePoolPointData,
  mapBorrowIncentiveAccountsEvent,
  mapBorrowIncentivePoolsEvent,
  parseOriginBorrowIncentiveAccountData,
  parseOriginBorrowIncentivePoolData,
} from './utils.js';
import { BigNumber } from 'bignumber.js';
import { SuiClientTypes } from '@mysten/sui/client';
import { encodeDynamicFieldNameForV2 } from 'src/utils/dynamicField.js';
import { IncentiveAccountBcs } from './bcs.js';

export const getBorrowIncentivePoolsFromOnChain = async (
  ctx: BorrowIncentiveOnChainContext,
  { coinNames, coinPrices }: BorrowIncentiveReadArgs
): Promise<BorrowIncentivePools> => {
  const { onchain, metadata, fetchWithCache } = ctx;
  const { borrowIncentive } = metadata.addresses;
  const tx = new SuiTxBlock();
  const queryTarget = `${borrowIncentive.query}::incentive_pools_query::incentive_pools_data`;

  const fetchOptions = {
    objectId: borrowIncentive.incentivePools,
  };
  const incentivePoolsObject = await fetchWithCache({
    queryKey: queryKeys.rpc.getSharedObject({
      ...fetchOptions,
      node: onchain.url,
    }),
    queryFn: () => onchain.getObject(fetchOptions),
  });
  if (!incentivePoolsObject.object) {
    throw logError(
      ctx.logger,
      new ScallopRpcError(
        `Failed to fetch incentive pools object ${borrowIncentive.incentivePools}`,
        { context: { objectId: borrowIncentive.incentivePools } }
      )
    );
  }
  const incentivePoolsSharedObject = await getSharedObjectData(
    { onchain, fetchWithCache },
    {
      tx,
      mutable: true,
      objectId: incentivePoolsObject.object,
    }
  );

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
      throw logError(
        ctx.logger,
        new ScallopParseError(`Coin decimal not found for ${poolCoinName}`, {
          context: { poolCoinName },
        })
      );
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
          new ScallopParseError(
            `Coin decimal not found for ${rewardCoinName}`,
            {
              context: { poolCoinName: rewardCoinName },
            }
          )
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

      // A campaign is exhausted once every allocated point has been
      // distributed (accumulatedPoints is min-capped at points). We still emit
      // the pool point — the portfolio query needs it to surface users'
      // already-accrued, unclaimed rewards — but zero out the APR so callers
      // don't display a stale reward rate for an ended campaign.
      const isExhausted =
        poolPoint.points <= calculatedPoolPoint.accumulatedPoints;

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
          ...(isExhausted ? { rewardApr: 0 } : {}),
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
  ctx: BorrowIncentiveOnChainContext,
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

  const getArg = async (objectId: string, mutable: boolean) => {
    const response = await fetchWithCache({
      queryKey: queryKeys.rpc.getSharedObject({
        objectId,
        node: onchain.url,
      }),
      queryFn: () => onchain.getObject({ objectId }),
    });
    if (!response.object) {
      throw logError(
        ctx.logger,
        new ScallopRpcError(`Failed to fetch object ${objectId}`, {
          context: { objectId },
        })
      );
    }
    return getSharedObjectData(
      { onchain, fetchWithCache },
      {
        tx,
        mutable,
        objectId: response.object,
      }
    );
  };

  const [incentiveAccountVersion, obligationDataVersion] = await Promise.all([
    getArg(borrowIncentive.incentiveAccounts, true),
    getArg(obligationId, true),
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
    onchain,
    fetchWithCache,
    metadata: { addresses },
  } = ctx;
  const { borrowIncentive, core } = addresses;

  // The accounts table id is a dynamic UID living inside the incentiveAccounts
  // object (`accounts.id`), not a static config address — derive it at runtime.
  const fetchOptions: SuiClientTypes.GetObjectOptions<{ json: true }> = {
    objectId: borrowIncentive.incentiveAccounts,
    include: {
      json: true,
    },
  };
  const incentiveAccountsObject = await fetchWithCache({
    queryKey: queryKeys.rpc.getObject(fetchOptions),
    queryFn: () => onchain.getObject(fetchOptions),
  });
  if (!incentiveAccountsObject.object) {
    throw logError(
      ctx.logger,
      new ScallopRpcError(
        `Failed to fetch incentive accounts object with id ${borrowIncentive.incentiveAccounts}`,
        { context: { objectId: borrowIncentive.incentiveAccounts } }
      )
    );
  }
  const incentiveAccountsTableId = parseObjectAs<{ accounts: { id: string } }>(
    incentiveAccountsObject.object
  ).accounts.id;

  const result = await getDynamicFieldOrNull(ctx, {
    parentId: incentiveAccountsTableId,
    name: encodeDynamicFieldNameForV2({
      type: `${borrowIncentive.object}::typed_id::TypedID<${core.object}::obligation::Obligation>`,
      value: obligationId,
    }),
  });
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
      new ScallopRpcError(
        `Failed to fetch incentive pool object with id ${borrowIncentive.incentivePools}`,
        { context: { objectId: borrowIncentive.incentivePools } }
      )
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
