import { BigNumber } from 'src/utils/index.js';
import type {
  VeScaTreasuryFields,
  VeScaTreasuryInfo,
  Vesca,
  SuiObjectData,
  DevInspectResults,
} from 'src/types/index.js';
import type { ScallopUtils } from 'src/models/index.js';
import { MAX_LOCK_DURATION } from 'src/constants/index.js';
import { SUI_CLOCK_OBJECT_ID, SuiTxBlock } from '@scallop-io/sui-kit';
import { bcs } from '@mysten/sui/bcs';
import { z as zod } from 'zod';
import { queryKeys } from 'src/constants/index.js';
import { getSharedObjectData } from 'src/utils/index.js';
/**
 * Query all owned veSca key.
 *
 * @param query - The Scallop query instance.
 * @param ownerAddress - The owner address.
 * @return Owned veSca key.
 */
export const getVescaKeys = async (
  utils: ScallopUtils,
  ownerAddress?: string
) => {
  const owner = ownerAddress || utils.suiKit.currentAddress;
  const veScaObjId = utils.address.get('vesca.object');
  const veScaKeyType = `${veScaObjId}::ve_sca::VeScaKey`;
  const keyObjectsResponse: SuiObjectData[] = [];
  let hasNextPage = false;
  let nextCursor: string | null | undefined = null;
  do {
    const paginatedKeyObjectsResponse =
      await utils.scallopSuiKit.queryGetOwnedObjects({
        owner,
        filter: {
          StructType: veScaKeyType,
        },
        cursor: nextCursor,
        limit: 10,
      });
    if (!paginatedKeyObjectsResponse) break;

    const objects = paginatedKeyObjectsResponse.objects;

    if (objects) keyObjectsResponse.push(...objects);

    if (
      paginatedKeyObjectsResponse.hasNextPage &&
      paginatedKeyObjectsResponse.cursor
    ) {
      hasNextPage = true;
      nextCursor = paginatedKeyObjectsResponse.cursor;
    } else {
      hasNextPage = false;
    }
  } while (hasNextPage);

  const keyObjectDatas = keyObjectsResponse.filter((data) => !!data);
  return keyObjectDatas;
};

/**
 * Query all owned veSca.
 *
 * @param query - The Scallop query instance.
 * @param ownerAddress - The owner address.
 * @return Owned veScas.
 */
export const getVeScas = async (
  {
    utils,
  }: {
    utils: ScallopUtils;
  },
  ownerAddress: string,
  excludeEmpty?: boolean
) => {
  const keyObjectDatas = await getVescaKeys(utils, ownerAddress);

  const veScas: Vesca[] = Array(keyObjectDatas.length).fill(null);
  const tasks = keyObjectDatas.map(async (veScaKey, idx) => {
    const veSca = await getVeSca(utils, veScaKey);
    if (veSca) {
      veScas[idx] = veSca;
    }
  });
  await Promise.allSettled(tasks);

  const result = veScas
    .filter(Boolean)
    .sort((a, b) => b.currentVeScaBalance - a.currentVeScaBalance);

  if (excludeEmpty) {
    return result.filter((v) => v.lockedScaAmount !== '0');
  }
  return result;
};

const SuiObjectRefZod = zod.object({
  objectId: zod.string(),
  digest: zod.string(),
  version: zod.string(),
});

/**
 * Get veSca data.
 *
 * @param query - The Scallop query instance.
 * @param veScaKey - The vesca key id.
 * @param ownerAddress - The owner address.
 * @returns Vesca data.
 */
export const getVeSca = async (
  utils: ScallopUtils,
  veScaKey: string | SuiObjectData
) => {
  const tableId = utils.address.get(`vesca.tableId`);

  if (!veScaKey) return undefined;

  let vesca: Vesca | undefined = undefined;

  const veScaDynamicFieldObjectResponse =
    await utils.scallopSuiKit.queryGetDynamicFieldObject({
      parentId: tableId,
      name: {
        type: '0x2::object::ID',
        value: typeof veScaKey === 'string' ? veScaKey : veScaKey.objectId,
      },
    });
  if (!veScaDynamicFieldObjectResponse) return undefined;

  const veScaDynamicFieldObject = veScaDynamicFieldObjectResponse.object;
  const jsonData = veScaDynamicFieldObject?.json as any;
  if (
    veScaDynamicFieldObject &&
    jsonData &&
    jsonData.dataType === 'moveObject' &&
    'fields' in jsonData
  ) {
    const dynamicFields = jsonData.fields.value.fields;

    const remainingLockPeriodInMilliseconds = Math.max(
      +dynamicFields.unlock_at * 1000 - Date.now(),
      0
    );
    const lockedScaAmount = String(dynamicFields.locked_sca_amount);
    const lockedScaCoin = BigNumber(dynamicFields.locked_sca_amount)
      .shiftedBy(-9)
      .toNumber();
    const currentVeScaBalance =
      lockedScaCoin *
      (Math.floor(remainingLockPeriodInMilliseconds / 1000) /
        MAX_LOCK_DURATION);

    vesca = {
      id: veScaDynamicFieldObject.objectId,
      keyId: typeof veScaKey === 'string' ? veScaKey : veScaKey.objectId,
      keyObject: typeof veScaKey === 'string' ? undefined : veScaKey,
      object: SuiObjectRefZod.parse(veScaDynamicFieldObject),
      lockedScaAmount,
      lockedScaCoin,
      currentVeScaBalance,
      unlockAt: BigNumber(dynamicFields.unlock_at * 1000).toNumber(),
    };
  }

  return vesca;
};

/**
 * Get current total veSca treasury amount.
 */
const getTotalVeScaTreasuryAmount = async (
  utils: ScallopUtils,
  veScaTreasury: SuiObjectData
): Promise<string> => {
  const veScaPkgId = utils.address.get('vesca.id');
  const veScaConfig = utils.address.get('vesca.config');
  veScaTreasury = veScaTreasury ?? utils.address.get('vesca.treasury');

  const txb = new SuiTxBlock();
  const clockObjectRef = txb.sharedObjectRef({
    objectId: SUI_CLOCK_OBJECT_ID,
    mutable: false,
    initialSharedVersion: '1',
  });

  const [treasuryVersion, veScaConfigVersion] = await Promise.all([
    getSharedObjectData(
      typeof veScaTreasury === 'string'
        ? veScaTreasury
        : veScaTreasury.objectId,
      utils.scallopSuiKit
    ),
    getSharedObjectData(veScaConfig, utils.scallopSuiKit),
  ]);

  const treasuryRef = txb.sharedObjectRef({
    ...treasuryVersion,
    mutable: true,
  });

  // refresh query
  const refreshQueryTarget = `${veScaPkgId}::treasury::refresh`;
  const refreshArgs = [
    txb.sharedObjectRef({
      ...veScaConfigVersion,
      mutable: false,
    }),
    treasuryRef,
    clockObjectRef,
  ];

  // query total veSca amount
  const veScaAmountQueryTarget = `${veScaPkgId}::treasury::total_ve_sca_amount`;
  const vescaAmountArgs = [treasuryRef, clockObjectRef];

  // resolve each args
  const resolvedRefreshArgs = await Promise.all(
    refreshArgs.map(async (arg) => {
      if (typeof arg === 'string') {
        return (await utils.scallopSuiKit.queryGetObject(arg))?.object as any;
      }
      return arg;
    })
  );

  const resolvedVeScaAmountArgs = await Promise.all(
    vescaAmountArgs.map(async (arg) => {
      if (typeof arg === 'string') {
        return (await utils.scallopSuiKit.queryGetObject(arg))?.object as any;
      }
      return arg;
    })
  );

  // refresh first
  txb.moveCall(refreshQueryTarget, resolvedRefreshArgs);
  txb.moveCall(veScaAmountQueryTarget, resolvedVeScaAmountArgs);

  const txBytes = await txb.txBlock.build({
    client: utils.suiKit.client,
    onlyTransactionKind: true,
  });

  // return result
  const res =
    await utils.scallopSuiKit.queryClient.fetchQuery<DevInspectResults>({
      queryKey: queryKeys.rpc.getTotalVeScaTreasuryAmount({
        refreshArgs,
        vescaAmountArgs,
        node: utils.scallopSuiKit.currentFullNode,
      }),
      queryFn: async () => {
        return await utils.suiKit.inspectTxn(txBytes);
      },
    });

  if (res.$kind !== 'Transaction') {
    return '0';
  }

  const results = res.commandResults;
  if (results && results[1]?.returnValues && results[1].returnValues[0]) {
    const value = results[1].returnValues[0].bcs;
    return bcs.u64().parse(value);
  }

  return '0';
};

/**
 * Get veSCA treasury informations
 * @param query
 * @returns VeScaTreasuryInfo
 */
export const getVeScaTreasuryInfo = async (
  utils: ScallopUtils
): Promise<VeScaTreasuryInfo | null> => {
  const veScaTreasuryId = utils.address.get('vesca.treasury');
  const veScaTreasury =
    await utils.scallopSuiKit.queryGetObject(veScaTreasuryId);

  const veScaTreasuryObject = veScaTreasury?.object;
  const jsonData = veScaTreasuryObject?.json as any;

  if (!veScaTreasuryObject || jsonData?.dataType !== 'moveObject') return null;

  const treasuryFields = jsonData.fields as VeScaTreasuryFields;

  const totalLockedSca = BigNumber(
    treasuryFields.unlock_schedule.fields.locked_sca_amount
  )
    .shiftedBy(-9)
    .toNumber();
  const totalVeSca = BigNumber(
    (await getTotalVeScaTreasuryAmount(utils, veScaTreasuryObject)) ?? 0
  )
    .shiftedBy(-9)
    .toNumber();
  const averageLockingPeriod =
    totalLockedSca > 0 ? (totalVeSca / totalLockedSca) * 4 : 0; // in years

  const averageLockingPeriodUnit = 'year';
  return {
    totalLockedSca,
    totalVeSca,
    averageLockingPeriod,
    averageLockingPeriodUnit,
  };
};
