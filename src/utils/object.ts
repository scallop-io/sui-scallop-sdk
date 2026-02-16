import type { SuiObjectData } from 'src/types/index.js';
import { ScallopSuiKit } from 'src/models/index.js';

const parseObjectData = (data: SuiObjectData) => {
  if (
    typeof data === 'object' &&
    'objectId' in data &&
    'owner' in data &&
    data.owner &&
    typeof data.owner === 'object' &&
    '$kind' in data.owner &&
    (data.owner as any).$kind === 'Shared' &&
    'Shared' in data.owner &&
    'initialSharedVersion' in (data.owner as any).Shared
  ) {
    return {
      objectId: data.objectId,
      initialSharedVersion: (
        data.owner as any
      ).Shared.initialSharedVersion.toString(),
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
      json: true,
      content: false,
    });
    if (!objectData?.object) {
      throw new Error('Failed to get object data');
    }
    return parseObjectData(objectData.object);
  } else {
    return parseObjectData(object);
  }
};
