import { SuiObjectResponse } from '@mysten/sui/client';
import { ScallopAddress, ScallopUtils } from 'src/models';
import { xOracleRuleType } from 'src/types';

const PRIMARY_PRICE_UPDATE_POLICY =
  '0x56e48a141f20a3a6a6d3fc43e58b01fc63f756c08224870e7890c80ec9d2afee';
const SECONDARY_PRICE_UPDDATE_POLICY =
  '0xef4d9430ae42c1b24199ac55e87ddd7262622447ee3c7de8868efe839b3d8705';

/**
 * Query the price update policy table ids. Usually the value for these table will be constant.
 * @param query
 * @returns Primary and Secondary price update policy table object
 */
export const getPriceUpdatePolicies = async (
  address: ScallopAddress
): Promise<{
  primary: SuiObjectResponse | null;
  secondary: SuiObjectResponse | null;
}> => {
  const priceUpdatePolicyRulesKeyType = `${address.get('core.packages.xOracle.object')}::price_update_policy::PriceUpdatePolicyRulesKey`;
  const [primaryPriceUpdatePolicyTable, secondaryPriceUpdatePolicyTable] =
    await Promise.all([
      address.cache.queryGetDynamicFieldObject({
        parentId: PRIMARY_PRICE_UPDATE_POLICY,
        name: {
          type: priceUpdatePolicyRulesKeyType,
          value: { dummy_field: false },
        },
      }),
      address.cache.queryGetDynamicFieldObject({
        parentId: SECONDARY_PRICE_UPDDATE_POLICY,
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

const PRIMARY_PRICE_UPDATE_POLICY_VECSET_ID =
  '0xc22c9d691ee4c780de09db91d8b487d863211ebf08720772144bcf716318826c';
const SECONDARY_PRICE_UPDATE_POLICY_VECSET_ID =
  '0x3b184ff859f5de30eeaf186898e5224925be6bb6d2baa74347ef471a8cd1c0d3';

export const getAssetOracles = async (
  utils: ScallopUtils,
  ruleType: xOracleRuleType
): Promise<Record<string, string[]> | null> => {
  if (ruleType === 'primary' && !PRIMARY_PRICE_UPDATE_POLICY_VECSET_ID) {
    console.error('Primary price update policy vecset id is not set');
    return null;
  }
  if (ruleType === 'secondary' && !SECONDARY_PRICE_UPDATE_POLICY_VECSET_ID) {
    console.error('Secondary price update policy vecset id is not set');
    return null;
  }

  const ruleTypeNameToOracleType: Record<string, string> = {
    [`${utils.address.get('core.packages.pyth.object')}::rule::Rule`]: 'pyth',
    [`${utils.address.get('core.packages.supra.object')}::rule::Rule`]: 'supra',
    [`${utils.address.get('core.packages.switchboard.object')}::rule::Rule`]:
      'switchboard',
  };

  const assetPrimaryOracles = {} as Record<string, string[]>;
  let cursor = null;
  do {
    const response = await utils.cache.queryGetDynamicFields({
      parentId:
        ruleType === 'primary'
          ? PRIMARY_PRICE_UPDATE_POLICY_VECSET_ID
          : SECONDARY_PRICE_UPDATE_POLICY_VECSET_ID,
      cursor,
      limit: 10,
    });
    if (!response) break;
    const { data, hasNextPage, nextCursor } = response;
    cursor = nextCursor;

    // Group object ids
    const objectIds = data.map((dynamicField) => dynamicField.objectId);

    // batch fetch object responses
    const objectResponses = await utils.cache.queryGetObjects(objectIds);
    objectResponses.forEach((object) => {
      if (!object.content || object.content.dataType !== 'moveObject') return;
      const fields = object.content.fields as any;
      const typeName = (
        fields.name as { type: string; fields: { name: string } }
      ).fields.name;

      const assetName = utils.parseCoinNameFromType(`0x${typeName}`);
      if (!assetName) throw new Error(`Invalid asset name: ${assetName}`);
      if (!assetPrimaryOracles[assetName]) {
        assetPrimaryOracles[assetName] = [];
      }

      const value = fields.value as {
        type: string;
        fields: {
          contents: Array<{ type: string; fields: { name: string } }>;
        };
      };

      value.fields.contents.forEach((content) => {
        assetPrimaryOracles[assetName].push(
          ruleTypeNameToOracleType[`0x${content.fields.name}`]
        );
      });
    });
    if (!hasNextPage) break;
  } while (cursor);

  return assetPrimaryOracles;
};
