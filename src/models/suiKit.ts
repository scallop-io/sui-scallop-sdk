import { SuiKit, SuiKitParams } from '@scallop-io/sui-kit';
import { RPC_PROVIDERS } from 'src/constants/rpc';

export const newSuiKit = (params: Partial<SuiKitParams>) => {
  let initParams;
  if (
    'suiClients' in params &&
    params.suiClients &&
    params.suiClients?.length > 0
  ) {
    initParams = {
      suiClients: params.suiClients,
    };
  } else {
    initParams = {
      fullnodeUrls:
        'fullnodeUrls' in params && params.fullnodeUrls
          ? Array.from(new Set([...params.fullnodeUrls, ...RPC_PROVIDERS]))
          : RPC_PROVIDERS,
    };
  }
  return new SuiKit({
    ...params,
    ...initParams,
  });
};
