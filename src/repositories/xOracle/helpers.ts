import { SuiClientTypes } from '@mysten/sui/client';
import {
  SupportedOracle,
  XOracleAssetOraclesContext,
  XOracleOnDemandAggContext,
  XOraclePriceUpdatePolicyContext,
  XOracleSwitchboardRegistryContext,
  XOracleUpdatePolicyRulesContext,
} from './types.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import { bcs } from '@mysten/sui/bcs';
import { prepend0x } from './utils.js';
import { PricePolicyRulesVecSet } from './bcs.js';
import {
  getDynamicFieldOrNull,
  getDynamicFieldValueBcsOrNull,
  logError,
  type DynamicFieldsWithValuePage,
} from '../utils.js';
import { encodeDynamicFieldNameForV2 } from 'src/utils/dynamicField.js';
import { ScallopParseError, ScallopRpcError } from 'src/errors/index.js';

const SWITCHBOARD_REGISTRY_SCAN_THRESHOLD = 3;

const queryUpdatePolicyRules = async (
  ctx: XOracleUpdatePolicyRulesContext,
  vecSetId: string
): Promise<Record<string, SupportedOracle[]>> => {
  const { grpc, fetchWithCache, metadata } = ctx;
  const { addresses, parseCoinNameFromType } = metadata;
  const limit = 50;

  const ruleTypeNameToOracleType: Record<string, SupportedOracle> = {
    [`${addresses.pyth.object}::rule::Rule`]: 'pyth',
    [`${addresses.supra.object}::rule::Rule`]: 'supra',
    [`${addresses.switchboard.object}::rule::Rule`]: 'switchboard',
  };

  let nextCursor = null;
  let nextPage = true;

  const results: Record<string, SupportedOracle[]> = {};

  do {
    const fetchOptions: SuiClientTypes.ListDynamicFieldsOptions = {
      parentId: vecSetId,
      cursor: nextCursor,
      limit,
      //@ts-ignore - Supported on grpc implementation
      include: {
        value: true,
      },
    };
    const { dynamicFields, cursor, hasNextPage } = await fetchWithCache({
      queryKey: queryKeys.rpc.getDynamicFields({
        ...fetchOptions,
        node: grpc.url,
      }),
      queryFn: () => grpc.client.listDynamicFields(fetchOptions),
    });

    nextCursor = cursor;
    nextPage = hasNextPage;

    // Process the dynamic fields
    dynamicFields.forEach((field) => {
      // Get coin type
      const coinType = prepend0x(bcs.string().parse(field.name.bcs));
      const coinName = parseCoinNameFromType(coinType);
      // @ts-ignore - value is supported on grpc implementation
      const parsedValue = PricePolicyRulesVecSet.parse(field.value.bcs);

      if (!results[coinName]) {
        results[coinName] = [];
      }

      // Iterate through parsedValue
      parsedValue.contents.forEach(({ name }) => {
        const oracle = ruleTypeNameToOracleType[prepend0x(name)];
        if (oracle) {
          results[coinName].push(oracle);
        }
      });
    });
  } while (nextPage);

  return results;
};

export const getAssetOraclesFromOnChain = async (
  ctx: XOracleAssetOraclesContext
) => {
  const {
    metadata: { addresses, whitelist },
  } = ctx;
  const [primary, secondary] = await Promise.all([
    queryUpdatePolicyRules(
      ctx,
      addresses.oracles.primaryPriceUpdatePolicyVecsetId
    ),
    queryUpdatePolicyRules(
      ctx,
      addresses.oracles.secondaryPriceUpdatePolicyVecsetId
    ),
  ]);

  return [...whitelist.lending.values()].reduce(
    (acc, assetName) => {
      acc[assetName] = {
        primary: primary[assetName] ?? [],
        secondary: secondary[assetName] ?? [],
      };
      return acc;
    },
    {} as Record<
      string,
      { primary: SupportedOracle[]; secondary: SupportedOracle[] }
    >
  );
};

/**
 * Primary/secondary price-update-policy dynamic fields. Returns the gRPC
 * client's dynamic-field result (or `null` when the policy rules key isn't
 * present).
 */
export const getPriceUpdatePoliciesFromOnChain = async (
  ctx: XOraclePriceUpdatePolicyContext
) => {
  const { addresses } = ctx.metadata;
  const keyType = `${addresses.xOracleObject}::price_update_policy::PriceUpdatePolicyRulesKey`;
  const nameBcs = bcs
    .struct('TypeName', { dummy_field: bcs.bool() })
    .serialize({ dummy_field: false })
    .toBytes();

  const [primary, secondary] = await Promise.all([
    getDynamicFieldOrNull(ctx, {
      parentId: addresses.oracles.primaryPriceUpdatePolicyObject,
      name: { type: keyType, bcs: nameBcs },
    }),
    getDynamicFieldOrNull(ctx, {
      parentId: addresses.oracles.secondaryPriceUpdatePolicyObject,
      name: { type: keyType, bcs: nameBcs },
    }),
  ]);

  return { primary, secondary };
};

/**
 * Switchboard on-demand aggregator object ids for the given coins, aligned to
 * the input order. Uses the address-API registration when present, else looks
 * the coin up in the on-chain switchboard registry table.
 */
export const getOnDemandAggObjectIdsFromOnChain = async (
  ctx: XOracleOnDemandAggContext,
  coinNames: string[]
): Promise<string[]> => {
  const { addresses, parseCoinType, getSwitchboardAggAddress } = ctx.metadata;
  const registryTableId = addresses.oracles.switchboardRegistryTableId;

  const missingAgg: Array<{ idx: number; coinName: string }> = [];
  const registeredAggs: Array<string | null> = coinNames.map(
    (coinName, idx) => {
      const registered = getSwitchboardAggAddress(coinName);
      if (registered) return registered;
      missingAgg.push({ idx, coinName });
      return null;
    }
  );

  if (missingAgg.length === 0) return registeredAggs as string[];

  if (missingAgg.length > SWITCHBOARD_REGISTRY_SCAN_THRESHOLD) {
    const missingCoinTypes = new Map<
      string,
      { idx: number; coinName: string }
    >();
    for (const missing of missingAgg) {
      const coinType = parseCoinType(missing.coinName);
      if (!coinType) {
        throw logError(
          ctx.logger,
          new ScallopParseError(`Invalid coin name: ${missing.coinName}`, {
            context: { coinName: missing.coinName },
          })
        );
      }
      missingCoinTypes.set(coinType.slice(2), missing);
    }

    const scannedAggs = await querySwitchboardRegistryAggs(
      ctx,
      registryTableId,
      missingCoinTypes
    );
    for (const [coinTypeKey, { idx }] of missingCoinTypes) {
      const agg = scannedAggs[coinTypeKey];
      if (!agg) {
        throw logError(
          ctx.logger,
          new ScallopRpcError(
            `No on-demand aggregator found for 0x${coinTypeKey}`,
            { context: { coinTypeKey } }
          )
        );
      }
      registeredAggs[idx] = agg;
    }

    return registeredAggs as string[];
  }

  await Promise.all(
    missingAgg.map(async ({ idx, coinName }) => {
      const coinType = parseCoinType(coinName);
      if (!coinType) {
        throw logError(
          ctx.logger,
          new ScallopParseError(`Invalid coin name: ${coinName}`, {
            context: { coinName },
          })
        );
      }
      const valueBcs = await getDynamicFieldValueBcsOrNull(ctx, {
        parentId: registryTableId,
        name: encodeDynamicFieldNameForV2({
          type: '0x1::type_name::TypeName',
          value: { name: coinType.slice(2) },
        }),
      });
      if (!valueBcs) {
        throw logError(
          ctx.logger,
          new ScallopRpcError(`No on-demand aggregator found for ${coinType}`, {
            context: { coinType },
          })
        );
      }
      // The registry value is the aggregator object id (an address).
      // UNVERIFIED: confirm the bcs shape against a live registry entry.
      registeredAggs[idx] = bcs.Address.parse(valueBcs);
    })
  );

  return registeredAggs as string[];
};

const parseRegistryCoinTypeKey = (
  field: SuiClientTypes.DynamicFieldEntry
): string | undefined => {
  try {
    return bcs.struct('TypeName', { name: bcs.string() }).parse(field.name.bcs)
      .name;
  } catch {
    try {
      return bcs.string().parse(field.name.bcs);
    } catch {
      return undefined;
    }
  }
};

const querySwitchboardRegistryAggs = async (
  ctx: XOracleSwitchboardRegistryContext,
  registryTableId: string,
  missingCoinTypes: ReadonlyMap<string, { idx: number; coinName: string }>
): Promise<Record<string, string>> => {
  const { grpc, fetchWithCache } = ctx;
  const result: Record<string, string> = {};
  let cursor: string | null | undefined = null;
  let hasNextPage = false;

  do {
    const options: SuiClientTypes.ListDynamicFieldsOptions & {
      include: { value: true };
    } = {
      parentId: registryTableId,
      cursor,
      limit: 50,
      include: { value: true },
    };
    const resp: DynamicFieldsWithValuePage = await fetchWithCache({
      queryKey: queryKeys.rpc.getDynamicFields({
        ...options,
        node: grpc.url,
      }),
      queryFn: () => grpc.client.listDynamicFields<{ value: true }>(options),
    });

    for (const field of resp.dynamicFields) {
      const coinTypeKey = parseRegistryCoinTypeKey(field);
      if (!coinTypeKey || !missingCoinTypes.has(coinTypeKey)) continue;
      const valueBcs = field.value?.bcs;
      if (valueBcs) {
        result[coinTypeKey] = bcs.Address.parse(valueBcs);
      }
    }

    cursor = resp.cursor;
    hasNextPage =
      resp.hasNextPage && Object.keys(result).length < missingCoinTypes.size;
  } while (hasNextPage);

  return result;
};
