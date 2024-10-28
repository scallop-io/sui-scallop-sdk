import type {
  SuiObjectData,
  SuiObjectDataOptions,
} from '@mysten/sui.js/src/client';
import type { SuiTxArg } from '@scallop-io/sui-kit';

export const queryKeys = {
  getAddresses: (addressesId: string) => ['api', 'getAddresses', addressesId],
  getProtocolConfig: () => ['rpc', 'getProtocolConfig'],
  getInspectTxn: (
    queryTarget: string,
    args: SuiTxArg[],
    typeArgs: any[] | undefined
  ) => [
    'rpc',
    'getInspectTxn',
    queryTarget,
    JSON.stringify(args),
    !typeArgs ? undefined : JSON.stringify(typeArgs),
  ],
  getObjects: (
    objectIds: string[],
    walletAddress: string,
    options: SuiObjectDataOptions
  ) => [
    'rpc',
    'getObjects',
    JSON.stringify(objectIds),
    { walletAddress, options },
  ],
  getTotalVeScaTreasuryAmount: (
    refreshArgs: any[],
    vescaAmountArgs: (string | SuiObjectData)[]
  ) => [
    'rpc',
    'getTotalVeScaTreasuryAmount',
    JSON.stringify(refreshArgs),
    JSON.stringify(vescaAmountArgs),
  ],
  getMarket: () => ['api', 'getMarket'],
  getSpools: () => ['api', 'getSpools'],
  getBorrowIncentivePool: () => ['api', 'getBorrowIncentivePools'],
  getTotalValueLocked: () => ['api', 'getTotalValueLocked'],
  getPythLatestPriceFeed: (pythPriceId: string) => [
    'pyth',
    'getPythPriceId',
    pythPriceId,
  ],
};
