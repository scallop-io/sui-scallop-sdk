import type { SuiKitParams, NetworkType } from '@scallop-io/sui-kit';

export type ScallopParams = {} & SuiKitParams;
export type TxBuilderParams = { suiConfig?: SuiKitParams } | undefined;
export type AddressParams =
  | { id?: string; auth?: string; network?: NetworkType }
  | undefined;
