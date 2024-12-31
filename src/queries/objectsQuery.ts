import { ScallopCache } from 'src/models/scallopCache';
import { partitionArray } from 'src/utils';

export const queryMultipleObjects = async (
  cache: ScallopCache,
  objectIds: string[],
  partitionSize = 50
) => {
  const objectIdsPartition = partitionArray(objectIds, partitionSize);

  const objects = [];
  for (const objectIds of objectIdsPartition) {
    const result = await cache.queryGetObjects(objectIds);
    objects.push(...result);
  }

  return objects;
};
