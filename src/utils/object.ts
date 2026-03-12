import { SuiObjectData } from '@mysten/sui/client';
import { ScallopSuiKit } from 'src/models';

const parseObjectData = (data: SuiObjectData) => {
  if (
    typeof data === 'object' &&
    'objectId' in data &&
    'owner' in data &&
    data.owner &&
    typeof data.owner === 'object' &&
    'Shared' in data.owner &&
    'initial_shared_version' in data.owner.Shared
  ) {
    return {
      objectId: data.objectId,
      initialSharedVersion: data.owner.Shared.initial_shared_version.toString(),
    };
  }

  throw new Error('Invalid shared object data');
};

export const getSharedObjectData = async (
  object: any,
  scallopSuiKit: ScallopSuiKit
) => {
  if (typeof object === 'string') {
    const objectData = await scallopSuiKit.queryGetObject(object, {
      showOwner: true,
      showContent: false,
    });
    return parseObjectData(objectData.data!);
  } else {
    return parseObjectData(object);
  }
};

export const getSharedObjectDatas = async (
  objects: (string | SuiObjectData)[],
  scallopSuiKit: ScallopSuiKit
) => {
  // Separate string IDs (need RPC) from already-resolved objects
  const stringIds: string[] = [];
  for (let i = 0; i < objects.length; i++) {
    if (typeof objects[i] === 'string') {
      stringIds.push(objects[i] as string);
    }
  }

  // Batch-fetch only string IDs
  const fetchedMap = new Map<string, SuiObjectData>();
  if (stringIds.length > 0) {
    const objectsData = await scallopSuiKit.queryGetObjects(stringIds, {
      showOwner: true,
      showContent: false,
    });
    for (let i = 0; i < stringIds.length; i++) {
      fetchedMap.set(stringIds[i], objectsData[i]);
    }
  }

  // Resolve in original order
  return objects.map((obj) => {
    if (typeof obj === 'string') {
      return parseObjectData(fetchedMap.get(obj)!);
    }
    return parseObjectData(obj);
  });
};
