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

export class RateLimiter {
  private tokens: number;
  private lastRefillTime: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(private readonly capacity: number = 10) {
    this.refillRate = this.capacity / 1000; // 10 tokens per second = 0.01 tokens/ms
    this.tokens = this.capacity;
    this.lastRefillTime = Date.now();
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefillTime;
    const newTokens = elapsed * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + newTokens);
    this.lastRefillTime = now;
  }

  private getTimeToNextToken(): number {
    this.refill();

    if (this.tokens >= 1) {
      return 0;
    }

    // Calculate exact milliseconds needed for 1 full token
    const deficit = 1 - this.tokens;
    return Math.ceil(deficit / this.refillRate);
  }

  async acquireToken(): Promise<void> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const waitTime = this.getTimeToNextToken();

      if (waitTime === 0) {
        if (this.tokens >= 1) {
          this.tokens -= 1;
          return;
        }
        continue;
      }

      await new Promise((resolve) => setTimeout(resolve, waitTime));
      this.refill();
    }
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquireToken();
    return await fn();
  }
}
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
  public walletAddress: string;
  private limiter: RateLimiter;

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

    this.limiter = new RateLimiter(
      this.params.tokensPerSecond ?? DEFAULT_TOKENS_PER_INTERVAL
    );
    this.walletAddress = params.walletAddress ?? this.suiKit.currentAddress();
  }

  private get client(): SuiClient {
    return this.suiKit.client();
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
      queryKey: queryKeys.rpc.getInspectTxn({
        queryTarget,
        args,
        typeArgs,
        node: this.suiKit.suiInteractor.fullNodes[0],
      }),
      queryFn: async () => {
        return await this.limiter.execute(() =>
          this.suiKit.inspectTxn(txBlock)
        );
      },
    });
    return query;
  }

  private async queryGetNormalizedMoveFunction(target: string) {
    const { address, module, name } = parseStructTag(target);
    return this.queryClient.fetchQuery({
      queryKey: queryKeys.rpc.getNormalizedMoveFunction({
        target,
        node: this.suiKit.suiInteractor.fullNodes[0],
      }),
      queryFn: async () => {
        return await this.limiter.execute(() =>
          this.client.getNormalizedMoveFunction({
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
      queryKey: queryKeys.rpc.getObject({
        objectId,
        options,
        node: this.suiKit.suiInteractor.fullNodes[0],
      }),
      queryFn: async () => {
        return await this.limiter.execute(() =>
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
  public async queryGetObjects(objectIds: string[]): Promise<SuiObjectData[]> {
    if (objectIds.length === 0) return [];
    const options: SuiObjectDataOptions = {
      showContent: true,
      showOwner: true,
      showType: true,
    };

    return this.queryClient.fetchQuery({
      queryKey: queryKeys.rpc.getObjects({
        objectIds,
        node: this.suiKit.suiInteractor.fullNodes[0],
      }),
      queryFn: async () => {
        const results = await this.limiter.execute(() =>
          this.suiKit.getObjects(objectIds, options)
        );
        if (results) {
          results.forEach((result) => {
            // fetch previous data
            const queryKey = queryKeys.rpc.getObject({
              objectId: result.objectId,
              node: this.suiKit.suiInteractor.fullNodes[0],
            });
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
      queryKey: queryKeys.rpc.getOwnedObjects({
        ...input,
        node: this.suiKit.suiInteractor.fullNodes[0],
      }),
      queryFn: async () => {
        const results = await this.limiter.execute(() =>
          this.client.getOwnedObjects(input)
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
              const queryKey = queryKeys.rpc.getObject({
                objectId: result.data.objectId,
                node: this.suiKit.suiInteractor.fullNodes[0],
              });
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
      queryKey: queryKeys.rpc.getDynamicFields({
        ...input,
        node: this.suiKit.suiInteractor.fullNodes[0],
      }),
      queryFn: async () => {
        return await this.limiter.execute(() =>
          this.client.getDynamicFields(input)
        );
      },
    });
  }

  public async queryGetDynamicFieldObject(
    input: GetDynamicFieldObjectParams
  ): Promise<SuiObjectResponse | null> {
    return this.queryClient.fetchQuery({
      queryKey: queryKeys.rpc.getDynamicFieldObject({
        ...input,
        node: this.suiKit.suiInteractor.fullNodes[0],
      }),
      queryFn: async () => {
        const result = await this.limiter.execute(() =>
          this.client.getDynamicFieldObject(input)
        );
        if (result?.data) {
          const queryKey = queryKeys.rpc.getObject({
            objectId: result.data.objectId,
            node: this.suiKit.suiInteractor.fullNodes[0],
          });
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
      queryKey: queryKeys.rpc.getAllCoinBalances({
        owner,
        node: this.suiKit.suiInteractor.fullNodes[0],
      }),
      queryFn: async () => {
        const allBalances = await this.limiter.execute(() =>
          this.client.getAllBalances({ owner })
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
    const coinBalances = await this.queryGetAllCoinBalances(input.owner);
    return coinBalances[normalizeStructTag(input.coinType)] ?? null;
  }
}
