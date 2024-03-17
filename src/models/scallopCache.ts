import { QueryClient, QueryClientConfig } from '@tanstack/query-core';
import { SuiTxArg, SuiTxBlock } from '@scallop-io/sui-kit';
import { SuiKit } from '@scallop-io/sui-kit';
import type {
  SuiObjectResponse,
  SuiObjectDataOptions,
  SuiObjectData,
  PaginatedObjectsResponse,
  GetOwnedObjectsParams,
  DevInspectResults,
} from '@mysten/sui.js/client';
import { DEFAULT_CACHE_OPTIONS } from 'src/constants/cache';

type QueryObjectParams = {
  options?: SuiObjectDataOptions;
};

type QueryInspectTxnParams = {
  queryTarget: string;
  args: SuiTxArg[];
  typeArgs?: any[];
};

/**
 * @description
 * It provides caching for moveCall, RPC Request, and API Request.
 *
 *
 * @example
 * ```typescript
 * const scallopCache = new scallopCache(<parameters>);
 * scallopCache.<indexer functions>();
 * await scallopCache.<indexer async functions>();
 * ```
 */

export class ScallopCache {
  public readonly queryClient: QueryClient;
  public readonly _suiKit?: SuiKit;

  public constructor(cacheOptions?: QueryClientConfig, suiKit?: SuiKit) {
    this.queryClient = new QueryClient(cacheOptions ?? DEFAULT_CACHE_OPTIONS);
    this._suiKit = suiKit;
  }

  private get suiKit(): SuiKit {
    if (!this._suiKit) {
      throw new Error('SuiKit instance is not initialized');
    }
    return this._suiKit;
  }

  /**
   * @description Invalidate cache based on the refetchType parameter
   * @param refetchType Determines the type of queries to be refetched. Defaults to `active`.
   *
   * - `active`: Only queries that match the refetch predicate and are actively being rendered via useQuery and related functions will be refetched in the background.
   * - `inactive`: Only queries that match the refetch predicate and are NOT actively being rendered via useQuery and related functions will be refetched in the background.
   * - `all`: All queries that match the refetch predicate will be refetched in the background.
   * - `none`: No queries will be refetched. Queries that match the refetch predicate will only be marked as invalid.
   */
  public invalidateAndRefetchAllCache(
    refetchType: 'all' | 'active' | 'inactive' | 'none'
  ) {
    this.queryClient.invalidateQueries({
      refetchType,
    });
  }

  /**
   * @description Cache protocol config call for 60 seconds.
   * @returns Promise<ProtocolConfig>
   */
  private async getProtocolConfig() {
    return await this.queryClient.fetchQuery({
      queryKey: ['getProtocolConfig'],
      queryFn: async () => {
        return await this.suiKit.client().getProtocolConfig();
      },
      staleTime: 60000,
    });
  }

  /**
   * @description Provides cache for inspectTxn of the SuiKit.
   * @param QueryInspectTxnParams
   * @param txBlock
   * @returns Promise<DevInspectResults>
   */
  public async queryInspectTxn({
    queryTarget,
    args,
    typeArgs,
  }: QueryInspectTxnParams): Promise<DevInspectResults> {
    const txBlock = new SuiTxBlock();

    // resolve all the object args to prevent duplicate getNormalizedMoveFunction calls
    const resolvedArgs = await Promise.all(
      args.map(async (arg) => {
        if (typeof arg === 'string') {
          return (
            await this.queryGetObject(arg, {
              options: { showContent: true },
            })
          ).data;
        }
        return arg;
      })
    );
    txBlock.moveCall(queryTarget, resolvedArgs, typeArgs);

    // build the txBlock to prevent duplicate getProtocolConfig calls
    const txBytes = await txBlock.txBlock.build({
      client: this.suiKit.client(),
      onlyTransactionKind: true,
      protocolConfig: await this.getProtocolConfig(),
    });

    const query = await this.queryClient.fetchQuery({
      queryKey: typeArgs
        ? ['inspectTxn', queryTarget, JSON.stringify(args)]
        : [
            'inspectTxn',
            queryTarget,
            JSON.stringify(args),
            JSON.stringify(typeArgs),
          ],
      queryFn: async () => {
        return await this.suiKit.inspectTxn(txBytes);
      },
    });
    return query;
  }

  /**
   * @description Provides cache for getObject of the SuiKit.
   * @param objectId
   * @param QueryObjectParams
   * @returns Promise<SuiObjectResponse>
   */
  public async queryGetObject(
    objectId: string,
    { options }: QueryObjectParams
  ): Promise<SuiObjectResponse> {
    const queryKey = ['getObject', objectId, this.suiKit.currentAddress()];
    if (options) {
      queryKey.push(JSON.stringify(options));
    }
    return this.queryClient.fetchQuery({
      queryKey,
      queryFn: async () => {
        return await this.suiKit.client().getObject({
          id: objectId,
          options,
        });
      },
    });
  }

  /**
   * @description Provides cache for getObjects of the SuiKit.
   * @param objectIds
   * @returns Promise<SuiObjectData[]>
   */
  public async queryGetObjects(objectIds: string[]): Promise<SuiObjectData[]> {
    return this.queryClient.fetchQuery({
      queryKey: [
        'getObjects',
        JSON.stringify(objectIds),
        this.suiKit.currentAddress(),
      ],
      queryFn: async () => {
        return await this.suiKit.getObjects(objectIds);
      },
    });
  }

  /**
   * @description Provides cache for getOwnedObjects of the SuiKit.
   * @param input
   * @returns Promise<PaginatedObjectsResponse>
   */
  public async queryGetOwnedObjects(
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

    return this.queryClient.fetchQuery({
      queryKey,
      queryFn: async () => {
        return await this.suiKit.client().getOwnedObjects(input);
      },
    });
  }
}
