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
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { graphql } from '@mysten/sui/graphql/schemas/latest';
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

// GraphQL queries
const objectQuery = graphql(`
  query getObject($objectId: SuiAddress!) {
    object(address: $objectId) {
      ... on MoveObject {
        digest
        type
        owner {
          AddressOwner
          ObjectOwner
          Shared {
            initial_shared_version
          }
          Immutable
        }
        previousTransaction
        storageRebate
        version
        fields
        hasPublicTransfer
      }
    }
  }
`);

const dynamicFieldsQuery = graphql(`
  query getDynamicFields($parentId: SuiAddress!, $first: Int, $after: String) {
    object(address: $parentId) {
      ... on MoveObject {
        dynamicFields(first: $first, after: $after) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            name {
              ... on MoveValue {
                json
              }
            }
            objectId
          }
        }
      }
    }
  }
`);

const dynamicFieldObjectQuery = graphql(`
  query getDynamicFieldObject(
    $parentId: SuiAddress!
    $nameType: String!
    $nameValue: String!
  ) {
    object(address: $parentId) {
      ... on MoveObject {
        dynamicField(name: { type: $nameType, value: $nameValue }) {
          objectId
          digest
          type
          owner {
            AddressOwner
            ObjectOwner
            Shared {
              initial_shared_version
            }
            Immutable
          }
          previousTransaction
          storageRebate
          content {
            ... on MoveObject {
              fields
              hasPublicTransfer
              version
            }
          }
        }
      }
    }
  }
`);

const ownedObjectsQuery = graphql(`
  query getOwnedObjects(
    $owner: SuiAddress!
    $first: Int
    $after: String
    $structType: String
  ) {
    address(address: $owner) {
      objects(first: $first, after: $after, filter: { type: $structType }) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          ... on MoveObject {
            address
            digest
            type
            owner {
              AddressOwner
              ObjectOwner
              Shared {
                initial_shared_version
              }
              Immutable
            }
            previousTransaction
            storageRebate
            version
            fields
            hasPublicTransfer
          }
        }
      }
    }
  }
`);

const moveFunctionExistsQuery = graphql(`
  query moveFunctionExists(
    $package: SuiAddress!
    $module: String!
    $function: String!
  ) {
    package(address: $package) {
      module(name: $module) {
        function(name: $function) {
          name
        }
      }
    }
  }
`);

const balancesQuery = graphql(`
  query getBalances($owner: SuiAddress!) {
    address(address: $owner) {
      balances(first: 1000) {
        nodes {
          coinType
          totalBalance
        }
      }
    }
  }
`);

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
  public readonly graphqlClient: SuiGraphQLClient;
  private _walletAddress: string;
  private _tokensPerSecond: number;
  private rateLimiter: RateLimiter;

  constructor(params: ScallopSuiKitParams = {}) {
    super(params);

    this.suiKit = params.suiKit ?? newSuiKit(params);
    this.graphqlClient = new SuiGraphQLClient({
      url: 'https://graphql.mainnet.sui.io/graphql',
    });
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
      async () => {
        const result = await this.graphqlClient.query({
          query: moveFunctionExistsQuery,
          variables: { package: address, module, function: name },
        });
        const fn = (result.data as any)?.package?.module?.function;
        if (fn && fn.name) {
          return { name: fn.name } as any;
        }
        return null;
      }
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
      queryKeys.rpc.getObject({
        objectId,
        options,
        node: this.currentFullNode,
      }),
      async () => {
        const result = await this.graphqlClient.query({
          query: objectQuery,
          variables: {
            objectId,
          },
        });

        const object = result.data?.object as any;
        if (!object) {
          return { data: null };
        }

        return {
          data: {
            objectId,
            version: object.version,
            digest: object.digest,
            type: object.type,
            owner: object.owner,
            previousTransaction: object.previousTransaction || '',
            storageRebate: object.storageRebate || '',
            content: {
              dataType: 'moveObject',
              type: object.type,
              hasPublicTransfer: object.hasPublicTransfer,
              fields: object.fields,
            },
          },
        } as SuiObjectResponse;
      }
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
      queryKeys.rpc.getObjects({
        objectIds,
        node: this.currentFullNode,
      }),
      async () => {
        const fetched = await Promise.all(
          objectIds.map(async (objectId) => {
            const result = await this.graphqlClient.query({
              query: objectQuery,
              variables: { objectId },
            });
            const object = result.data?.object as any;
            if (!object) return null;

            const mapped: SuiObjectData = {
              objectId,
              version: object.version || '',
              digest: object.digest || '',
              type: object.type || '',
              owner: object.owner || null,
              previousTransaction: object.previousTransaction || '',
              storageRebate: object.storageRebate || '',
              content: {
                dataType: 'moveObject',
                type: object.type || '',
                hasPublicTransfer: object.hasPublicTransfer || false,
                fields: object.fields || {},
              },
            } as SuiObjectData;
            return mapped;
          })
        );

        return fetched.filter((t): t is SuiObjectData => !!t);
      }
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
          prevData = { data: prevData };
        }
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
      async () => {
        const pageSize = input.limit ?? 50;
        const variables: any = {
          owner: input.owner,
          first: pageSize,
          after: input.cursor,
          structType: (input as any).filter?.StructType,
        };

        const result = await this.graphqlClient.query({
          query: ownedObjectsQuery,
          variables,
        });

        const conn = (result.data as any)?.address?.objects;
        if (!conn) return null;

        const data: SuiObjectResponse[] = (conn.nodes || []).map(
          (node: any) => {
            if (!node) return { data: null } as SuiObjectResponse;
            const obj: SuiObjectData = {
              objectId: node.address || '',
              version: node.version || '',
              digest: node.digest || '',
              type: node.type || '',
              owner: node.owner || null,
              previousTransaction: node.previousTransaction || '',
              storageRebate: node.storageRebate || '',
              content: {
                dataType: 'moveObject',
                type: node.type || '',
                hasPublicTransfer: node.hasPublicTransfer || false,
                fields: node.fields || {},
              },
            } as SuiObjectData;
            return { data: obj } as SuiObjectResponse;
          }
        );

        return {
          data,
          nextCursor: conn.pageInfo?.endCursor,
          hasNextPage: conn.pageInfo?.hasNextPage,
        } as any;
      }
    );

    if (results && results.data.length > 0) {
      results.data
        .filter(
          (
            result: any
          ): result is typeof result & NonNullable<{ data: SuiObjectData }> =>
            !!result.data
        )
        .forEach((result: any) => {
          // fetch previous data
          const queryKey = queryKeys.rpc.getObject({
            objectId: result.data.objectId,
            node: this.currentFullNode,
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
        });
    }
    return results;
  }

  async queryGetDynamicFields(
    input: GetDynamicFieldsParams
  ): Promise<DynamicFieldPage | null> {
    return await this.callWithRateLimiter(
      queryKeys.rpc.getDynamicFields(input),
      async () => {
        const result = await this.graphqlClient.query({
          query: dynamicFieldsQuery,
          variables: {
            parentId: input.parentId,
            first: input.limit || 50,
            after: input.cursor,
          },
        });

        const objectData = result.data?.object as any;
        const dynamicFields = objectData?.dynamicFields;
        if (!dynamicFields) {
          return null;
        }

        return {
          data: dynamicFields.nodes.map((node: any) => ({
            objectId: node.objectId,
            name: {
              type: '0x1::string::String',
              value: node.name?.json?.name || '',
            },
          })),
          nextCursor: dynamicFields.pageInfo.endCursor,
          hasNextPage: dynamicFields.pageInfo.hasNextPage,
        } as DynamicFieldPage;
      }
    );
  }

  async queryGetDynamicFieldObject(
    input: GetDynamicFieldObjectParams
  ): Promise<SuiObjectResponse | null> {
    const result = await this.callWithRateLimiter(
      queryKeys.rpc.getDynamicFieldObject(input),
      async () => {
        const result = await this.graphqlClient.query({
          query: dynamicFieldObjectQuery,
          variables: {
            parentId: input.parentId,
            nameType: input.name.type,
            nameValue: JSON.stringify(input.name.value),
          },
        });

        const objectData = result.data?.object as any;
        const dynamicField = objectData?.dynamicField;
        if (!dynamicField) {
          return { data: null };
        }

        return {
          data: {
            objectId: dynamicField.objectId || '',
            version:
              dynamicField.content?.version || dynamicField.version || '',
            digest: dynamicField.digest || '',
            type: dynamicField.type || '',
            owner: dynamicField.owner || null,
            previousTransaction: dynamicField.previousTransaction || '',
            storageRebate: dynamicField.storageRebate || '',
            content: {
              dataType: 'moveObject',
              type: dynamicField.type || '',
              hasPublicTransfer:
                dynamicField.content?.hasPublicTransfer ||
                dynamicField.hasPublicTransfer ||
                false,
              fields: dynamicField.content?.fields || dynamicField.fields || {},
            },
          },
        } as SuiObjectResponse;
      }
    );

    if (result?.data) {
      const queryKey = queryKeys.rpc.getObject({
        objectId: result.data.objectId,
        node: this.currentFullNode,
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
        const result = await this.graphqlClient.query({
          query: balancesQuery,
          variables: { owner },
        });
        const nodes: any[] =
          (result.data as any)?.address?.balances?.nodes ?? [];
        const balances = nodes.reduce(
          (acc, node) => {
            if (!node || node.totalBalance === '0') return acc;
            const entry: CoinBalance = {
              coinType: node.coinType,
              coinObjectCount: 0 as any,
              totalBalance: String(node.totalBalance),
              lockedBalance: undefined as any,
            } as unknown as CoinBalance;
            acc[normalizeStructTag(node.coinType)] = entry;
            return acc;
          },
          {} as { [k: string]: CoinBalance }
        );

        return balances;
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
      queryKeys.rpc.getInspectTxn({
        queryTarget,
        args,
        typeArgs,
        node: this.currentFullNode,
      }),
      () => this.suiKit.inspectTxn(txBlock)
    );
  }
}

export default ScallopSuiKit;
