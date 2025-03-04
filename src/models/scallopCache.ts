import { QueryClient } from '@tanstack/query-core';
import {
  SuiObjectArg,
  SuiTxBlock,
  normalizeStructTag,
  parseStructTag,
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
  CoinBalance,
} from '@mysten/sui/client';
import { DEFAULT_CACHE_OPTIONS } from 'src/constants/cache';
import { queryKeys } from 'src/constants';
import { ScallopCacheInstanceParams, ScallopCacheParams } from 'src/types';
import { newSuiKit } from './suiKit';

type QueryInspectTxnParams = {
  queryTarget: string;
  args: SuiObjectArg[];
  typeArgs?: any[];
};

const DEFAULT_TOKENS_PER_INTERVAL = 10;
const DEFAULT_INTERVAL_IN_MS = 250;

const deepMergeObject = <T>(curr: T, update: T): T => {
  const result = { ...curr }; // Clone the current object to avoid mutation

  for (const key in update) {
    if (
      update[key] &&
      typeof update[key] === 'object' &&
      !Array.isArray(update[key])
    ) {
      // If the value is an object, recurse
      result[key] = deepMergeObject(
        curr[key] || ({} as T[Extract<keyof T, string>]),
        update[key]
      );
    } else {
      // Otherwise, directly assign the value
      result[key] = update[key];
    }
  }

  return result;
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
  public readonly params: ScallopCacheParams;

  public queryClient: QueryClient;
  public suiKit: SuiKit;
  // private tokenBucket: TokenBucket;
  public walletAddress: string;
  private tokensPerInterval: number = DEFAULT_TOKENS_PER_INTERVAL;
  private interval: number = DEFAULT_INTERVAL_IN_MS;
  private tokens: number;
  private lastRefill: number;

  public constructor(
    params: ScallopCacheParams = {},
    instance?: ScallopCacheInstanceParams
  ) {
    this.params = params;
    this.suiKit = instance?.suiKit ?? newSuiKit(params);
    this.queryClient =
      instance?.queryClient ??
      new QueryClient(params?.cacheOptions ?? DEFAULT_CACHE_OPTIONS);

    // handle case where there's existing queryClient and cacheOptions is also passed
    // if (queryClient && cacheOptions) {
    //   // override the default options with the cacheOptions
    //   if (cacheOptions.defaultOptions)
    //     this.queryClient.setDefaultOptions(cacheOptions.defaultOptions);
    //   // if (cacheOptions.queryCache)
    //   //   this.queryClient.defaultQueryOptions(cacheOptions.queryCache);
    //   // if(cacheOptions.mutations)this.queryClient.setMutationDefaults(cacheOptions.mutations);
    // }

    this.tokens = this.tokensPerInterval;
    this.lastRefill = Date.now();
    this.walletAddress = params.walletAddress ?? this.suiKit.currentAddress();
  }

  private get client(): SuiClient {
    return this.suiKit.client();
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;

    if (elapsed >= this.interval) {
      const tokensToAdd =
        Math.floor(elapsed / this.interval) * this.tokensPerInterval;
      this.tokens = Math.min(this.tokens + tokensToAdd, this.tokensPerInterval);

      // Update lastRefill to reflect the exact time of the last "refill"
      this.lastRefill += Math.floor(elapsed / this.interval) * this.interval;
    }
  }

  private removeTokens(count: number) {
    this.refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return true;
    }
    return false;
  }

  private async callWithRateLimit<T>(
    fn: () => Promise<T>,
    maxRetries = 15,
    backoffFactor = 1.25 // The factor by which to increase the delay
  ): Promise<T | null> {
    let retries = 0;

    const tryRequest = async (): Promise<T | null> => {
      if (this.removeTokens(1)) {
        const result = await fn();
        return result;
      } else if (retries < maxRetries) {
        retries++;
        const delay = this.interval * Math.pow(backoffFactor, retries);
        // console.error(`Rate limit exceeded, retrying in ${delay} ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return tryRequest();
      } else {
        console.error('Maximum retries reached');
        return null;
      }
    };

    return tryRequest();
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
  // public async invalidateAllCache() {
  //   return Object.values(queryKeys.rpc).map((t) =>
  //     this.queryClient.invalidateQueries({
  //       queryKey: t(),
  //       type: 'all',
  //     })
  //   );
  // }

  private retryFn(errCount: number, e: any) {
    if (errCount === 5) return false;
    if (e.status === 429) return true;
    return false;
  }

  /**
   * @description Provides cache for inspectTxn of the SuiKit.
   * @param QueryInspectTxnParams
   * @param txBlock
   * @returns Promise<DevInspectResults>
   */
  public async queryInspectTxn(
    { queryTarget, args, typeArgs }: QueryInspectTxnParams,
    key: string
  ): Promise<DevInspectResults | null> {
    const txBlock = new SuiTxBlock();

    const resolvedQueryTarget =
      await this.queryGetNormalizedMoveFunction(queryTarget);
    if (!resolvedQueryTarget) throw new Error('Invalid query target');

    const { parameters } = resolvedQueryTarget;

    const resolvedArgs = await Promise.all(
      (args ?? []).map(async (arg, idx) => {
        if (typeof arg !== 'string') return arg;

        const cachedData = (await this.queryGetObject(arg))?.data;
        if (!cachedData) return arg;

        const owner = cachedData.owner;
        if (!owner || typeof owner !== 'object' || !('Shared' in owner))
          return {
            objectId: cachedData.objectId,
            version: cachedData.version,
            digest: cachedData.digest,
          };

        const parameter = parameters[idx];
        if (
          typeof parameter !== 'object' ||
          !('MutableReference' in parameter || 'Reference' in parameter)
        )
          return arg;

        return {
          objectId: cachedData.objectId,
          initialSharedVersion: owner.Shared.initial_shared_version,
          mutable: 'MutableReference' in parameter,
        };
      })
    );
    txBlock.moveCall(queryTarget, resolvedArgs, typeArgs);

    const query = await this.queryClient.fetchQuery({
      retry: this.retryFn,
      retryDelay: 1000,
      queryKey: queryKeys.rpc.getInspectTxn(queryTarget, key),
      queryFn: async () => {
        return await this.callWithRateLimit(
          async () => await this.suiKit.inspectTxn(txBlock)
        );
      },
    });
    return query;
  }

  public async queryGetNormalizedMoveFunction(target: string) {
    const { address, module, name } = parseStructTag(target);
    return this.queryClient.fetchQuery({
      queryKey: queryKeys.rpc.getNormalizedMoveFunction(target),
      queryFn: async () => {
        return await this.callWithRateLimit(
          async () =>
            await this.suiKit.client().getNormalizedMoveFunction({
              package: address,
              module,
              function: name,
            })
        );
      },
    });
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
  ) {
    options = {
      ...options,
      showOwner: true,
      showContent: true,
      showType: true,
    };
    return this.queryClient.fetchQuery({
      retry: this.retryFn,
      retryDelay: 1000,
      queryKey: queryKeys.rpc.getObject(objectId, options),
      queryFn: async () => {
        return await this.callWithRateLimit(
          async () =>
            await this.client.getObject({
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
  public async queryGetObjects(objectIds: string[]): Promise<SuiObjectData[]> {
    if (objectIds.length === 0) return [];
    const options: SuiObjectDataOptions = {
      showContent: true,
      showOwner: true,
      showType: true,
    };

    return this.queryClient.fetchQuery({
      retry: this.retryFn,
      retryDelay: 1000,
      queryKey: queryKeys.rpc.getObjects(objectIds),
      queryFn: async () => {
        const results = await this.callWithRateLimit(
          async () => await this.suiKit.getObjects(objectIds, options)
        );
        if (results) {
          results.forEach((result) => {
            // fetch previous data
            const queryKey = queryKeys.rpc.getObject(result.objectId);
            const prevDatas =
              this.queryClient.getQueriesData<SuiObjectResponse>({
                exact: false,
                queryKey,
              });
            prevDatas.forEach(([key, prevData]) => {
              this.queryClient.setQueryData(
                key,
                deepMergeObject(prevData, { data: result, error: null }),
                { updatedAt: Date.now() }
              );
            });
          });
        }
        return results;
      },
    });
  }

  /**
   * @description Provides cache for getOwnedObjects of the SuiKit.
   * @param input
   * @returns Promise<PaginatedObjectsResponse>
   */
  public async queryGetOwnedObjects(input: GetOwnedObjectsParams) {
    // @TODO: This query need its own separate rate limiter (as owned objects can theoretically be infinite), need a better way to handle this
    return this.queryClient.fetchQuery({
      retry: this.retryFn,
      retryDelay: 1000,
      queryKey: queryKeys.rpc.getOwnedObjects(input),
      queryFn: async () => {
        const results = await this.callWithRateLimit(
          async () => await this.client.getOwnedObjects(input)
        );
        if (results && results.data.length > 0) {
          results.data
            .filter(
              (
                result
              ): result is typeof result &
                NonNullable<{ data: SuiObjectData }> => !!result.data
            )
            .forEach((result) => {
              // fetch previous data
              const queryKey = queryKeys.rpc.getObject(result.data.objectId);
              const prevDatas =
                this.queryClient.getQueriesData<SuiObjectResponse>({
                  exact: false,
                  queryKey,
                });
              prevDatas.forEach(([key, prevData]) => {
                this.queryClient.setQueryData(
                  key,
                  deepMergeObject(prevData, { data: result.data, error: null }),
                  { updatedAt: Date.now() }
                );
              });
            });
        }
        return results;
      },
    });
  }

  public async queryGetDynamicFields(
    input: GetDynamicFieldsParams
  ): Promise<DynamicFieldPage | null> {
    return this.queryClient.fetchQuery({
      retry: this.retryFn,
      retryDelay: 1000,
      queryKey: queryKeys.rpc.getDynamicFields(input),
      queryFn: async () => {
        return await this.callWithRateLimit(
          async () => await this.client.getDynamicFields(input)
        );
      },
    });
  }

  public async queryGetDynamicFieldObject(
    input: GetDynamicFieldObjectParams
  ): Promise<SuiObjectResponse | null> {
    return this.queryClient.fetchQuery({
      retry: this.retryFn,
      retryDelay: (attemptIndex) => Math.min(1000 * attemptIndex, 8000),
      queryKey: queryKeys.rpc.getDynamicFieldObject(input),
      queryFn: async () => {
        const result = await this.callWithRateLimit(() =>
          this.client.getDynamicFieldObject(input)
        );
        if (result?.data) {
          const queryKey = queryKeys.rpc.getObject(result.data.objectId);
          const prevDatas = this.queryClient.getQueriesData<SuiObjectResponse>({
            exact: false,
            queryKey,
          });
          prevDatas.forEach(([key, prevData]) => {
            this.queryClient.setQueryData(
              key,
              deepMergeObject(prevData, { data: result.data, error: null }),
              { updatedAt: Date.now() }
            );
          });
        }
        return result;
      },
    });
  }

  public async queryGetAllCoinBalances(
    owner: string
  ): Promise<{ [k: string]: CoinBalance }> {
    return this.queryClient.fetchQuery({
      retry: this.retryFn,
      retryDelay: 1000,
      queryKey: queryKeys.rpc.getAllCoinBalances(owner),
      queryFn: async () => {
        const allBalances = await this.callWithRateLimit(
          async () => await this.client.getAllBalances({ owner })
        );
        if (!allBalances) return {};
        const balances = allBalances.reduce(
          (acc, coinBalance) => {
            if (coinBalance.totalBalance !== '0') {
              acc[normalizeStructTag(coinBalance.coinType)] = coinBalance;
            }
            return acc;
          },
          {} as { [k: string]: CoinBalance }
        );

        return balances;
      },
    });
  }

  public async queryGetCoinBalance(
    input: GetBalanceParams
  ): Promise<CoinBalance | null> {
    if (!input.coinType) return null;

    return (
      ((await this.queryGetAllCoinBalances(input.owner)) ?? {})[
        normalizeStructTag(input.coinType)
      ] ?? '0'
    );
  }
}
