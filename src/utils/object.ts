import { getFullnodeUrl, SuiClient, SuiObjectData } from '@mysten/sui/client';

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
  client: SuiClient = new SuiClient({
    url: getFullnodeUrl('mainnet'),
  })
) => {
  if (typeof object === 'string') {
    const objectData = await client.getObject({
      id: object,
      options: {
        showOwner: true,
        showContent: false,
      },
    });
    return parseObjectData(objectData.data!);
  } else {
    return parseObjectData(object);
  }
};
