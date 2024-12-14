import { SuiKit, SuiKitParams } from '@scallop-io/sui-kit';
import { RPC_PROVIDERS } from 'src/constants/rpc';

export const newSuiKit = (params: SuiKitParams) => {
  return new SuiKit({
    ...params,
    fullnodeUrls: Array.from(
      new Set([...(params.fullnodeUrls ?? []), ...RPC_PROVIDERS])
    ),
  });
};
