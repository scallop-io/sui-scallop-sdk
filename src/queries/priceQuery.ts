import BigNumber from 'bignumber.js';
import type { ScallopQuery } from 'src/models';
import type { CoinPrices, MarketPools, OptionalKeys } from '../types';

export const getAllCoinPrices = async (
  query: ScallopQuery,
  marketPools?: MarketPools,
  coinPrices?: CoinPrices,
  indexer: boolean = false
) => {
  coinPrices =
    coinPrices ??
    (indexer
      ? await query.getCoinPricesByIndexer()
      : await query.utils.getCoinPrices());

  marketPools =
    marketPools ??
    (await query.getMarketPools(undefined, { coinPrices, indexer })).pools;

  if (!marketPools) {
    throw new Error(`Failed to fetch market pool for getAllCoinPrices`);
  }

  const sCoinPrices: OptionalKeys<Record<string, number>> = {};
  query.constants.whitelist.scoin.forEach((sCoinName) => {
    const coinName = query.utils.parseCoinName(sCoinName);
    sCoinPrices[sCoinName] = BigNumber(coinPrices[coinName] ?? 0)
      .multipliedBy(marketPools[coinName]?.conversionRate ?? 1)
      .toNumber();
  });

  return {
    ...coinPrices,
    ...sCoinPrices,
  };
};
