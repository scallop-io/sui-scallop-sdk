import { SuiObjectResponse } from '@mysten/sui.js/dist/cjs/client';
import { ScallopQuery } from '../models';
import { Vesca } from '../types';

export const getVeScas = async (query: ScallopQuery, ownerAddress: string) => {
  const owner = ownerAddress || query.suiKit.currentAddress();
  const pkgId = query.address.get('vesca.id');

  if (!pkgId) {
    throw new Error('Vesca package id not found');
  }

  const veScaKeysResponse: SuiObjectResponse[] = [];
  let hasNextPage = false;
  let nextCursor: string | null = null;

  do {
    const paginatedKeyObjectsResponse = await query.suiKit
      .client()
      .getOwnedObjects({
        owner,
        filter: {
          StructType: `${pkgId}::ve_sca::VeScaKey`,
        },
        cursor: nextCursor,
      });
    veScaKeysResponse.push(...paginatedKeyObjectsResponse.data);
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

  const keyObjectId: string[] = veScaKeysResponse
    .map((ref: any) => ref?.data?.objectId)
    .filter((id: any) => id !== undefined);

  const veScas: Vesca[] = [];
  for (const id of keyObjectId) {
    const veSca = await getVeSca(query, id);
    veScas.push(veSca);
  }

  return veScas;
};

export const getVeSca = async (query: ScallopQuery, veScaKeyId: string) => {
  const tableId = query.address.get('vesca.tableId');
  if (!tableId) {
    throw new Error('Vesca table id not found');
  }

  const veSca = await query.suiKit.client().getDynamicFieldObject({
    parentId: tableId,
    name: {
      type: '0x2::object::ID',
      value: veScaKeyId,
    },
  });

  if (!veSca.data || veSca.data?.content?.dataType !== 'moveObject') {
    throw new Error('VeSca not found');
  }

  const { locked_sca_amount, unlock_at } = (veSca.data.content.fields as any)
    .value.fields;
  return {
    keyId: veScaKeyId,
    id: veSca.data.objectId,
    locked_sca_amount,
    unlock_at,
  };
};
