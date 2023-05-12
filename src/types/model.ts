import type { SuiKitParams, NetworkType } from '@scallop-io/sui-kit';

export type ScallopParams = { suiConfig?: SuiKitParams };
export type TxBuilderParams = { suiConfig?: SuiKitParams } | undefined;
export type AddressBuilderParams =
  | { id?: string; auth?: string; network?: NetworkType }
  | undefined;
