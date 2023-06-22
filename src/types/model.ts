import type {
  SuiTransactionBlockResponse,
  TransactionBlock,
} from '@mysten/sui.js';
import type { SuiKitParams, NetworkType } from '@scallop-io/sui-kit';

export type ScallopClientFnReturnType<T extends boolean> = T extends true
  ? SuiTransactionBlockResponse
  : TransactionBlock;
export type ScallopParams = {} & SuiKitParams;
export type ScallopAddressParams = {
  id: string;
  auth?: string;
  network?: NetworkType;
};
