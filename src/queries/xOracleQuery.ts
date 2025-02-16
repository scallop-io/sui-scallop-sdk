import { SuiObjectResponse } from '@mysten/sui/client';
import { ScallopAddress, ScallopUtils } from 'src/models';
import {
  SupportAssetCoins,
  SupportOracleType,
  xOracleRuleType,
} from 'src/types';

const PRIMARY_PRICE_UPDATE_POLICY =
  '0xbcd908d0ee6d63d726e61676f3feeec3d19817f4849bbecf372dd3399f247f6b'; // @TODO: move this constant to api address
const SECONDARY_PRICE_UPDDATE_POLICY =
  '0x624a6f120777bb30e718b86e836c205ef4229448052377dc3d78272a6662b2c0'; // @TODO: move this constant to api address

/**
 * Query the price update policy table ids. Usually the value for these table will be constant.
 * @param query
 * @returns
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

// const PRIMARY_PRICE_UPDATE_POLICY_KEY =
//   '0x856d0930acc36780eda9ea47019c979ca6ad34fd36f158b181eb7350195acc00';
// const SECONDARY_PRICE_UPDATE_POLICY_KEY =
//   '0x304d226734fa5e376423c9ff0f1d49aeb1e2572d4b617d31e11e2f69865b73ed';
const PRIMARY_PRICE_UPDATE_POLICY_VECSET_ID =
  '0xfb1330aa028ed6a159b742c71b5a79b3b6824cf71efa40ea82b52486ad209264';
const SECONDARY_PRICE_UPDATE_POLICY_VECSET_ID =
  '0x4b827acc73f3f53f808dd73a7ee0a60ae61e84322176bece72b26467030b467c';

export const getAssetOracles = async (
  utils: ScallopUtils,
  ruleType: xOracleRuleType
): Promise<Record<SupportAssetCoins, SupportOracleType[]>> => {
  const ruleTypeNameToOracleType: Record<string, SupportOracleType> = {
    [`${utils.address.get('core.packages.pyth.object')}::rule::Rule`]: 'pyth',
    [`${utils.address.get('core.packages.supra.object')}::rule::Rule`]: 'supra',
    [`${utils.address.get('core.packages.switchboard.object')}::rule::Rule`]:
      'switchboard',
  };

  const assetPrimaryOracles = {} as Record<
    SupportAssetCoins,
    SupportOracleType[]
  >;
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
