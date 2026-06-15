import { SuiClientTypes } from '@mysten/sui/client';
import { XOracleRepoContext, SupportedOracle } from './types.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import { bcs } from '@mysten/sui/bcs';
import { prepend0x } from './util.js';
import { PricePolicyRulesVecSet } from './bcs.js';
import { getDynamicFieldOrNull, logError } from '../utils.js';
import { encodeDynamicFieldNameForV2 } from 'src/utils/dynamicField.js';

const queryUpdatePolicyRules = async (
  ctx: XOracleRepoContext,
  vecSetId: string
): Promise<Record<string, SupportedOracle[]>> => {
  const { onchain, fetchWithCache, metadata } = ctx;
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
        node: onchain.url,
      }),
      queryFn: () => onchain.client.listDynamicFields(fetchOptions),
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

export const getAssetOraclesFromOnChain = async (ctx: XOracleRepoContext) => {
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
 * Primary/secondary price-update-policy dynamic fields.
 *
 * NOTE: the return shape changed from the legacy `getPriceUpdatePolicies`
 * (which leaked `SuiObjectResponse`). This returns the new-gen client's
 * dynamic-field result (or `null` when the policy rules key isn't present).
 */
export const getPriceUpdatePoliciesFromOnChain = async (
  ctx: XOracleRepoContext
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
  ctx: XOracleRepoContext,
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

  await Promise.all(
    missingAgg.map(async ({ idx, coinName }) => {
      const coinType = parseCoinType(coinName);
      if (!coinType) {
        throw logError(ctx.logger, `Invalid coin name: ${coinName}`);
      }
      const result = await getDynamicFieldOrNull(ctx, {
        parentId: registryTableId,
        name: encodeDynamicFieldNameForV2({
          type: '0x1::type_name::TypeName',
          value: { name: coinType.slice(2) },
        }),
      });
      if (!result) {
        throw logError(
          ctx.logger,
          `No on-demand aggregator found for ${coinType}`
        );
      }
      // The registry value is the aggregator object id (an address).
      // UNVERIFIED: confirm the bcs shape against a live registry entry.
      registeredAggs[idx] = bcs.Address.parse(result.dynamicField.value.bcs);
    })
  );

  return registeredAggs as string[];
};
