import { QueryKeys } from 'src/types/constant/queryKeys';

export const queryKeys = {
  api: {
    getAddresses: (props?: QueryKeys.API.GetAddresses) => [
      'api',
      'getAddresses',
      props,
    ],
    getWhiteList: () => ['api', 'getWhiteList'],
    getPoolAddresses: () => ['api', 'getPoolAddresses'],
    getMarket: () => ['api', 'getMarket'],
    getSpools: () => ['api', 'getSpools'],
    getBorrowIncentivePool: () => ['api', 'getBorrowIncentivePools'],
    getTotalValueLocked: () => ['api', 'getTotalValueLocked'],
  },

  rpc: {
    getInspectTxn: (props?: QueryKeys.RPC.GetInspectTxn) => [
      'rpc',
      'getInspectTxn',
      props,
    ],
    getObject: (props?: QueryKeys.RPC.GetObject) => ['rpc', 'getObject', props],
    getObjects: (props?: QueryKeys.RPC.GetObjects) => [
      'rpc',
      'getObjects',
      props,
    ],
    getOwnedObjects: (props?: QueryKeys.RPC.GetOwnedObjects) => [
      'rpc',
      'getOwnedObjects',
      {
        ...props,
        filter: JSON.stringify(props?.filter ?? undefined),
      },
    ],
    getDynamicFields: (props?: QueryKeys.RPC.GetDynamicFields) => [
      'rpc',
      'getDynamicFields',
      props,
    ],
    getDynamicFieldObject: (props?: QueryKeys.RPC.GetDynamicFieldObject) => [
      'rpc',
      'getDynamicFieldObject',
      props,
    ],
    getTotalVeScaTreasuryAmount: (
      props?: QueryKeys.RPC.getTotalVeScaTreasuryAmount
    ) => [
      'rpc',
      'getTotalVeScaTreasuryAmount',
      {
        ...props,
        refreshArgs: props?.refreshArgs
          ? JSON.stringify(props?.refreshArgs)
          : undefined,
        vescaAmountArgs: props?.vescaAmountArgs
          ? JSON.stringify(props?.vescaAmountArgs)
          : undefined,
      },
    ],

    getAllCoinBalances: (props?: QueryKeys.RPC.GetAllCoinBalances) => [
      'rpc',
      'getAllCoinBalances',
      props,
    ],

    getNormalizedMoveFunction: (
      props?: QueryKeys.RPC.GetNormalizedMoveFunction
    ) => {
      return ['rpc', 'getNormalizedMoveCall', props];
    },
  },
  oracle: {
    getPythLatestPriceFeeds: () => ['oracle', 'getPythPriceIds'],
  },
};
