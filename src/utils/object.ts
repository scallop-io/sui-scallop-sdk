import type { SuiClientTypes } from '@mysten/sui/client';
type SuiObjectData = SuiClientTypes.Object<{ content: true; json: true }>;
import { ScallopSuiKit } from 'src/models/index.js';

const parseObjectData = (data: SuiObjectData) => {
  if (
    typeof data === 'object' &&
    'objectId' in data &&
    'owner' in data &&
    data.owner &&
    typeof data.owner === 'object' &&
    'Shared' in data.owner &&
    'initial_shared_version' in (data.owner as any).Shared!
  ) {
    return {
      objectId: data.objectId,
      initialSharedVersion: (
        data.owner as any
      ).Shared!.initial_shared_version.toString(),
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
    return parseObjectData((objectData as any).data!);
  } else {
    return parseObjectData(object);
  }
};
