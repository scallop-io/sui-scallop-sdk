import BigNumber from 'bignumber.js';
import { Vesca } from '../types';
import type { SuiObjectResponse, SuiObjectData } from '@mysten/sui.js/client';
import type { ScallopQuery } from '../models';

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
  // const veScaPkgId = query.address.get('vesca.id');
  const veScaPkgId =
    '0xb220d034bdf335d77ae5bfbf6daf059c2cc7a1f719b12bfed75d1736fac038c8';
  const veScaKeyType = `${veScaPkgId}::ve_sca::VeScaKey`;
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
  const keyObjectId: string[] = keyObjectDatas.map((data) => data.objectId);

  const veScas: Vesca[] = [];
  for (const keyId of keyObjectId) {
    const veSca = await getVeSca(query, keyId);
    if (veSca) veScas.push(veSca);
  }

  return veScas;
};

/**
 * Get veSca data.
 *
 * @param query - The Scallop query instance.
 * @param veScaKeyId - The vesca key id.
 * @param ownerAddress - The owner address.
 * @returns Vesca data.
 */
export const getVeSca = async (
  query: ScallopQuery,
  veScaKeyId?: string,
  ownerAddress?: string
) => {
  // const tableId = query.address.get('vesca.tableId');
  const tableId =
    '0xc607241e4a679fe376d1170b2fbe07b64917bfe69100d4825241cda20039d4bd';
  veScaKeyId =
    veScaKeyId || (await getVescaKeys(query, ownerAddress))[0].objectId;

  let vesca: Vesca | undefined = undefined;

  const veScaDynamicFieldObjectResponse = await query.suiKit
    .client()
    .getDynamicFieldObject({
      parentId: tableId,
      name: {
        type: '0x2::object::ID',
        value: veScaKeyId,
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
    vesca = {
      id: veScaDynamicFieldObject.objectId,
      keyId: veScaKeyId,
      lockedScaAmount: BigNumber(dynamicFields.locked_sca_amount).toNumber(),
      lockedScaCoin: BigNumber(dynamicFields.locked_sca_amount)
        .shiftedBy(-9)
        .toNumber(),
      unlockAt: BigNumber(dynamicFields.unlock_at).toNumber(),
    } as Vesca;
  }

  return vesca;
};
