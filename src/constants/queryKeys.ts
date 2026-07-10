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
    getCoinBalancesByTypes: (props?: QueryKeys.RPC.GetCoinBalancesByTypes) => [
      'rpc',
      'getCoinBalancesByTypes',
      props,
    ],
  },
  oracle: {
    // Keyed on the full, sorted feed-id universe (not the requested subset), so
    // every single/subset price read hits the same cache entry. A constants
    // change that alters the feed set self-busts the cache.
    getPythAllPriceFeeds: (endpoint?: string, sortedFeedIds?: string[]) => [
      'oracle',
      'getPythAllPriceFeeds',
      sortedFeedIds,
      endpoint,
    ],
  },
};
