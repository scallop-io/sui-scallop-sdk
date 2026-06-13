import { SuiClientTypes } from '@mysten/sui/client';
import { XOracleRepoContext, SupportedOracle } from './types.js';
import { queryKeys } from 'src/constants/queryKeys.js';
import { bcs } from '@mysten/sui/bcs';
import { prepend0x } from './util.js';
import { PricePolicyRulesVecSet } from './bcs.js';

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
