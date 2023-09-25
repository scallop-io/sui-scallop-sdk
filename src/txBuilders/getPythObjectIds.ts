import { SuiPythClient } from '@pythnetwork/pyth-sui-js';
import { JsonRpcProvider, mainnetConnection } from '@mysten/sui.js';

export async function getPythObjectId(priceId: string) {
  const pythStateId =
    '0x1f9310238ee9298fb703c3419030b35b22bb1cc37113e3bb5007c99aec79e5b8';
  const wormholeStateId =
    '0xaeab97f96cf9877fee2883315d459552b2b921edc16d7ceac6eab944dd88919c';
  const provider = new JsonRpcProvider(mainnetConnection);
  const pythClient = new SuiPythClient(provider, pythStateId, wormholeStateId);

  const priceInfoObjectId = await pythClient.getPriceFeedObjectId(priceId);
  return priceInfoObjectId;
}
