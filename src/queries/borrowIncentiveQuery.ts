import { normalizeStructTag } from '@mysten/sui/utils';
import {
  parseOriginBorrowIncentivePoolData,
  parseOriginBorrowIncentiveAccountData,
  calculateBorrowIncentivePoolPointData,
  getSharedObjectData,
} from 'src/utils/index.js';
import type {
  ScallopAddress,
  ScallopQuery,
  ScallopSuiKit,
  ScallopUtils,
} from 'src/models/index.js';
import type {
  BorrowIncentivePoolsQueryInterface,
  BorrowIncentivePools,
  BorrowIncentiveAccountsQueryInterface,
  BorrowIncentiveAccounts,
  BorrowIncentivePoolPoints,
  InspectTxnParsedJson,
  OptionalKeys,
  SuiObjectRef,
  CoinPrices,
  MarketPools,
} from 'src/types/index.js';
import { BigNumber } from 'bignumber.js';
import { SuiTxBlock } from '@scallop-io/sui-kit';
import { queryKeys } from 'src/constants/index.js';

/**
 * Query borrow incentive pools data using moveCall
 * @param address
 * @returns
 */
const queryBorrowIncentivePools = async ({
  address,
  scallopSuiKit,
}: {
  address: ScallopAddress;
  scallopSuiKit: ScallopSuiKit;
}) => {
  const queryPkgId = address.get('borrowIncentive.query');
  const incentivePoolsId = address.get('borrowIncentive.incentivePools');

  const txBlock = new SuiTxBlock();
  const queryTarget = `${queryPkgId}::incentive_pools_query::incentive_pools_data`;
  const args = [
    txBlock.sharedObjectRef({
      ...(await getSharedObjectData(incentivePoolsId, scallopSuiKit)),
      mutable: true,
    }),
  ];
  const queryResult = await scallopSuiKit.queryInspectTxn({
    queryTarget,
    args,
    txBlock,
    keys: queryKeys.rpc.getInspectTxn({
      queryTarget,
      args: [incentivePoolsId],
      node: scallopSuiKit.currentFullNode,
    }),
  });
  const borrowIncentivePoolsQueryData = (
    queryResult as InspectTxnParsedJson<BorrowIncentivePoolsQueryInterface>
  )?.Transaction?.events?.[0]?.parsedJson;
  return borrowIncentivePoolsQueryData;
};

/**
 * Get borrow incentive pools data.
 *
 * @param query - The Scallop query instance.
 * @param borrowIncentiveCoinNames - Specific an array of support borrow incentive coin name.
 * @param indexer - Whether to use indexer.
 * @return Borrow incentive pools data.
 */
export const getBorrowIncentivePools = async (
  query: ScallopQuery,
  borrowIncentiveCoinNames: string[] = [...query.constants.whitelist.lending],
  indexer: boolean = false,
  marketPools?: MarketPools,
  coinPrices?: CoinPrices
) => {
  const borrowIncentivePools: BorrowIncentivePools = {};
  marketPools =
    marketPools ??
    (await query.getMarketPools(undefined, { coinPrices, indexer })).pools;
  coinPrices = coinPrices ?? (await query.getAllCoinPrices({ marketPools }));

  const borrowIncentivePoolsQueryData = await queryBorrowIncentivePools(query);

  for (const pool of borrowIncentivePoolsQueryData?.incentive_pools ?? []) {
    const borrowIncentivePoolPoints: OptionalKeys<
      Record<string, BorrowIncentivePoolPoints>
    > = {};
    const parsedBorrowIncentivePoolData = parseOriginBorrowIncentivePoolData(
      query.utils,
      pool
    );

    const poolCoinType = normalizeStructTag(pool.pool_type.name);
    const poolCoinName = query.utils.parseCoinNameFromType(poolCoinType);
    const poolCoinPrice = coinPrices?.[poolCoinName] ?? 0;
    const poolCoinDecimal = query.utils.getCoinDecimal(poolCoinName);

    // Filter pools not yet supported by the SDK.
    if (!borrowIncentiveCoinNames.includes(poolCoinName)) {
      continue;
    }

    // pool points for borrow incentive reward
    for (const [coinName, poolPoint] of Object.entries(
      parsedBorrowIncentivePoolData.poolPoints
    )) {
      if (!poolPoint) continue;
      const rewardCoinType = poolPoint.pointType;
      const rewardCoinName = query.utils.parseCoinNameFromType(
        rewardCoinType
      ) as string;
      // handle for scoin name
      const rewardCoinDecimal = query.utils.getCoinDecimal(rewardCoinName);
      if (rewardCoinDecimal === undefined)
        throw new Error(`Coin decimal not found for ${rewardCoinName}`);

      const rewardCoinPrice = coinPrices?.[rewardCoinName] ?? 0;

      const symbol = query.utils.parseSymbol(rewardCoinName);
      const coinDecimal = query.utils.getCoinDecimal(rewardCoinName);

      const calculatedPoolPoint = calculateBorrowIncentivePoolPointData(
        // parsedBorrowIncentivePoolData,
        poolPoint,
        rewardCoinPrice,
        rewardCoinDecimal,
        poolCoinPrice,
        poolCoinDecimal
      );

      if (poolPoint.points > calculatedPoolPoint.accumulatedPoints) {
        borrowIncentivePoolPoints[coinName as string] = {
          symbol,
          coinName: rewardCoinName,
          coinType: rewardCoinType,
          coinDecimal,
          coinPrice: rewardCoinPrice,
          points: poolPoint.points,
          distributedPoint: poolPoint.distributedPoint,
          weightedAmount: poolPoint.weightedAmount,
          ...calculatedPoolPoint,
        };
      }
    }

    const stakedAmount = BigNumber(parsedBorrowIncentivePoolData.staked);
    const stakedCoin = stakedAmount.shiftedBy(-1 * poolCoinDecimal);
    const stakedValue = stakedCoin.multipliedBy(poolCoinPrice);

    borrowIncentivePools[poolCoinName] = {
      coinName: poolCoinName,
      symbol: query.utils.parseSymbol(poolCoinName),
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

/**
 * Query borrow incentive accounts data.
 *
 * @param query - The Scallop query instance.
 * @param borrowIncentiveCoinNames - Specific an array of support borrow incentive coin name.
 * @return Borrow incentive accounts data.
 */
export const queryBorrowIncentiveAccounts = async (
  { utils }: { utils: ScallopUtils },
  obligationId: string | SuiObjectRef,
  borrowIncentiveCoinNames: string[] = [...utils.constants.whitelist.lending]
) => {
  const txBlock = new SuiTxBlock();
  const queryPkgId = utils.address.get('borrowIncentive.query');
  const incentiveAccountsId = utils.address.get(
    'borrowIncentive.incentiveAccounts'
  );
  const queryTarget = `${queryPkgId}::incentive_account_query::incentive_account_data`;
  const [incentiveAccountVersion, obligationDataVersion] = await Promise.all([
    getSharedObjectData(incentiveAccountsId, utils.scallopSuiKit),
    getSharedObjectData(obligationId, utils.scallopSuiKit),
  ]);

  const args = [
    txBlock.sharedObjectRef({
      ...incentiveAccountVersion,
      mutable: true,
    }),
    txBlock.sharedObjectRef({
      ...obligationDataVersion,
      mutable: true,
    }),
  ];

  const queryResult = await utils.scallopSuiKit.queryInspectTxn({
    queryTarget,
    args,
    txBlock,
    keys: queryKeys.rpc.getInspectTxn({
      queryTarget,
      args: [incentiveAccountsId, obligationId],
      node: utils.scallopSuiKit.currentFullNode,
    }),
  });
  const borrowIncentiveAccountsQueryData = (
    queryResult as InspectTxnParsedJson<BorrowIncentiveAccountsQueryInterface>
  )?.Transaction?.events?.[0]?.parsedJson;

  const borrowIncentiveAccounts: BorrowIncentiveAccounts = Object.values(
    borrowIncentiveAccountsQueryData?.pool_records ?? []
  ).reduce((accounts, accountData) => {
    const parsedBorrowIncentiveAccount = parseOriginBorrowIncentiveAccountData(
      utils,
      accountData
    );
    const poolType = parsedBorrowIncentiveAccount.poolType;
    const coinName = utils.parseCoinNameFromType(poolType);

    if (
      borrowIncentiveCoinNames &&
      borrowIncentiveCoinNames.includes(coinName)
    ) {
      accounts[coinName] = parsedBorrowIncentiveAccount;
    }

    return accounts;
  }, {} as BorrowIncentiveAccounts);

  return borrowIncentiveAccounts;
};

/**
 * Check veSca bind status
 * @param query
 * @param veScaKey
 * @returns
 */
export const getBindedObligationId = async (
  {
    address,
    scallopSuiKit,
  }: {
    address: ScallopAddress;
    scallopSuiKit: ScallopSuiKit;
  },
  veScaKeyId: string
): Promise<string | null> => {
  const borrowIncentiveObjectId = address.get('borrowIncentive.object');
  const incentivePoolsId = address.get('borrowIncentive.incentivePools');
  const veScaObjId = address.get('vesca.object');

  // get incentive pools
  const incentivePoolsResponse =
    await scallopSuiKit.queryGetObject(incentivePoolsId);

  const incentivePoolsObject = incentivePoolsResponse?.object;
  const incentivePoolsJson = incentivePoolsObject?.json as any;
  if (!incentivePoolsJson?.fields) return null;
  const incentivePoolFields = incentivePoolsJson.fields as {
    ve_sca_bind: { fields: { id: { id: string } } };
  };
  const veScaBindTableId = incentivePoolFields.ve_sca_bind.fields.id
    .id as string;

  // check if veSca is inside the bind table
  const keyType = `${borrowIncentiveObjectId}::typed_id::TypedID<${veScaObjId}::ve_sca::VeScaKey>`;
  const veScaBindTableResponse = await scallopSuiKit.queryGetDynamicFieldObject(
    {
      parentId: veScaBindTableId,
      name: {
        type: keyType,
        value: veScaKeyId,
      },
    }
  );

  const veScaBindObject = veScaBindTableResponse?.object;
  const veScaBindJson = veScaBindObject?.json as any;
  if (!veScaBindJson?.fields) return null;
  const veScaBindTableFields = veScaBindJson.fields as {
    value: { fields: { id: string } };
  };
  const obligationId = veScaBindTableFields.value.fields.id;

  return obligationId;
};

export const getBindedVeScaKey = async (
  {
    address,
    scallopSuiKit,
  }: {
    address: ScallopAddress;
    scallopSuiKit: ScallopSuiKit;
  },
  obligationId: string
): Promise<string | null> => {
  const borrowIncentiveObjectId = address.get('borrowIncentive.object');
  const incentiveAccountsId = address.get('borrowIncentive.incentiveAccounts');
  const corePkg = address.get('core.object');

  // get IncentiveAccounts object
  const incentiveAccountsResponse =
    await scallopSuiKit.queryGetObject(incentiveAccountsId);
  const incentiveAccountsObject = incentiveAccountsResponse?.object;
  const incentiveAccountsJson = incentiveAccountsObject?.json as any;
  if (!incentiveAccountsJson?.fields) return null;
  const incentiveAccountsFields = incentiveAccountsJson.fields as {
    accounts: { fields: { id: { id: string } } };
  };
  const incentiveAccountsTableId =
    incentiveAccountsFields.accounts.fields.id.id;

  // Search in the table
  const bindedIncentiveAcc = await scallopSuiKit.queryGetDynamicFieldObject({
    parentId: incentiveAccountsTableId,
    name: {
      type: `${borrowIncentiveObjectId}::typed_id::TypedID<${corePkg}::obligation::Obligation>`,
      value: obligationId,
    },
  });

  const bindedIncentiveAccObject = bindedIncentiveAcc?.object;
  const bindedIncentiveAccJson = bindedIncentiveAccObject?.json as any;
  if (!bindedIncentiveAccJson?.fields) return null;
  const bindedIncentiveAccFields = bindedIncentiveAccJson.fields as {
    value: {
      fields: { binded_ve_sca_key?: { fields: { id: string } } };
    };
  };

  return (
    bindedIncentiveAccFields.value.fields.binded_ve_sca_key?.fields.id ?? null
  );
};
