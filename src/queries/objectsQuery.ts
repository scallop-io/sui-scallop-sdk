import { SuiObjectDataOptions } from '@mysten/sui/dist/cjs/client';
import { ScallopCache } from 'src/models/scallopCache';
import { partitionArray } from 'src/utils';

export const queryMultipleObjects = async (
  cache: ScallopCache,
  objectIds: string[],
  options?: SuiObjectDataOptions,
  partitionSize = 50
) => {
  const objectIdsPartition = partitionArray(objectIds, partitionSize);

  const objects = [];
  for (const objectIds of objectIdsPartition) {
    const result = await cache.queryGetObjects(objectIds, options);
    objects.push(...result);
  }

  return objects;
};
