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
    queryKey: ['movecall', queryTarget, ...(args || []), ...(typeArgs || [])],
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
  const queryKey = ['getObject', objectId, suiKit.currentAddress()];
  if (options) {
    queryKey.push(JSON.stringify(options));
  }
  return scallopQueryClient.fetchQuery({
    queryKey,
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
  const queryKey = ['getOwnedObjects', input.owner];
  if (input.cursor) {
    queryKey.push(JSON.stringify(input.cursor));
  }
  if (input.options) {
    queryKey.push(JSON.stringify(input.options));
  }
  if (input.filter) {
    queryKey.push(JSON.stringify(input.filter));
  }
  if (input.limit) {
    queryKey.push(JSON.stringify(input.limit));
  }

  return scallopQueryClient.fetchQuery({
    queryKey,
    queryFn: async () => {
      return await suiKit.client().getOwnedObjects(input);
    },
    staleTime,
  });
};
