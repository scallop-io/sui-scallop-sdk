import { SuiTxBlock } from '@scallop-io/sui-kit';
import { ScallopAddress, ScallopUtils } from '../models';
import { SupportCoins } from '../types';

export const selectCoin = async (
  txBlock: SuiTxBlock,
  scallopAddress: ScallopAddress,
  scallopUtils: ScallopUtils,
  coinName: SupportCoins,
  amount: number,
  sender: string
) => {
  const coinPackageId = scallopAddress.get(`core.coins.${coinName}.id`);
  const coinType = scallopUtils.parseCoinType(coinPackageId, coinName);
  const coins = await scallopUtils.selectCoins(sender, amount, coinType);
  const [takeCoin, leftCoin] = txBlock.takeAmountFromCoins(coins, amount);
  return { takeCoin, leftCoin };
};

export const selectMarketCoin = async (
  txBlock: SuiTxBlock,
  scallopAddress: ScallopAddress,
  scallopUtils: ScallopUtils,
  coinName: SupportCoins,
  amount: number,
  sender: string
) => {
  const coinPackageId = scallopAddress.get(`core.coins.${coinName}.id`);
  const protocolPackageId = scallopAddress.get('core.packages.protocol.id');
  const coinType = scallopUtils.parseMarketCoinType(
    coinPackageId,
    protocolPackageId,
    coinName
  );
  const coins = await scallopUtils.selectCoins(sender, amount, coinType);
  const [takeCoin, leftCoin] = txBlock.takeAmountFromCoins(coins, amount);
  return { takeCoin, leftCoin };
};
