import { bcs } from '@mysten/sui/bcs';
import {
  ScallopAddress,
  ScallopSuiKit,
  ScallopUtils,
} from 'src/models/index.js';
import type {
  SupportOracleType,
  xOracleRuleType,
  SuiObjectResponse,
} from 'src/types/index.js';
import { getDfObjectIdAndName, parseObjectAs } from 'src/utils/object.js';

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
  const nameBcs = bcs
    .struct('TypeName', { dummy_field: bcs.bool() })
    .serialize({ dummy_field: false })
    .toBytes();

  const [primaryPriceUpdatePolicyTable, secondaryPriceUpdatePolicyTable] =
    await Promise.all([
      scallopSuiKit.queryGetDynamicFieldObject({
        parentId: address.get('core.oracles.primaryPriceUpdatePolicyObject'),
        name: {
          type: priceUpdatePolicyRulesKeyType,
          // value: { dummy_field: false },
          bcs: nameBcs,
        },
      }),
      scallopSuiKit.queryGetDynamicFieldObject({
        parentId: address.get('core.oracles.secondaryPriceUpdatePolicyObject'),
        name: {
          type: priceUpdatePolicyRulesKeyType,
          bcs: nameBcs,
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
      limit: 50,
    });
    if (!response) break;
    const { dynamicFields, hasNextPage, cursor: nextCursor } = response;
    cursor = nextCursor;

    // Group object ids
    const objectIds = dynamicFields.map(
      (dynamicField: any) => dynamicField.fieldId
    );

    // batch fetch object responses
    const objectResponses =
      await utils.scallopSuiKit.queryGetObjects(objectIds);
    objectResponses.forEach((object) => {
      const jsonData = parseObjectAs<{
        contents: [
          {
            name: string;
          },
        ];
      }>(object);

      const dynamicFieldInfo = getDfObjectIdAndName(object);
      if (dynamicFieldInfo.nameKind !== 'type') {
        console.error('Unsupported dynamic field key kind for oracle mapping', {
          objectId: object.objectId,
          name: dynamicFieldInfo.name,
          nameKind: dynamicFieldInfo.nameKind,
        });
        return;
      }

      const normalizedTypeName = dynamicFieldInfo.name.startsWith('0x')
        ? dynamicFieldInfo.name
        : `0x${dynamicFieldInfo.name}`;
      const assetName = utils.parseCoinNameFromType(normalizedTypeName);
      if (!assetName) throw new Error(`Invalid asset name: ${assetName}`);
      if (!assetOracles[assetName]) {
        assetOracles[assetName] = [];
      }

      (jsonData.contents ?? []).forEach((content: any) => {
        assetOracles[assetName].push(
          ruleTypeNameToOracleType[`0x${content.name}`]
        );
      });
    });
    if (!hasNextPage) break;
  } while (cursor);

  return assetOracles;
};
