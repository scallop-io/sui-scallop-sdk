import axios, { AxiosInstance } from 'axios';
import { SDK_API_BASE_URL } from '../constants';
import { QueryClient, QueryClientConfig } from '@tanstack/query-core';
import type { SuiKit } from '@scallop-io/sui-kit';
import { SuiTxBlock } from '@scallop-io/sui-kit';
import type {
  SuiObjectResponse,
  SuiObjectDataOptions,
  SuiObjectData,
  PaginatedObjectsResponse,
  GetOwnedObjectsParams,
} from '@mysten/sui.js/client';

type QueryObjectParams = {
  options?: SuiObjectDataOptions;
};

/**
 * @description
 * It provides caching for query.
 *
 *
 * @example
 * ```typescript
 * const scallopCache = new scallopCache(<parameters>);
 * scallopCache.<indexer functions>();
 * await scallopCache.<indexer async functions>();
 * ```
 */

const DEFAULT_CACHE_OPTIONS: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 1000,
    },
  },
};
export class ScallopCache {
  public readonly requestClient: AxiosInstance;
  public readonly client: QueryClient;

  public constructor(cacheOptions: QueryClientConfig = DEFAULT_CACHE_OPTIONS) {
    this.client = new QueryClient(cacheOptions);

    this.requestClient = axios.create({
      baseURL: SDK_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
    });
  }

  public async queryMoveCall(
    queryTarget: string,
    args: any[],
    typeArgs: any[]
  ): Promise<SuiTxBlock> {
    const query = await this.client.fetchQuery({
      queryKey: ['movecall', queryTarget, ...(args || []), ...(typeArgs || [])],
      queryFn: async () => {
        const txBlock = new SuiTxBlock();
        txBlock.moveCall(queryTarget, args, typeArgs ?? []);
        return txBlock;
      },
    });
    return query;
  }

  public async queryGetObject(
    suiKit: SuiKit,
    objectId: string,
    { options }: QueryObjectParams
  ): Promise<SuiObjectResponse> {
    const queryKey = ['getObject', objectId, suiKit.currentAddress()];
    if (options) {
      queryKey.push(JSON.stringify(options));
    }
    return this.client.fetchQuery({
      queryKey,
      queryFn: async () => {
        return await suiKit.client().getObject({
          id: objectId,
          options,
        });
      },
    });
  }

  public async queryGetObjects(
    suiKit: SuiKit,
    objectIds: string[]
  ): Promise<SuiObjectData[]> {
    return this.client.fetchQuery({
      queryKey: ['getObjects', objectIds, suiKit.currentAddress()],
      queryFn: async () => {
        return await suiKit.getObjects(objectIds);
      },
    });
  }

  public async queryGetOwnedObjects(
    suiKit: SuiKit,
    input: GetOwnedObjectsParams
  ): Promise<PaginatedObjectsResponse> {
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

    return this.client.fetchQuery({
      queryKey,
      queryFn: async () => {
        return await suiKit.client().getOwnedObjects(input);
      },
    });
  }
}
