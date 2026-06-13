import { QueryKeys } from 'src/types/constant/queryKeys.js';

export const queryKeys = {
  api: {
    getAddresses: (props?: QueryKeys.API.GetAddresses) => [
      'api',
      'getAddresses',
      props,
    ],
    getWhiteList: () => ['api', 'getWhiteList'],
    getPoolAddresses: () => ['api', 'getPoolAddresses'],
    getMarkets: () => ['api', 'getMarkets'],
    getSpools: () => ['api', 'getSpools'],
    getBorrowIncentivePools: () => ['api', 'getBorrowIncentivePools'],
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
    getSharedObject: (props?: QueryKeys.RPC.GetSharedObject) => [
      'rpc',
      'getSharedObject',
      props,
    ],
    getOwnedObjects: (props?: QueryKeys.RPC.GetOwnedObjects) => [
      'rpc',
      'getOwnedObjects',
      props,
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
        veScaAmountArgs: props?.veScaAmountArgs
          ? JSON.stringify(props?.veScaAmountArgs)
          : undefined,
      },
    ],

    getCoinBalance: (props?: QueryKeys.RPC.GetCoinBalance) => [
      'rpc',
      'getCoinBalance',
      props,
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
    getPythLatestPriceFeeds: (endpoint?: string, priceIds?: string[]) => [
      'oracle',
      'getPythPriceIds',
      priceIds,
      endpoint,
    ],
    getCoinPrices: (priceIds: string[]) => [
      'oracle',
      'getCoinPrices',
      priceIds,
    ],
  },
};
