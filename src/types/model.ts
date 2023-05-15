import type { SuiKitParams, NetworkType } from '@scallop-io/sui-kit';

export type ScallopParams = {} & SuiKitParams;
export type ScallopAddressParams = {
  id: string;
  auth?: string;
  network?: NetworkType;
};
