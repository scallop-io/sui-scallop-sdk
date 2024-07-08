import { bcs } from '@mysten/sui.js/bcs';
import assert from 'assert';
import BigNumber from 'bignumber.js';
import { SUPPORT_SCOIN } from 'src/constants';
import { ScallopQuery } from 'src/models';
import { OptionalKeys, SupportSCoin, sCoinBalance } from 'src/types';

/**
 * Get total supply of sCoin
 * @param query
 * @param sCoinName
 * @returns `number`
 */
export const getSCoinTotalSupply = async (
  query: ScallopQuery,
  sCoinName: SupportSCoin
): Promise<sCoinBalance> => {
  const sCoinPkgId = query.address.get('scoin.id');
  // get treasury
  const args = [query.utils.getSCoinTreasury(sCoinName)];
  const typeArgs = [
    query.utils.parseSCoinType(sCoinName),
    query.utils.parseUnderlyingSCoinType(sCoinName),
  ];
  const queryTarget = `${sCoinPkgId}::s_coin_converter::total_supply`;
  const queryResults = await query.cache.queryInspectTxn({
    queryTarget,
    args,
    typeArgs,
  });
  const results = queryResults.results;
  if (results && results[0].returnValues) {
    const value = Uint8Array.from(results[0].returnValues[0][0]);
    const type = results[0].returnValues[0][1]; // should be u64
    assert(type === 'u64', 'Result type is not u64');

    return BigNumber(bcs.de(type, value))
      .shiftedBy(
        query.utils.getCoinDecimal(query.utils.parseCoinName(sCoinName))
      )
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
  query: ScallopQuery,
  sCoinNames?: SupportSCoin[],
  ownerAddress?: string
) => {
  sCoinNames = sCoinNames || [...SUPPORT_SCOIN];
  const owner = ownerAddress || query.suiKit.currentAddress();
  const sCoins = {} as OptionalKeys<Record<SupportSCoin, number>>;

  await Promise.allSettled(
    sCoinNames.map(async (sCoinName) => {
      const sCoin = await getSCoinAmount(query, sCoinName, owner);
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
  query: ScallopQuery,
  sCoinName: SupportSCoin,
  ownerAddress?: string
) => {
  const owner = ownerAddress || query.suiKit.currentAddress();
  const sCoinType = query.utils.parseSCoinType(sCoinName);
  const amount = await query.cache.queryGetCoinBalance({
    owner,
    coinType: sCoinType,
  });
  return BigNumber(amount).toNumber();
};
