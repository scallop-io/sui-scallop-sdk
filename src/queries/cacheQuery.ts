import { SuiKit, SuiTxBlock } from '@scallop-io/sui-kit';
import { scallopQueryClient } from './client';
import {
  GetOwnedObjectsParams,
  SuiObjectDataOptions,
  SuiObjectResponse,
} from '@mysten/sui.js/client';

const queryFn = (queryTarget: string, args: any[], typeArgs?: any[]) => {
  const txBlock = new SuiTxBlock();
  txBlock.moveCall(queryTarget, args, typeArgs ?? []);
  return txBlock;
};

export const queryMoveCall = async (
  queryTarget: string,
  args: any[],
  typeArgs: any[],
  staleTime: number | undefined
): Promise<SuiTxBlock> => {
  const query = await scallopQueryClient.fetchQuery({
    queryKey: ['movecall', queryTarget],
    queryFn: () => queryFn(queryTarget, args, typeArgs),
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
) => {
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
) => {
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
