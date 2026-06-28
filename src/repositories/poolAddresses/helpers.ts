import { SuiClientTypes } from '@mysten/sui/client';
import { bcs } from '@mysten/sui/bcs';
import {
  PoolAddress,
  PoolAddressesApiContext,
  PoolAddressesOnChainContext,
} from './types.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import { MarketObjectJsonSchema } from './schema.js';
import { logError } from '../utils.js';
import { ScallopParseError, ScallopRpcError } from 'src/errors/index.js';
import {
  ADDRESS_TYPE,
  BORROW_FEE_TYPE,
  BORROW_LIMIT_TYPE,
  ISOLATED_ASSET_KEY,
  SUPPLY_LIMIT_TYPE,
} from './const.js';
import type { SuiObjectData } from 'src/types/index.js';
import { partitionArray } from 'src/utils/array.js';

export const getPoolAddressesFromApi = async (
  ctx: PoolAddressesApiContext,
  {
    poolNames = [],
  }: {
    poolNames?: string[];
  }
) => {
  const nameSet = new Set(poolNames);
  const { fetchWithCache, api } = ctx;
  const response = await fetchWithCache({
    queryKey: queryKeys.api.getPoolAddresses(),
    queryFn: () => api.get<Record<string, PoolAddress>>(`/pool/addresses`),
  });

  if (nameSet.size === 0) {
    return response;
  }

  return Object.entries(response).reduce<Record<string, PoolAddress>>(
    (acc, [key, value]) => {
      if (!nameSet.has(key)) {
        return acc;
      }
      acc[key] = value;
      return acc;
    },
    {}
  );
};

type DynamicValueObject = { objectId: string; json: unknown };

const parseDynamicFieldCoinTypeKey = (
  field: SuiClientTypes.DynamicFieldEntry
): string | undefined => {
  try {
    if (field.name.type.includes('::type_name::TypeName')) {
      return bcs
        .struct('TypeName', { name: bcs.string() })
        .parse(field.name.bcs).name;
    }
    return bcs.string().parse(field.name.bcs);
  } catch {
    return undefined;
  }
};

const queryDynamicValueObjectIds = async (
  ctx: PoolAddressesOnChainContext,
  {
    parentId,
    type,
    coinTypeKeys,
  }: {
    parentId: string;
    type: string;
    coinTypeKeys: ReadonlySet<string>;
  }
): Promise<Record<string, string>> => {
  const { onchain, fetchWithCache } = ctx;
  const result: Record<string, string> = {};
  let cursor: string | null | undefined = null;
  let hasNextPage = false;

  do {
    const options: SuiClientTypes.ListDynamicFieldsOptions = {
      parentId,
      cursor,
      limit: 50,
    };
    const resp = await fetchWithCache({
      queryKey: queryKeys.rpc.getDynamicFields({
        ...options,
        node: onchain.url,
      }),
      queryFn: () => onchain.client.listDynamicFields(options),
    });

    for (const field of resp.dynamicFields) {
      if (field.name.type !== type) continue;
      const coinTypeKey = parseDynamicFieldCoinTypeKey(field);
      if (coinTypeKey && coinTypeKeys.has(coinTypeKey)) {
        result[coinTypeKey] = field.fieldId;
      }
    }

    cursor = resp.cursor;
    hasNextPage = resp.hasNextPage;
  } while (hasNextPage);

  return result;
};

const queryDynamicValueObjects = async (
  ctx: PoolAddressesOnChainContext,
  requests: Record<string, Record<string, string>>
): Promise<Record<string, Record<string, DynamicValueObject | undefined>>> => {
  const { onchain, fetchWithCache } = ctx;
  const objectIds = [
    ...new Set(Object.values(requests).flatMap((ids) => Object.values(ids))),
  ];
  const objectDataMap: Record<string, SuiObjectData> = {};

  for (const batch of partitionArray(objectIds, 50)) {
    const { objects } = await fetchWithCache({
      queryKey: queryKeys.rpc.getObjects({
        objectIds: batch,
        node: onchain.url,
      }),
      queryFn: () =>
        onchain.client.getObjects({
          objectIds: batch,
          include: { json: true },
        }),
    });

    for (const object of objects) {
      if (!(object instanceof Error)) {
        objectDataMap[object.objectId] = object;
      }
    }
  }

  return Object.entries(requests).reduce<
    Record<string, Record<string, DynamicValueObject | undefined>>
  >((resolved, [name, idsByCoinType]) => {
    resolved[name] = Object.entries(idsByCoinType).reduce<
      Record<string, DynamicValueObject | undefined>
    >((objects, [coinTypeKey, objectId]) => {
      const object = objectDataMap[objectId];
      objects[coinTypeKey] = object
        ? { objectId: object.objectId, json: object.json }
        : undefined;
      return objects;
    }, {});
    return resolved;
  }, {});
};

/**
 * Scan the market's `flash_loan_fees` table (keyed by `TypeName`) and map each
 * requested coinType to its flashloan-fee object id.
 */
const queryFlashloanFeeObjectIds = async (
  ctx: PoolAddressesOnChainContext,
  coinTypes: Set<string>,
  flashLoanFeesTableId: string
): Promise<Record<string, string>> => {
  const { onchain, fetchWithCache } = ctx;
  const result: Record<string, string> = {};

  let cursor: string | null | undefined = null;
  let hasNextPage = false;

  do {
    const options: SuiClientTypes.ListDynamicFieldsOptions = {
      parentId: flashLoanFeesTableId,
      limit: 50,
      cursor,
    };
    const resp = await fetchWithCache({
      queryKey: queryKeys.rpc.getDynamicFields({
        ...options,
        node: onchain.url,
      }),
      queryFn: () => onchain.client.listDynamicFields(options),
    });
    if (!resp) break;

    for (const field of resp.dynamicFields) {
      const parsed = bcs
        .struct('TypeName', { name: bcs.string() })
        .parse(field.name.bcs);
      const assetType = `0x${parsed.name}`;
      if (coinTypes.has(assetType)) {
        result[assetType] = field.fieldId;
      }
    }

    cursor = resp.cursor;
    hasNextPage = resp.hasNextPage;
  } while (hasNextPage);

  return result;
};

/**
 * Rebuild the full pool-address map from on-chain data. The coin config
 * (coinType / symbol / decimals / pyth / spool / sCoin) comes from the injected
 * `metadata.addresses`; the per-pool object ids are resolved from the market's
 * sub-tables. Optionally filtered to `poolNames`.
 */
export const getPoolAddressesFromOnChain = async (
  ctx: PoolAddressesOnChainContext,
  {
    poolNames = [],
  }: {
    poolNames?: string[];
  }
): Promise<Record<string, PoolAddress>> => {
  const {
    onchain,
    fetchWithCache,
    metadata: { addresses },
  } = ctx;
  const { core, spool, scoin } = addresses;
  const { market, coins } = core;

  // 1. Market object → sub-table parent ids (incl. the flashloan-fee table).
  const marketFetchOptions: SuiClientTypes.GetObjectOptions<{ json: true }> = {
    objectId: market,
    include: { json: true },
  };
  const { object } = await fetchWithCache({
    queryKey: queryKeys.rpc.getObject({
      ...marketFetchOptions,
      node: onchain.url,
    }),
    queryFn: () => onchain.getObject(marketFetchOptions),
  });

  const parsed = MarketObjectJsonSchema.safeParse(object?.json);
  if (!parsed.success) {
    throw logError(
      ctx.logger,
      new ScallopParseError(
        'Failed to parse market object from on-chain data',
        {
          context: { market },
          cause: parsed.error,
        }
      )
    );
  }
  const marketFields = parsed.data;

  const balanceSheetParentId = marketFields.vault.balance_sheets.table.id;
  const collateralStatsParentId = marketFields.collateral_stats.table.id;
  const borrowDynamicsParentId = marketFields.borrow_dynamics.table.id;
  const interestModelParentId = marketFields.interest_models.table.id;
  const riskModelParentId = marketFields.risk_models.table.id;
  const flashLoanFeesTableId = marketFields.vault.flash_loan_fees.table.id;

  // 2. coinName → config pairs from the address config, filtered by poolNames.
  const poolNameSet = new Set(poolNames);
  const coinPairs = Object.entries(coins).filter(
    (entry): entry is [string, NonNullable<(typeof entry)[1]>] => {
      const [coinName, cfg] = entry;
      if (!cfg?.coinType) return false;
      return poolNameSet.size === 0 || poolNameSet.has(coinName);
    }
  );
  if (coinPairs.length === 0) {
    throw logError(
      ctx.logger,
      new ScallopRpcError(
        'No coins to resolve pool addresses for (empty config or filter matched nothing)',
        { context: { poolNames } }
      )
    );
  }

  // 3. One scan of the flashloan-fee table for all requested coins.
  const flashloanFeeObjectIds = await queryFlashloanFeeObjectIds(
    ctx,
    new Set(coinPairs.map(([, cfg]) => cfg.coinType)),
    flashLoanFeesTableId
  );

  // 4. Resolve per-coin object ids by scanning each source table once, then
  // batch-fetching the value objects.
  const coinTypeKeys = new Set(
    coinPairs.map(([, cfg]) => cfg.coinType.slice(2))
  );
  const [
    lendingPoolIds,
    collateralPoolIds,
    borrowDynamicIds,
    interestModelIds,
    riskModelIds,
    borrowFeeIds,
    supplyLimitIds,
    borrowLimitIds,
    isolatedAssetIds,
  ] = await Promise.all([
    queryDynamicValueObjectIds(ctx, {
      parentId: balanceSheetParentId,
      type: ADDRESS_TYPE,
      coinTypeKeys,
    }),
    queryDynamicValueObjectIds(ctx, {
      parentId: collateralStatsParentId,
      type: ADDRESS_TYPE,
      coinTypeKeys,
    }),
    queryDynamicValueObjectIds(ctx, {
      parentId: borrowDynamicsParentId,
      type: ADDRESS_TYPE,
      coinTypeKeys,
    }),
    queryDynamicValueObjectIds(ctx, {
      parentId: interestModelParentId,
      type: ADDRESS_TYPE,
      coinTypeKeys,
    }),
    queryDynamicValueObjectIds(ctx, {
      parentId: riskModelParentId,
      type: ADDRESS_TYPE,
      coinTypeKeys,
    }),
    queryDynamicValueObjectIds(ctx, {
      parentId: market,
      type: BORROW_FEE_TYPE,
      coinTypeKeys,
    }),
    queryDynamicValueObjectIds(ctx, {
      parentId: market,
      type: SUPPLY_LIMIT_TYPE,
      coinTypeKeys,
    }),
    queryDynamicValueObjectIds(ctx, {
      parentId: market,
      type: BORROW_LIMIT_TYPE,
      coinTypeKeys,
    }),
    queryDynamicValueObjectIds(ctx, {
      parentId: market,
      type: ISOLATED_ASSET_KEY,
      coinTypeKeys,
    }),
  ]);

  const dynamicObjects = await queryDynamicValueObjects(ctx, {
    lendingPool: lendingPoolIds,
    collateralPool: collateralPoolIds,
    borrowDynamic: borrowDynamicIds,
    interestModel: interestModelIds,
    riskModel: riskModelIds,
    borrowFee: borrowFeeIds,
    supplyLimit: supplyLimitIds,
    borrowLimit: borrowLimitIds,
    isolatedAsset: isolatedAssetIds,
  });

  // 5. Assemble the public pool-address map.
  const results: Record<string, PoolAddress> = {};
  for (const [coinName, cfg] of coinPairs) {
    const { coinType } = cfg;
    const coinTypeKey = coinType.slice(2);
    const lendingPool = dynamicObjects.lendingPool[coinTypeKey];
    const collateralPool = dynamicObjects.collateralPool[coinTypeKey];
    const borrowDynamic = dynamicObjects.borrowDynamic[coinTypeKey];
    const interestModel = dynamicObjects.interestModel[coinTypeKey];
    const riskModel = dynamicObjects.riskModel[coinTypeKey];
    const borrowFee = dynamicObjects.borrowFee[coinTypeKey];
    const supplyLimit = dynamicObjects.supplyLimit[coinTypeKey];
    const borrowLimit = dynamicObjects.borrowLimit[coinTypeKey];
    const isolatedAsset = dynamicObjects.isolatedAsset[coinTypeKey];

    const isolatedJson = isolatedAsset?.json as
      | { id?: string; value?: boolean }
      | undefined;

    const sCoinName = `s${coinName}`;
    const spoolPool = spool.pools[sCoinName];
    const sCoin = scoin.coins[sCoinName];
    const pyth = cfg.oracle?.pyth;

    results[coinName] = {
      coinName,
      symbol: cfg.symbol,
      coinType,
      coinMetadataId: cfg.metaData,
      decimals: cfg.decimals,
      lendingPoolAddress: lendingPool?.objectId ?? '',
      collateralPoolAddress: collateralPool?.objectId ?? '',
      borrowDynamic: borrowDynamic?.objectId ?? '',
      interestModel: interestModel?.objectId ?? '',
      riskModel: riskModel?.objectId,
      borrowFeeKey: borrowFee?.objectId ?? '',
      supplyLimitKey: supplyLimit?.objectId ?? '',
      borrowLimitKey: borrowLimit?.objectId ?? '',
      isolatedAssetKey: isolatedJson?.id ?? '',
      isIsolated: isolatedJson?.value ?? false,
      spool: spoolPool?.id ?? '',
      spoolReward: spoolPool?.rewardPoolId ?? '',
      spoolName: sCoinName,
      sCoinName,
      sCoinType: sCoin?.coinType ?? '',
      sCoinTreasury: sCoin?.treasury ?? '',
      sCoinMetadataId: sCoin?.metaData ?? '',
      sCoinSymbol: sCoin?.symbol ?? '',
      pythFeed: pyth?.feed ?? '',
      pythFeedObjectId: pyth?.feedObject ?? '',
      flashloanFeeObject: flashloanFeeObjectIds[coinType] ?? '',
    };
  }

  return results;
};
