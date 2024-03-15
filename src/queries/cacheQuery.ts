import { SuiKit, SuiTxBlock } from '@scallop-io/sui-kit';
import { scallopQueryClient } from './client';
import {
  GetOwnedObjectsParams,
  PaginatedObjectsResponse,
  SuiObjectData,
  SuiObjectDataOptions,
  SuiObjectResponse,
} from '@mysten/sui.js/client';

export const queryMoveCall = async (
  queryTarget: string,
  args: any[],
  typeArgs: any[],
  staleTime: number | undefined
): Promise<SuiTxBlock> => {
  const query = await scallopQueryClient.fetchQuery({
    queryKey: ['movecall', queryTarget],
    queryFn: async () => {
      const txBlock = new SuiTxBlock();
      txBlock.moveCall(queryTarget, args, typeArgs ?? []);
      return txBlock;
    },
    staleTime,
  });

  return query;
};

type QueryObjectParams = {
  options?: SuiObjectDataOptions;
  staleTime: number | undefined;
};
export const queryGetObject = async (
  suiKit: SuiKit,
  objectId: string,
  { options, staleTime }: QueryObjectParams
): Promise<SuiObjectResponse> => {
  return scallopQueryClient.fetchQuery({
    queryKey: ['getObject', objectId, suiKit.currentAddress()],
    queryFn: async () => {
      return await suiKit.client().getObject({
        id: objectId,
        options,
      });
    },
    staleTime,
  });
};

export const queryGetObjects = async (
  suiKit: SuiKit,
  objectIds: string[],
  staleTime: number | undefined
): Promise<SuiObjectData[]> => {
  return scallopQueryClient.fetchQuery({
    queryKey: ['getObjects', objectIds, suiKit.currentAddress()],
    queryFn: async () => {
      return await suiKit.getObjects(objectIds);
    },
    staleTime,
  });
};

export const queryGetOwnedObjects = async (
  suiKit: SuiKit,
  input: GetOwnedObjectsParams,
  staleTime: number | undefined
): Promise<PaginatedObjectsResponse> => {
  const queryKey = [
    'getOwnedObjects',
    input.owner,
    input.options && JSON.stringify(input.filter),
    input.cursor,
  ]
    .filter(Boolean)
    .map(String);

  return scallopQueryClient.fetchQuery({
    queryKey,
    queryFn: async () => {
      return await suiKit.client().getOwnedObjects(input);
    },
    staleTime,
  });
};
