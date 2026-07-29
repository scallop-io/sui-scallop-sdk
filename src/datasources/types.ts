import { SuiClientTypes } from '@mysten/sui/client';

export const CORE_METHODS = [
  'getObjects',
  'listOwnedObjects',
  'listCoins',
  'listDynamicFields',
  'getDynamicField',
  'getBalance',
  'listBalances',
  'getCoinMetadata',
  'getTransaction',
  'getReferenceGasPrice',
  'getCurrentSystemState',
  'getProtocolConfig',
  'getChainIdentifier',
  'defaultNameServiceName',
  'getMoveFunction',
  'simulateTransaction',
] as const satisfies readonly (keyof SuiClientTypes.TransportMethods)[];

export type ClientWithCoreMethods = Pick<
  SuiClientTypes.TransportMethods,
  (typeof CORE_METHODS)[number]
>;
