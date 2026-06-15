import { SuiClientTypes } from '@mysten/sui/client';
import { bcs } from '@mysten/sui/bcs';
import { PoolAddress, PoolAddressesRepoContext } from './types.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import { MarketObjectJsonSchema } from './schema.js';
import { getDynamicFieldOrNull, logError } from '../utils.js';
import { encodeDynamicFieldNameForV2 } from 'src/utils/dynamicField.js';
import {
  ADDRESS_TYPE,
  BORROW_FEE_TYPE,
  BORROW_LIMIT_TYPE,
  ISOLATED_ASSET_KEY,
  SUPPLY_LIMIT_TYPE,
} from './const.js';

export const getPoolAddressesFromApi = async (
  ctx: PoolAddressesRepoContext,
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

/**
 * Resolve a market dynamic field to its value object — both the object id and
 * its parsed JSON. Returns `undefined` when the field isn't present (e.g. a
 * pool with no isolated-asset key). Two-step (dynamic field → object) because
 * some keys are plain `DynamicField`s, not `DynamicObjectField`s.
 */
const resolveDynamicValueObject = async (
  ctx: PoolAddressesRepoContext,
  parentId: string,
  type: string,
  value: unknown
): Promise<{ objectId: string; json: unknown } | undefined> => {
  const { onchain, fetchWithCache } = ctx;

  const dynamicField = await getDynamicFieldOrNull(ctx, {
    parentId,
    name: encodeDynamicFieldNameForV2({ type, value }),
  });
  if (!dynamicField) return undefined;

  const fetchOptions: SuiClientTypes.GetObjectOptions<{ json: true }> = {
    objectId: dynamicField.dynamicField.fieldId,
    include: { json: true },
  };
  const { object } = await fetchWithCache({
    queryKey: queryKeys.rpc.getObject({ ...fetchOptions, node: onchain.url }),
    queryFn: () => onchain.getObject(fetchOptions),
  });
  if (!object) return undefined;

  return { objectId: object.objectId, json: object.json };
};

/**
 * Scan the market's `flash_loan_fees` table (keyed by `TypeName`) and map each
 * requested coinType to its flashloan-fee object id.
 */
const queryFlashloanFeeObjectIds = async (
  ctx: PoolAddressesRepoContext,
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
  ctx: PoolAddressesRepoContext,
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
      `Failed to parse market object from on-chain data: ${parsed.error.message}`
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
      'No coins to resolve pool addresses for (empty config or filter matched nothing)'
    );
  }

  // 3. One scan of the flashloan-fee table for all requested coins.
  const flashloanFeeObjectIds = await queryFlashloanFeeObjectIds(
    ctx,
    new Set(coinPairs.map(([, cfg]) => cfg.coinType)),
    flashLoanFeesTableId
  );

  // 4. Resolve per-coin object ids and assemble.
  const results: Record<string, PoolAddress> = {};
  await Promise.all(
    coinPairs.map(async ([coinName, cfg]) => {
      const { coinType } = cfg;
      const coinTypeKey = coinType.slice(2);

      const [
        lendingPool,
        collateralPool,
        borrowDynamic,
        interestModel,
        riskModel,
        borrowFee,
        supplyLimit,
        borrowLimit,
        isolatedAsset,
      ] = await Promise.all([
        resolveDynamicValueObject(ctx, balanceSheetParentId, ADDRESS_TYPE, {
          name: coinTypeKey,
        }),
        resolveDynamicValueObject(ctx, collateralStatsParentId, ADDRESS_TYPE, {
          name: coinTypeKey,
        }),
        resolveDynamicValueObject(ctx, borrowDynamicsParentId, ADDRESS_TYPE, {
          name: coinTypeKey,
        }),
        resolveDynamicValueObject(ctx, interestModelParentId, ADDRESS_TYPE, {
          name: coinTypeKey,
        }),
        resolveDynamicValueObject(ctx, riskModelParentId, ADDRESS_TYPE, {
          name: coinTypeKey,
        }),
        resolveDynamicValueObject(ctx, market, BORROW_FEE_TYPE, coinTypeKey),
        resolveDynamicValueObject(ctx, market, SUPPLY_LIMIT_TYPE, coinTypeKey),
        resolveDynamicValueObject(ctx, market, BORROW_LIMIT_TYPE, coinTypeKey),
        resolveDynamicValueObject(ctx, market, ISOLATED_ASSET_KEY, coinTypeKey),
      ]);

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
    })
  );

  return results;
};
