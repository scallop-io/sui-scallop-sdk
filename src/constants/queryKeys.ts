import type {
  GetDynamicFieldObjectParams,
  GetDynamicFieldsParams,
  GetOwnedObjectsParams,
  SuiObjectData,
  SuiObjectDataOptions,
} from '@mysten/sui.js/src/client';
import type { SuiTxArg } from '@scallop-io/sui-kit';

export const queryKeys = {
  api: {
    getAddresses: (addressesId?: string) => [
      'api',
      'getAddresses',
      { addressesId },
    ],
    getMarket: () => ['api', 'getMarket'],
    getSpools: () => ['api', 'getSpools'],
    getBorrowIncentivePool: () => ['api', 'getBorrowIncentivePools'],
    getTotalValueLocked: () => ['api', 'getTotalValueLocked'],
  },

  rpc: {
    getProtocolConfig: () => ['rpc', 'getProtocolConfig'],
    getInspectTxn: (
      queryTarget?: string,
      args?: SuiTxArg[],
      typeArgs?: any[]
    ) => [
      'rpc',
      'getInspectTxn',
      {
        queryTarget,
        args: JSON.stringify(args),
        typeArgs: !typeArgs ? undefined : JSON.stringify(typeArgs),
      },
    ],
    getObject: (
      objectId?: string,
      walletAddress?: string,
      options?: SuiObjectDataOptions
    ) => ['rpc', 'getObject', { walletAddress, options, objectId }],
    getObjects: (
      objectIds?: string[],
      walletAddress?: string,
      options?: SuiObjectDataOptions
    ) => [
      'rpc',
      'getObjects',
      {
        walletAddress,
        options,
        objectIds: JSON.stringify((objectIds ?? []).toSorted()),
      },
    ],
    getOwnedObjects: (input: Partial<GetOwnedObjectsParams>) => [
      'rpc',
      'getOwnedObjects',
      {
        walletAddress: input.owner,
        cursor: input.cursor ?? undefined,
        options: input.options ?? undefined,
        filter: JSON.stringify(input.filter ?? undefined),
        limit: input.limit ?? undefined,
      },
    ],
    getDynamicFields: (input: Partial<GetDynamicFieldsParams>) => [
      'rpc',
      'getDynamicFields',
      {
        parentId: input.parentId,
        cursor: input.cursor ?? undefined,
        limit: input.limit ?? undefined,
      },
    ],
    getDynamicFieldObject: (input: Partial<GetDynamicFieldObjectParams>) => [
      'rpc',
      'getDynamicFieldObject',
      {
        parentId: input.parentId,
        name: {
          type: input?.name?.type,
          value: input?.name?.value,
        },
      },
    ],
    getTotalVeScaTreasuryAmount: (
      refreshArgs?: any[],
      vescaAmountArgs?: (string | SuiObjectData)[]
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
  },
  pyth: {
    getPythLatestPriceFeed: (pythPriceId?: string) => [
      'pyth',
      'getPythPriceId',
      { pythPriceId },
    ],
  },
};
