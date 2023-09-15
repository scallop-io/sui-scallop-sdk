import { SuiTxBlock, SuiKit } from '@scallop-io/sui-kit';
// import { fromB64 } from '@mysten/sui.js';
import {
  // SuiPriceServiceConnection,
  SuiPythClient,
} from '@pythnetwork/pyth-sui-js';
import { PriceServiceConnection } from '@pythnetwork/price-service-client';
import { ScallopAddress } from '../models';
import { SupportCoins } from '../types';

export async function pythOraclePriceUpdate(
  tx: SuiTxBlock,
  address: ScallopAddress,
  suiKit: SuiKit,
  coinNames: SupportCoins[]
) {
  const priceIds = coinNames.map((coinName) =>
    address.get(`core.coins.${coinName}.oracle.pyth.feed`)
  );
  console.log(priceIds);
  const pythStateId = address.get('core.oracles.pyth.state');
  const wormholeStateId = address.get('core.oracles.pyth.wormholeState');
  const pythClient = new SuiPythClient(
    suiKit.provider(),
    pythStateId,
    wormholeStateId
  );

  // const pythConnection = new SuiPriceServiceConnection(
  //   'https://hermes-beta.pyth.network'
  // );
  // const priceUpdateData = await pythConnection.getPriceFeedsUpdateData(
  //   priceIds
  // );
  const connection = new PriceServiceConnection(
    'https://xc-mainnet.pyth.network',
    {
      priceFeedRequestConfig: {
        binary: true,
      },
    }
  );
  const priceUpdateData = await connection.getLatestVaas(priceIds);
  console.log(priceUpdateData);
  const priceUpdateDataBuffer = priceUpdateData.map((data) =>
    Buffer.from(data)
  );

  const priceInfoObjectIds = await pythClient.updatePriceFeeds(
    tx.txBlock,
    priceUpdateDataBuffer,
    priceIds
  );
  return priceInfoObjectIds;
}
