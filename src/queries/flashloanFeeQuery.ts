import type { SuiObjectData } from 'src/types/index.js';
import { ScallopSuiKit } from 'src/models/index.js';
import ScallopConstants from 'src/models/scallopConstants.js';

const FLASHLOAN_FEES_TABLE_ID =
  '0x00481a93b819d744a7d79ecdc6c62c74f2f7cb4779316c4df640415817ac61bb' as const;

export const queryFlashLoanFees = async (
  {
    constants,
    scallopSuiKit,
  }: {
    constants: ScallopConstants;
    scallopSuiKit: ScallopSuiKit;
  },
  assetNames: string[],
  feeRate: number
) => {
  const assetNamesSet = new Set(assetNames);
  const assetTypeMap = Object.fromEntries(
    Object.entries(constants.coinTypeToCoinNameMap).filter(([_, value]) =>
      assetNamesSet.has(value!)
    )
  );

  let cursor: string | null | undefined = null;
  let nextPage: boolean = false;
  const flashloanFeeObjects: SuiObjectData[] = [];
  do {
    const resp = await scallopSuiKit.queryGetDynamicFields({
      parentId: FLASHLOAN_FEES_TABLE_ID,
      limit: 10,
      cursor,
    });

    if (!resp) break;

    // get the dynamic object ids
    const dynamicFieldObjectIds = resp.dynamicFields
      .filter((field) => {
        const assetType = `0x${(field.name as any).value?.name as string}`;
        return !!assetTypeMap[assetType];
      })
      .map((field) => field.fieldId);

    flashloanFeeObjects.push(
      ...(await scallopSuiKit.queryGetObjects(dynamicFieldObjectIds))
    );
    nextPage = resp.hasNextPage;
    cursor = resp.cursor;
  } while (nextPage);

  return flashloanFeeObjects.reduce(
    (prev, curr) => {
      const jsonData = curr.json as any;
      if (jsonData) {
        const assetType = `0x${jsonData.name?.name}`;
        const assetName = assetTypeMap[assetType];
        if (!assetName) return prev;

        const objectFields = jsonData;
        const feeNumerator = +objectFields.value;
        prev[assetName] = feeNumerator / feeRate;
      }
      return prev;
    },
    {} as Record<string, number>
  );
};

export const parseFlashloanFeeObjects = (
  constants: ScallopConstants,
  objects: SuiObjectData[],
  feeRate: number
) => {
  const assetTypeMap = constants.coinTypeToCoinNameMap;
  return objects.reduce(
    (prev, curr) => {
      const jsonData = curr.json as any;
      if (jsonData) {
        const assetType = `0x${jsonData.name?.name}`;
        const assetName = assetTypeMap[assetType];
        if (!assetName) return prev;

        const objectFields = jsonData;
        const feeNumerator = +objectFields.value;
        prev[assetName] = feeNumerator / feeRate;
      }
      return prev;
    },
    {} as Record<string, number>
  );
};
