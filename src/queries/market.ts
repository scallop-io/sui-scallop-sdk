import { SuiKit, SuiTxBlock } from '@scallop-io/sui-kit';
import { ScallopAddress } from '../models';
import { MarketInterface } from '../types';

export const queryMarket = async (
  scallopAddress: ScallopAddress,
  suiKit: SuiKit
) => {
  const packageId = scallopAddress.get('core.packages.query.id');
  const marketId = scallopAddress.get('core.market');
  const txBlock = new SuiTxBlock();
  const queryTarget = `${packageId}::market_query::market_data`;
  txBlock.moveCall(queryTarget, [marketId]);
  const queryResult = await suiKit.inspectTxn(txBlock);
  return queryResult.events[0].parsedJson as MarketInterface;
};
