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
