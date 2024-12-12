import { QueryClient, QueryClientConfig } from '@tanstack/query-core';
import {
  SuiObjectArg,
  SuiTxBlock,
  normalizeStructTag,
} from '@scallop-io/sui-kit';
import { SuiKit } from '@scallop-io/sui-kit';
import type {
  SuiObjectResponse,
  SuiObjectDataOptions,
  SuiObjectData,
  GetOwnedObjectsParams,
  DevInspectResults,
  GetDynamicFieldsParams,
  DynamicFieldPage,
  GetDynamicFieldObjectParams,
  GetBalanceParams,
  SuiClient,
} from '@mysten/sui/client';
import { DEFAULT_CACHE_OPTIONS } from 'src/constants/cache';
import { callWithRateLimit, TokenBucket } from 'src/utils';
import {
  DEFAULT_INTERVAL_IN_MS,
  DEFAULT_TOKENS_PER_INTERVAL,
} from 'src/constants/tokenBucket';
import { queryKeys } from 'src/constants';

type QueryInspectTxnParams = {
  queryTarget: string;
  args: SuiObjectArg[];
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
  public readonly _suiKit: SuiKit;
  private tokenBucket: TokenBucket;
  public walletAddress: string;

  public constructor(
    suiKit: SuiKit,
    walletAddress?: string,
    cacheOptions?: QueryClientConfig,
    tokenBucket?: TokenBucket,
    queryClient?: QueryClient
  ) {
    this.queryClient =
      queryClient ?? new QueryClient(cacheOptions ?? DEFAULT_CACHE_OPTIONS);

    // handle case where there's existing queryClient and cacheOptions is also passed
    // if (queryClient && cacheOptions) {
    //   // override the default options with the cacheOptions
    //   if (cacheOptions.defaultOptions)
    //     this.queryClient.setDefaultOptions(cacheOptions.defaultOptions);
    //   // if (cacheOptions.queryCache)
    //   //   this.queryClient.defaultQueryOptions(cacheOptions.queryCache);
    //   // if(cacheOptions.mutations)this.queryClient.setMutationDefaults(cacheOptions.mutations);
    // }

    this._suiKit = suiKit;
    this.tokenBucket =
      tokenBucket ??
      new TokenBucket(DEFAULT_TOKENS_PER_INTERVAL, DEFAULT_INTERVAL_IN_MS);
    this.walletAddress = walletAddress ?? suiKit.currentAddress();
  }

  private get suiKit(): SuiKit {
    if (!this._suiKit) {
      throw new Error('SuiKit instance is not initialized');
    }
    return this._suiKit;
  }

  private get client(): SuiClient {
    return this.suiKit.client();
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
  public async invalidateAllCache() {
    return Object.values(queryKeys.rpc).map((t) =>
      this.queryClient.invalidateQueries({
        queryKey: t(),
        type: 'all',
      })
    );
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
  }: QueryInspectTxnParams): Promise<DevInspectResults | null> {
    const txBlock = new SuiTxBlock();

    txBlock.moveCall(queryTarget, args, typeArgs);

    const query = await this.queryClient.fetchQuery({
      queryKey: queryKeys.rpc.getInspectTxn(queryTarget, args, typeArgs),
      queryFn: async () => {
        return await callWithRateLimit(this.tokenBucket, () =>
          this.suiKit.inspectTxn(txBlock)
        );
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
    options?: SuiObjectDataOptions
  ): Promise<SuiObjectResponse | null> {
    return this.queryClient.fetchQuery({
      queryKey: queryKeys.rpc.getObject(objectId, this.walletAddress, options),
      queryFn: async () => {
        return await callWithRateLimit(this.tokenBucket, () =>
          this.client.getObject({
            id: objectId,
            options,
          })
        );
      },
    });
  }

  /**
   * @description Provides cache for getObjects of the SuiKit.
   * @param objectIds
   * @returns Promise<SuiObjectData[]>
   */
  public async queryGetObjects(
    objectIds: string[],
    options: SuiObjectDataOptions = {
      showContent: true,
    }
  ): Promise<SuiObjectData[]> {
    if (objectIds.length === 0) return [];
    // objectIds.sort();

    return this.queryClient.fetchQuery({
      queryKey: queryKeys.rpc.getObjects(
        objectIds,
        this.walletAddress,
        options
      ),
      queryFn: async () => {
        return await callWithRateLimit(this.tokenBucket, () =>
          this.suiKit.getObjects(objectIds, options)
        );
      },
    });
  }

  /**
   * @description Provides cache for getOwnedObjects of the SuiKit.
   * @param input
   * @returns Promise<PaginatedObjectsResponse>
   */
  public async queryGetOwnedObjects(input: GetOwnedObjectsParams) {
    return this.queryClient.fetchQuery({
      queryKey: queryKeys.rpc.getOwnedObjects(input),
      queryFn: async () => {
        return await callWithRateLimit(this.tokenBucket, () =>
          this.client.getOwnedObjects(input)
        );
      },
    });
  }

  public async queryGetDynamicFields(
    input: GetDynamicFieldsParams
  ): Promise<DynamicFieldPage | null> {
    return this.queryClient.fetchQuery({
      queryKey: queryKeys.rpc.getDynamicFields(input),
      queryFn: async () => {
        return await callWithRateLimit(this.tokenBucket, () =>
          this.client.getDynamicFields(input)
        );
      },
    });
  }

  public async queryGetDynamicFieldObject(
    input: GetDynamicFieldObjectParams
  ): Promise<SuiObjectResponse | null> {
    return this.queryClient.fetchQuery({
      queryKey: queryKeys.rpc.getDynamicFieldObject(input),
      queryFn: async () => {
        return await callWithRateLimit(this.tokenBucket, () =>
          this.client.getDynamicFieldObject(input)
        );
      },
    });
  }

  public async queryGetAllCoinBalances(
    owner: string
  ): Promise<{ [k: string]: string }> {
    return this.queryClient.fetchQuery({
      queryKey: queryKeys.rpc.getAllCoinBalances(owner),
      queryFn: async () => {
        const allBalances = await callWithRateLimit(this.tokenBucket, () =>
          this.client.getAllBalances({ owner })
        );
        if (!allBalances) return {};
        const balances = allBalances.reduce(
          (acc, coinBalance) => {
            if (coinBalance.totalBalance !== '0') {
              acc[normalizeStructTag(coinBalance.coinType)] =
                coinBalance.totalBalance;
            }
            return acc;
          },
          {} as { [k: string]: string }
        );

        return balances;
      },
    });
  }

  public async queryGetCoinBalance(input: GetBalanceParams): Promise<string> {
    if (!input.coinType) return '0';

    return (
      ((await this.queryGetAllCoinBalances(input.owner)) ?? {})[
        normalizeStructTag(input.coinType)
      ] ?? '0'
    );
  }
}
