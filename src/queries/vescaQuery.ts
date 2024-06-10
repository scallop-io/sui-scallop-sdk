import BigNumber from 'bignumber.js';
import { VeScaTreasuryFields, VeScaTreasuryInfo, Vesca } from '../types';
import {
  type SuiObjectResponse,
  type SuiObjectData,
  DevInspectResults,
} from '@mysten/sui.js/client';
import type { ScallopQuery } from '../models';
import { MAX_LOCK_DURATION } from 'src/constants';
import { SUI_CLOCK_OBJECT_ID, SuiTxBlock } from '@scallop-io/sui-kit';
import { bcs } from '@mysten/sui.js/bcs';
import { z as zod } from 'zod';
/**
 * Query all owned veSca key.
 *
 * @param query - The Scallop query instance.
 * @param ownerAddress - The owner address.
 * @return Owned veSca key.
 */
export const getVescaKeys = async (
  query: ScallopQuery,
  ownerAddress?: string
) => {
  const owner = ownerAddress || query.suiKit.currentAddress();
  const veScaObjId = query.address.get('vesca.object');
  const veScaKeyType = `${veScaObjId}::ve_sca::VeScaKey`;
  const keyObjectsResponse: SuiObjectResponse[] = [];
  let hasNextPage = false;
  let nextCursor: string | null | undefined = null;
  do {
    const paginatedKeyObjectsResponse = await query.suiKit
      .client()
      .getOwnedObjects({
        owner,
        filter: {
          StructType: veScaKeyType,
        },
        cursor: nextCursor,
      });
    keyObjectsResponse.push(...paginatedKeyObjectsResponse.data);
    if (
      paginatedKeyObjectsResponse.hasNextPage &&
      paginatedKeyObjectsResponse.nextCursor
    ) {
      hasNextPage = true;
      nextCursor = paginatedKeyObjectsResponse.nextCursor;
    } else {
      hasNextPage = false;
    }
  } while (hasNextPage);

  const keyObjectDatas = keyObjectsResponse
    .map((objResponse) => objResponse.data)
    .filter((data) => !!data) as SuiObjectData[];
  return keyObjectDatas;
};

/**
 * Query all owned veSca.
 *
 * @param query - The Scallop query instance.
 * @param ownerAddress - The owner address.
 * @return Owned veScas.
 */
export const getVeScas = async (query: ScallopQuery, ownerAddress?: string) => {
  const keyObjectDatas = await getVescaKeys(query, ownerAddress);

  const veScas: Vesca[] = Array(keyObjectDatas.length).fill(null);
  const tasks = keyObjectDatas.map(async (veScaKey, idx) => {
    const veSca = await getVeSca(query, veScaKey);
    if (veSca) {
      veScas[idx] = veSca;
    }
  });
  await Promise.allSettled(tasks);

  return veScas
    .filter(Boolean)
    .sort((a, b) => b!.currentVeScaBalance - a!.currentVeScaBalance);
};

const SuiObjectRefZod = zod.object({
  objectId: zod.string(),
  digest: zod.string(),
  version: zod.string(),
});

type SuiObjectRefType = zod.infer<typeof SuiObjectRefZod>;
/**
 * Get veSca data.
 *
 * @param query - The Scallop query instance.
 * @param veScaKey - The vesca key id.
 * @param ownerAddress - The owner address.
 * @returns Vesca data.
 */
export const getVeSca = async (
  query: ScallopQuery,
  veScaKey?: string | SuiObjectData,
  ownerAddress?: string
) => {
  const tableId = query.address.get(`vesca.tableId`);
  veScaKey = veScaKey || (await getVescaKeys(query, ownerAddress))[0];

  if (!veScaKey) return undefined;
  if (typeof veScaKey === 'object') {
    veScaKey = SuiObjectRefZod.parse(veScaKey) as SuiObjectRefType;
  }

  let vesca: Vesca | undefined = undefined;

  const veScaDynamicFieldObjectResponse =
    await query.cache.queryGetDynamicFieldObject({
      parentId: tableId,
      name: {
        type: '0x2::object::ID',
        value: typeof veScaKey === 'string' ? veScaKey : veScaKey.objectId,
      },
    });
  const veScaDynamicFieldObject = veScaDynamicFieldObjectResponse.data;
  if (
    veScaDynamicFieldObject &&
    veScaDynamicFieldObject.content &&
    veScaDynamicFieldObject.content.dataType === 'moveObject' &&
    'fields' in veScaDynamicFieldObject.content
  ) {
    const dynamicFields = (veScaDynamicFieldObject.content.fields as any).value
      .fields;

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
      object: SuiObjectRefZod.parse(veScaDynamicFieldObjectResponse.data),
      lockedScaAmount,
      lockedScaCoin,
      currentVeScaBalance,
      unlockAt: BigNumber(dynamicFields.unlock_at * 1000).toNumber(),
    } as Vesca;
  }

  return vesca;
};

/**
 * Get current total veSca treasury amount.
 */
const getTotalVeScaTreasuryAmount = async (
  query: ScallopQuery,
  veScaTreasury: SuiObjectData
): Promise<string> => {
  const veScaPkgId = query.address.get('vesca.id');
  const veScaConfig = query.address.get('vesca.config');
  veScaTreasury = veScaTreasury ?? query.address.get('vesca.treasury');

  // refresh query
  const refreshQueryTarget = `${veScaPkgId}::treasury::refresh`;
  const refreshArgs = [veScaConfig, veScaTreasury, SUI_CLOCK_OBJECT_ID];

  // query total veSca amount
  const veScaAmountQueryTarget = `${veScaPkgId}::treasury::total_ve_sca_amount`;
  const veScaAmountArgs = [veScaTreasury, SUI_CLOCK_OBJECT_ID];

  // resolve each args
  const resolvedRefreshArgs = await Promise.all(
    refreshArgs.map(async (arg) => {
      if (typeof arg === 'string') {
        return (await query.cache.queryGetObject(arg, { showContent: true }))
          .data;
      }
      return arg;
    })
  );

  const resolvedVeScaAmountArgs = await Promise.all(
    veScaAmountArgs.map(async (arg) => {
      if (typeof arg === 'string') {
        return (await query.cache.queryGetObject(arg, { showContent: true }))
          .data;
      }
      return arg;
    })
  );

  const txb = new SuiTxBlock();
  // refresh first
  txb.moveCall(refreshQueryTarget, resolvedRefreshArgs);
  txb.moveCall(veScaAmountQueryTarget, resolvedVeScaAmountArgs);

  const txBytes = await txb.txBlock.build({
    client: query.suiKit.client(),
    onlyTransactionKind: true,
    protocolConfig: await query.cache.getProtocolConfig(),
  });

  // return result
  const res = await query.cache.queryClient.fetchQuery<DevInspectResults>({
    queryKey: [
      'getTotalVeScaTreasuryAmount',
      JSON.stringify([...refreshArgs, ...veScaAmountArgs]),
    ],
    queryFn: async () => {
      return await query.suiKit.inspectTxn(txBytes);
    },
  });

  const results = res.results;
  if (results && results[1].returnValues) {
    const value = Uint8Array.from(results[1].returnValues[0][0]);
    const type = results[1].returnValues[0][1];
    return bcs.de(type, value);
  }

  return '0';
};

/**
 * Get veSCA treasury informations
 * @param query
 * @returns VeScaTreasuryInfo
 */
export const getVeScaTreasuryInfo = async (
  query: ScallopQuery
): Promise<VeScaTreasuryInfo | null> => {
  const veScaTreasuryId = query.address.get('vesca.treasury');
  const veScaTreasury = await query.cache.queryGetObject(veScaTreasuryId, {
    showContent: true,
  });

  if (!veScaTreasury || veScaTreasury.data?.content?.dataType !== 'moveObject')
    return null;

  const treasuryFields = veScaTreasury.data.content
    .fields as VeScaTreasuryFields;

  console.log(treasuryFields);
  const totalLockedSca = BigNumber(
    treasuryFields.unlock_schedule.fields.locked_sca_amount
  )
    .shiftedBy(-9)
    .toNumber();
  const totalVeSca = BigNumber(
    (await getTotalVeScaTreasuryAmount(query, veScaTreasury.data)) ?? 0
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
