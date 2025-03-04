import type {
  GetDynamicFieldObjectParams,
  GetDynamicFieldsParams,
  GetOwnedObjectsParams,
  SuiObjectData,
  SuiObjectDataOptions,
} from '@mysten/sui/client';
import type { SuiTxArg } from '@scallop-io/sui-kit';

export const queryKeys = {
  api: {
    getAddresses: (addressId?: string) => [
      'api',
      'getAddresses',
      { addressId },
    ],
    getMarket: () => ['api', 'getMarket'],
    getSpools: () => ['api', 'getSpools'],
    getBorrowIncentivePool: () => ['api', 'getBorrowIncentivePools'],
    getTotalValueLocked: () => ['api', 'getTotalValueLocked'],
  },

  rpc: {
    getInspectTxn: (queryTarget?: string, key?: string) => [
      'rpc',
      'getInspectTxn',
      {
        queryTarget,
        key,
      },
    ],
    getObject: (objectId?: string, options?: SuiObjectDataOptions) => [
      'rpc',
      'getObject',
      { objectId, options },
    ],
    getObjects: (objectIds?: string[]) => [
      'rpc',
      'getObjects',
      {
        objectIds: JSON.stringify(objectIds ?? undefined),
      },
    ],
    getOwnedObjects: (input?: Partial<GetOwnedObjectsParams>) => [
      'rpc',
      'getOwnedObjects',
      {
        walletAddress: input?.owner,
        cursor: input?.cursor ?? undefined,
        options: input?.options ?? undefined,
        filter: JSON.stringify(input?.filter ?? undefined),
        limit: input?.limit ?? undefined,
      },
    ],
    getDynamicFields: (input?: Partial<GetDynamicFieldsParams>) => [
      'rpc',
      'getDynamicFields',
      {
        parentId: input?.parentId,
        cursor: input?.cursor ?? undefined,
        limit: input?.limit ?? undefined,
      },
    ],
    getDynamicFieldObject: (input?: Partial<GetDynamicFieldObjectParams>) => [
      'rpc',
      'getDynamicFieldObject',
      {
        parentId: input?.parentId,
        name: JSON.stringify(input?.name ?? undefined),
      },
    ],
    getTotalVeScaTreasuryAmount: (
      refreshArgs?: any[],
      vescaAmountArgs?: (string | SuiObjectData | SuiTxArg)[]
    ) => [
      'rpc',
      'getTotalVeScaTreasuryAmount',
      {
        refreshArgs: JSON.stringify(refreshArgs),
        vescaAmountArgs: JSON.stringify(vescaAmountArgs),
      },
    ],

    getAllCoinBalances: (owner?: string) => [
      'rpc',
      'getAllCoinBalances',
      { owner },
    ],

    getNormalizedMoveFunction: (target?: string) => {
      return ['rpc', 'getNormalizedMoveCall', target];
    },
  },
  oracle: {
    getPythLatestPriceFeeds: () => ['oracle', 'getPythPriceIds'],
  },
};
