import { SuiObjectResponse } from '@mysten/sui/client';
import { ScallopAddress, ScallopSuiKit, ScallopUtils } from 'src/models';
import { SupportOracleType, xOracleRuleType } from 'src/types';

/**
 * Query the price update policy table ids. Usually the value for these table will be constant.
 * @param query
 * @returns Primary and Secondary price update policy table object
 */
export const getPriceUpdatePolicies = async ({
  address,
  scallopSuiKit,
}: {
  address: ScallopAddress;
  scallopSuiKit: ScallopSuiKit;
}): Promise<{
  primary: SuiObjectResponse | null;
  secondary: SuiObjectResponse | null;
}> => {
  const priceUpdatePolicyRulesKeyType = `${address.get('core.packages.xOracle.object')}::price_update_policy::PriceUpdatePolicyRulesKey`;
  const [primaryPriceUpdatePolicyTable, secondaryPriceUpdatePolicyTable] =
    await Promise.all([
      scallopSuiKit.queryGetDynamicFieldObject({
        parentId: address.get('core.oracles.primaryPriceUpdatePolicyObject'),
        name: {
          type: priceUpdatePolicyRulesKeyType,
          value: { dummy_field: false },
        },
      }),
      scallopSuiKit.queryGetDynamicFieldObject({
        parentId: address.get('core.oracles.secondaryPriceUpdatePolicyObject'),
        name: {
          type: priceUpdatePolicyRulesKeyType,
          value: { dummy_field: false },
        },
      }),
    ]);

  return {
    primary: primaryPriceUpdatePolicyTable,
    secondary: secondaryPriceUpdatePolicyTable,
  };
};

export const getAssetOracles = async (
  utils: ScallopUtils,
  ruleType: xOracleRuleType
): Promise<Record<string, string[]> | null> => {
  if (
    ruleType === 'primary' &&
    !utils.address.get('core.oracles.primaryPriceUpdatePolicyVecsetId')
  ) {
    console.error('Primary price update policy vecset id is not set');
    return null;
  }
  if (
    ruleType === 'secondary' &&
    !utils.address.get('core.oracles.secondaryPriceUpdatePolicyVecsetId')
  ) {
    console.error('Secondary price update policy vecset id is not set');
    return null;
  }

  const ruleTypeNameToOracleType: Record<string, SupportOracleType> = {
    [`${utils.address.get('core.packages.pyth.object')}::rule::Rule`]: 'pyth',
    [`${utils.address.get('core.packages.supra.object')}::rule::Rule`]: 'supra',
    [`${utils.address.get('core.packages.switchboard.object')}::rule::Rule`]:
      'switchboard',
  };

  const assetOracles = {} as Record<string, SupportOracleType[]>;
  let cursor = null;
  do {
    const response = await utils.scallopSuiKit.queryGetDynamicFields({
      parentId:
        ruleType === 'primary'
          ? utils.address.get('core.oracles.primaryPriceUpdatePolicyVecsetId')
          : utils.address.get(
              'core.oracles.secondaryPriceUpdatePolicyVecsetId'
            ),
      cursor,
      limit: 10,
    });
    if (!response) break;
    const { data, hasNextPage, nextCursor } = response;
    cursor = nextCursor;

    // Group object ids
    const objectIds = data.map((dynamicField) => dynamicField.objectId);

    // batch fetch object responses
    const objectResponses =
      await utils.scallopSuiKit.queryGetObjects(objectIds);
    objectResponses.forEach((object) => {
      if (!object.content || object.content.dataType !== 'moveObject') return;
      const fields = object.content.fields as any;
      const typeName = (
        fields.name as { type: string; fields: { name: string } }
      ).fields.name;

      const assetName = utils.parseCoinNameFromType(`0x${typeName}`);
      if (!assetName) throw new Error(`Invalid asset name: ${assetName}`);
      if (!assetOracles[assetName]) {
        assetOracles[assetName] = [];
      }

      const value = fields.value as {
        type: string;
        fields: {
          contents: Array<{ type: string; fields: { name: string } }>;
        };
      };

      value.fields.contents.forEach((content) => {
        assetOracles[assetName].push(
          ruleTypeNameToOracleType[`0x${content.fields.name}`]
        );
      });
    });
    if (!hasNextPage) break;
  } while (cursor);

  return assetOracles;
};
