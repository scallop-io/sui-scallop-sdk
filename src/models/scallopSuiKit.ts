import {
  DerivePathParams,
  normalizeStructTag,
  parseStructTag,
  SuiKit,
  SuiKitParams,
  SuiObjectArg,
  SuiTxBlock,
  Transaction,
} from '@scallop-io/sui-kit';
import { queryKeys } from 'src/constants';
import {
  CoinBalance,
  DevInspectResults,
  DynamicFieldPage,
  GetBalanceParams,
  GetDynamicFieldObjectParams,
  GetDynamicFieldsParams,
  GetOwnedObjectsParams,
  SuiObjectData,
  SuiObjectDataOptions,
  SuiObjectResponse,
} from '@mysten/sui/client';
import { newSuiKit } from 'src/models/suiKit';
import { QueryKey } from '@tanstack/query-core';
import ScallopQueryClient, {
  ScallopQueryClientParams,
} from './scallopQueryClient';

type QueryInspectTxnParams = {
  queryTarget: string;
  args: SuiObjectArg[];
  typeArgs?: any[];
};

export type ScallopSuiKitParams = {
  suiKit?: SuiKit;
  tokensPerSecond?: number;
  walletAddress?: string;
} & SuiKitParams &
  ScallopQueryClientParams;

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

class ScallopSuiKit extends ScallopQueryClient {
  public readonly suiKit: SuiKit;
  private _walletAddress: string;
  private _tokensPerSecond: number;
  private rateLimiter: RateLimiter;

  constructor(params: ScallopSuiKitParams = {}) {
    super(params);

    this.suiKit = params.suiKit ?? newSuiKit(params);
    this._tokensPerSecond =
      params.tokensPerSecond ?? DEFAULT_TOKENS_PER_INTERVAL;
    this.rateLimiter = new RateLimiter(this._tokensPerSecond);
    this._walletAddress = params.walletAddress ?? this.suiKit.currentAddress;
  }

  switchFullNodes(fullNodes: string[]) {
    this.suiKit.suiInteractor.switchFullNodes(fullNodes);
  }

  get client() {
    return this.suiKit.client;
  }

  get walletAddress() {
    return this._walletAddress;
  }

  set walletAddress(value: string) {
    this._walletAddress = value;
  }

  get tokensPerSecond() {
    return this._tokensPerSecond;
  }

  set tokensPerSecond(value: number) {
    this._tokensPerSecond = value;
    this.rateLimiter = new RateLimiter(this._tokensPerSecond);
  }

  get currentFullNode() {
    return this.suiKit.suiInteractor.currentFullNode;
  }

  signAndSendTxn(
    tx: Uint8Array | Transaction | SuiTxBlock,
    derivePathParams?: DerivePathParams
  ) {
    return this.suiKit.signAndSendTxn(tx, derivePathParams);
  }

  private async callWithRateLimiter<T>(
    queryKey: QueryKey,
    fn: () => Promise<T> // Changed to function that returns Promise
  ): Promise<T> {
    return await this.queryClient.fetchQuery({
      queryKey,
      queryFn: () => this.rateLimiter.execute(fn), // Removed unnecessary async/await
    });
  }

  private async queryGetNormalizedMoveFunction(target: string) {
    const { address, module, name } = parseStructTag(target);
    return await this.callWithRateLimiter(
      queryKeys.rpc.getNormalizedMoveFunction(target),
      () =>
        this.client.getNormalizedMoveFunction({
          // Wrapped in function
          package: address,
          module,
          function: name,
        })
    );
  }

  /**
   * @description Provides cache for getObject of the SuiKit.
   * @param objectId
   * @param QueryObjectParams
   * @returns Promise<SuiObjectResponse>
   */
  async queryGetObject(objectId: string, options?: SuiObjectDataOptions) {
    options = {
      ...options,
      showOwner: true,
      showContent: true,
      showType: true,
    };
    return await this.callWithRateLimiter(
      queryKeys.rpc.getObject(objectId, options),
      () =>
        this.client.getObject({
          id: objectId,
          options,
        })
    );
  }

  /**
   * @description Provides cache for getObjects of the SuiKit.
   * @param objectIds
   * @returns Promise<SuiObjectData[]>
   */
  async queryGetObjects(
    objectIds: string[],
    options?: SuiObjectDataOptions
  ): Promise<SuiObjectData[]> {
    if (objectIds.length === 0) return [];
    options ??= {
      showContent: true,
      showOwner: true,
      showType: true,
    };

    const results = await this.callWithRateLimiter(
      queryKeys.rpc.getObjects(objectIds),
      () =>
        this.suiKit.getObjects(objectIds, {
          showOwner: options?.showOwner,
          showContent: options?.showContent,
          showType: options?.showType,
        })
    );

    results.forEach((result) => {
      // fetch previous data
      const queryKey = queryKeys.rpc.getObject(result.objectId);
      const prevDatas = this.queryClient.getQueriesData<SuiObjectResponse>({
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
    return results;
  }

  /**
   * @description Provides cache for getOwnedObjects of the SuiKit.
   * @param input
   * @returns Promise<PaginatedObjectsResponse>
   */
  async queryGetOwnedObjects(input: GetOwnedObjectsParams) {
    // @TODO: This query need its own separate rate limiter (as owned objects can theoretically be infinite), need a better way to handle this
    const results = await this.callWithRateLimiter(
      queryKeys.rpc.getOwnedObjects(input),
      () => this.client.getOwnedObjects(input)
    );

    if (results && results.data.length > 0) {
      results.data
        .filter(
          (
            result
          ): result is typeof result & NonNullable<{ data: SuiObjectData }> =>
            !!result.data
        )
        .forEach((result) => {
          // fetch previous data
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
        });
    }
    return results;
  }

  async queryGetDynamicFields(
    input: GetDynamicFieldsParams
  ): Promise<DynamicFieldPage | null> {
    return await this.callWithRateLimiter(
      queryKeys.rpc.getDynamicFields(input),
      () => this.client.getDynamicFields(input)
    );
  }

  async queryGetDynamicFieldObject(
    input: GetDynamicFieldObjectParams
  ): Promise<SuiObjectResponse | null> {
    const result = await this.callWithRateLimiter(
      queryKeys.rpc.getDynamicFieldObject(input),
      () => this.client.getDynamicFieldObject(input)
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
  }

  async queryGetAllCoinBalances(
    owner: string
  ): Promise<{ [k: string]: CoinBalance }> {
    return await this.callWithRateLimiter(
      queryKeys.rpc.getAllCoinBalances(owner),
      async () => {
        const allBalances = await this.client.getAllBalances({ owner });
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
      }
    );
  }

  public async queryGetCoinBalance(
    input: GetBalanceParams
  ): Promise<CoinBalance | null> {
    if (!input.coinType) return null;
    const coinBalances = await this.queryGetAllCoinBalances(input.owner);
    return coinBalances[normalizeStructTag(input.coinType)] ?? null;
  }

  /**
   * @description Provides cache for inspectTxn of the SuiKit.
   * @param QueryInspectTxnParams
   * @param txBlock
   * @returns Promise<DevInspectResults>
   */
  async queryInspectTxn({
    queryTarget,
    args,
    typeArgs,
  }: QueryInspectTxnParams): Promise<DevInspectResults | null> {
    const txBlock = new SuiTxBlock();

    const resolvedQueryTarget =
      await this.queryGetNormalizedMoveFunction(queryTarget);
    if (!resolvedQueryTarget) throw new Error('Invalid query target');

    const resolvedArgs = await Promise.all(
      (args ?? []).map(async (arg) => {
        if (typeof arg !== 'string') return arg;

        const cachedData = (await this.queryGetObject(arg))?.data;
        if (!cachedData) return arg;

        return cachedData;
      })
    );
    txBlock.moveCall(queryTarget, resolvedArgs, typeArgs);

    return await this.callWithRateLimiter(
      queryKeys.rpc.getInspectTxn(queryTarget, args, typeArgs),
      () => this.suiKit.inspectTxn(txBlock)
    );
  }
}

export default ScallopSuiKit;
