import { bcs } from '@mysten/sui/bcs';
import assert from 'assert';
import BigNumber from 'bignumber.js';
import { ScallopQuery, ScallopUtils } from 'src/models';
import { OptionalKeys, sCoinBalance } from 'src/types';

/**
 * Get total supply of sCoin
 * @param query
 * @param sCoinName
 * @returns `number`
 */
export const getSCoinTotalSupply = async (
  {
    utils,
  }: {
    utils: ScallopUtils;
  },
  sCoinName: string
): Promise<sCoinBalance> => {
  const sCoinPkgId = utils.constants.get('scoin.id');
  // get treasury
  const args = [utils.getSCoinTreasury(sCoinName)];
  const typeArgs = [
    utils.parseSCoinType(sCoinName),
    utils.parseUnderlyingSCoinType(sCoinName),
  ];
  const queryTarget = `${sCoinPkgId}::s_coin_converter::total_supply`;
  const queryResults = await utils.scallopSuiKit.queryInspectTxn({
    queryTarget,
    args,
    typeArgs,
  });
  const results = queryResults?.results;
  if (results && results[0]?.returnValues) {
    const value = Uint8Array.from(results[0].returnValues[0][0]);
    const type = results[0].returnValues[0][1]; // should be u64
    assert(type === 'u64', 'Result type is not u64');

    return BigNumber(bcs.u64().parse(value))
      .shiftedBy(utils.getCoinDecimal(utils.parseCoinName(sCoinName)))
      .toNumber();
  }

  return 0;
};

/**
 * Query all owned sCoin amount.
 *
 * @param query - The Scallop query instance.
 * @param sCoinNames - Specific an array of support sCoin name.
 * @param ownerAddress - The owner address.
 * @return All owned sCoins amount.
 */
export const getSCoinAmounts = async (
  {
    utils,
  }: {
    utils: ScallopUtils;
  },
  sCoinNames: string[] = [...utils.address.getWhitelist('scoin')],
  ownerAddress?: string
) => {
  const owner = ownerAddress || utils.suiKit.currentAddress;
  const sCoins = {} as OptionalKeys<Record<string, number>>;

  await Promise.allSettled(
    sCoinNames.map(async (sCoinName) => {
      const sCoin = await getSCoinAmount({ utils }, sCoinName, owner);
      sCoins[sCoinName] = sCoin;
    })
  );

  return sCoins;
};

/**
 * Query owned sCoin amount.
 *
 * @param query - The Scallop query instance.
 * @param sCoinNames - Specific support sCoin name.
 * @param ownerAddress - The owner address.
 * @return Owned sCoin amount.
 */
export const getSCoinAmount = async (
  {
    utils,
  }: {
    utils: ScallopUtils;
  },
  sCoinName: string,
  ownerAddress?: string
) => {
  const owner = ownerAddress || utils.suiKit.currentAddress;
  const sCoinType = utils.parseSCoinType(sCoinName);
  const coinBalance = await utils.scallopSuiKit.queryGetCoinBalance({
    owner,
    coinType: sCoinType,
  });
  return BigNumber(coinBalance?.totalBalance ?? '0').toNumber();
};

const checkAssetParams = (
  utils: ScallopUtils,
  fromSCoin: string,
  toSCoin: string
) => {
  if (fromSCoin === toSCoin)
    throw new Error('fromAsset and toAsset must be different');

  if (!utils.address.getWhitelist('scoin').has(fromSCoin))
    throw new Error('fromAsset is not supported');

  if (!utils.address.getWhitelist('scoin').has(toSCoin)) {
    throw new Error('toAsset is not supported');
  }
};

/* ==================== Get Swap Rate ==================== */

/**
 * Get swap rate from sCoin A to sCoin B.
 * @param fromSCoin
 * @param toSCoin
 * @param underlyingCoinPrice - The price of the underlying coin. For example, if fromSCoin is sSUI and toSCoin is sUSDC, then underlyingCoinPrice represents the price of 1 SUI in USDC.
 * @returns number
 */
export const getSCoinSwapRate = async (
  query: ScallopQuery,
  fromSCoin: string,
  toSCoin: string,
  underlyingCoinPrice?: number
) => {
  checkAssetParams(query.utils, fromSCoin, toSCoin);
  const fromCoinName = query.utils.parseCoinName(fromSCoin);
  const toCoinName = query.utils.parseCoinName(toSCoin);

  // Get lending data for both sCoin A and sCoin B
  const marketPools = await Promise.all([
    query.getMarketPool(fromCoinName),
    query.getMarketPool(toCoinName),
  ]);
  if (marketPools.some((pool) => !pool))
    throw new Error('Failed to fetch the lendings data');

  if (marketPools.some((pool) => pool?.conversionRate === 0)) {
    throw new Error('Conversion rate cannot be zero');
  }

  const ScoinAToARate = marketPools[0]!.conversionRate;
  const BtoSCoinBRate = 1 / marketPools[1]!.conversionRate;

  const calcAtoBRate = async () => {
    const prices = await query.utils.getCoinPrices();
    if (!prices[fromCoinName] || !prices[toCoinName]) {
      throw new Error('Failed to fetch the coin prices');
    }
    if (prices[toCoinName] === 0) {
      throw new Error('Price of toCoin cannot be zero');
    }
    return prices[fromCoinName]! / prices[toCoinName]!;
  };

  const AtoBRate = underlyingCoinPrice ?? (await calcAtoBRate());
  return BigNumber(ScoinAToARate)
    .multipliedBy(AtoBRate)
    .multipliedBy(BtoSCoinBRate)
    .toNumber();
};
