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
import { queryKeys } from 'src/constants/index.js';
import { newSuiKit } from 'src/models/suiKit.js';
import type {
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
} from 'src/types/index.js';
import { QueryKey } from '@tanstack/query-core';
import ScallopQueryClient, {
  ScallopQueryClientParams,
} from './scallopQueryClient.js';
import { RateLimiter } from './rateLimiter.js';

type QueryInspectTxnParams = {
  queryTarget: string;
  args: SuiObjectArg[];
  typeArgs?: any[];
  txBlock?: SuiTxBlock;
  keys?: QueryKey;
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
    try {
      // return current fullnode from SuiKit
      return this.suiKit.suiInteractor.currentFullNode;
    } catch (_) {
      // SuiKit is initialized with custom sui clients, so no fullnodes can be read
      return '';
    }
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
      queryKeys.rpc.getNormalizedMoveFunction({ target }),
      () =>
        this.client.core.getMoveFunction({
          packageId: address,
          moduleName: module,
          name,
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
    const includeOptions: SuiObjectDataOptions = {
      content: true,
      ...options,
    };
    return await this.callWithRateLimiter(
      queryKeys.rpc.getObject({
        objectId,
        options: includeOptions,
        node: this.currentFullNode,
      }),
      () =>
        this.client.core.getObject({
          objectId,
          include: includeOptions,
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
    const includeOptions: SuiObjectDataOptions = {
      content: true,
      ...options,
    };

    const results = await this.callWithRateLimiter(
      queryKeys.rpc.getObjects({
        objectIds,
        node: this.currentFullNode,
      }),
      () =>
        this.suiKit.getObjects(objectIds, {
          include: includeOptions,
        })
    );

    results.forEach((result) => {
      // fetch previous data
      const queryKey = queryKeys.rpc.getObject({
        objectId: result.objectId,
        node: this.currentFullNode,
      });
      const prevDatas = this.queryClient.getQueriesData<SuiObjectResponse>({
        exact: false,
        queryKey,
      });
      prevDatas.forEach(([key, prevData]) => {
        if (!prevData) {
          prevData = { object: null };
        }
        this.queryClient.setQueryData(
          key,
          deepMergeObject(prevData, { object: result }),
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
    const params = {
      ...input,
      limit: input.limit ?? undefined,
    };
    const results = await this.callWithRateLimiter(
      queryKeys.rpc.getOwnedObjects(input),
      () => this.client.core.listOwnedObjects(params)
    );

    if (results && results.objects && results.objects.length > 0) {
      results.objects
        .filter((result): result is NonNullable<typeof result> => !!result)
        .forEach((result: any) => {
          // fetch previous data
          const queryKey = queryKeys.rpc.getObject({
            objectId: result.objectId,
            node: this.currentFullNode,
          });
          const prevDatas = this.queryClient.getQueriesData<SuiObjectResponse>({
            exact: false,
            queryKey,
          });
          prevDatas.forEach(([key, prevData]: any) => {
            this.queryClient.setQueryData(
              key,
              deepMergeObject(prevData, { object: result }),
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
    const params = {
      ...input,
      limit: input.limit ?? undefined,
    };
    return await this.callWithRateLimiter(
      queryKeys.rpc.getDynamicFields(input),
      () => this.client.core.listDynamicFields(params)
    );
  }

  async queryGetDynamicFieldObject(
    input: GetDynamicFieldObjectParams
  ): Promise<SuiObjectResponse | null> {
    const result = await this.callWithRateLimiter(
      queryKeys.rpc.getDynamicFieldObject(input),
      () =>
        this.client.core.getDynamicObjectField({
          parentId: input.parentId,
          name: input.name,
          include: {
            content: true,
            json: true,
          },
        })
    );

    if (result?.object) {
      const queryKey = queryKeys.rpc.getObject({
        objectId: result.object.objectId,
        node: this.currentFullNode,
      });
      const prevDatas = this.queryClient.getQueriesData<SuiObjectResponse>({
        exact: false,
        queryKey,
      });
      prevDatas.forEach(([key, prevData]) => {
        this.queryClient.setQueryData(key, deepMergeObject(prevData, result), {
          updatedAt: Date.now(),
        });
      });
    }
    return result;
  }

  async queryGetAllCoinBalances(
    owner: string
  ): Promise<{ [k: string]: CoinBalance }> {
    return await this.callWithRateLimiter(
      queryKeys.rpc.getAllCoinBalances({
        activeAddress: owner,
        node: this.currentFullNode,
      }),
      async () => {
        // SDK v2: getAllBalances is removed, using listCoins instead
        const allCoins = await this.client.core.listCoins({ owner });
        // SDK v2 listCoins returns { objects: Coin[] } structure
        const coinList = allCoins.objects || [];
        if (!coinList.length) return {};

        // Group coins by type and sum balances
        const balances: { [k: string]: CoinBalance } = {};
        for (const coin of coinList) {
          const normalizedType = normalizeStructTag(coin.type);
          if (!balances[normalizedType]) {
            balances[normalizedType] = {
              coinType: coin.type,
              balance: '0',
            };
          }
          const currentBalance = BigInt(balances[normalizedType].balance);
          const coinBalance = BigInt(coin.balance);
          balances[normalizedType].balance = (
            currentBalance + coinBalance
          ).toString();
        }

        // Filter out zero balances
        return Object.fromEntries(
          Object.entries(balances).filter(([_, bal]) => bal.balance !== '0')
        );
      }
    );
  }

  async queryGetCoinBalance(
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
    txBlock = new SuiTxBlock(),
    keys,
  }: QueryInspectTxnParams): Promise<DevInspectResults | null> {
    const resolvedQueryTarget =
      await this.queryGetNormalizedMoveFunction(queryTarget);
    if (!resolvedQueryTarget) throw new Error('Invalid query target');

    const resolvedArgs = await Promise.all(
      (args ?? []).map(async (arg) => {
        if (typeof arg !== 'string') return arg;

        const objectResponse = await this.queryGetObject(arg);
        const cachedData = objectResponse?.object;
        if (!cachedData) return arg;

        return cachedData;
      })
    );
    txBlock.moveCall(queryTarget, resolvedArgs as any, typeArgs);

    return await this.callWithRateLimiter(
      keys ??
        queryKeys.rpc.getInspectTxn({
          queryTarget,
          args: args.map((arg) =>
            typeof arg === 'object' && 'objectId' in arg ? arg.objectId : arg
          ),
          typeArgs,
          node: this.currentFullNode,
        }),
      () => this.suiKit.inspectTxn(txBlock)
    );
  }
}

export default ScallopSuiKit;
