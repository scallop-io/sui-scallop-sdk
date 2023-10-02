import BigNumber from 'bignumber.js';
import { SUPPORT_POOLS, SUPPORT_SPOOLS } from '../constants';
import type { ScallopQuery } from '../models';
import type {
  SupportPoolCoins,
  MarketPool,
  Spool,
  StakeAccount,
  Lendings,
  Lending,
  SupportStakeMarketCoins,
} from '../types';

/**
 * Get user lending infomation for specific pools.
 *
 * @param query - The ScallopQuery instance.
 * @param coinNames - Specific an array of support coin name.
 * @param ownerAddress - The owner address.
 * @return User lending infomation for specific pools.
 */
export const getLendings = async (
  query: ScallopQuery,
  coinNames?: SupportPoolCoins[],
  ownerAddress?: string
) => {
  coinNames = coinNames || [...SUPPORT_POOLS];
  const marketCoinNames = coinNames
    ?.map((coinName) => `s${coinName}`)
    .filter((marketCoinName) =>
      [...SUPPORT_SPOOLS].includes(marketCoinName as any)
    ) as SupportStakeMarketCoins[];

  const marketPools = await query.getMarketPools(coinNames);
  const sPools = await query.getSpools(marketCoinNames);
  const coinAmounts = await query.getCoinAmounts(coinNames, ownerAddress);
  const marketCoinAmounts = await query.getMarketCoinAmounts(
    marketCoinNames,
    ownerAddress
  );
  const allStakeAccounts = await query.getAllStakeAccounts(ownerAddress);
  const coinPrices = await query.utils.getCoinPrices(coinNames);

  const lendings: Lendings = {};
  for (const coinName of coinNames) {
    const marketCoinName = marketCoinNames.find(
      (marketCoinName) => marketCoinName === `s${coinName}`
    );
    lendings[coinName] = await getLending(
      query,
      coinName,
      ownerAddress,
      marketPools?.[coinName],
      marketCoinName ? sPools[marketCoinName] : undefined,
      marketCoinName ? allStakeAccounts[marketCoinName] : undefined,
      coinAmounts?.[coinName],
      marketCoinAmounts?.[coinName],
      coinPrices?.[coinName] ?? 0
    );
  }

  return lendings;
};

/**
 * Get user lending infomation for specific pool.
 *
 * @description
 * The lending information includes the spool information extended by it.
 *
 * @param query - The ScallopQuery instance.
 * @param coinName - Specific support coin name.
 * @param ownerAddress - The owner address.
 * @param marketPool - The market pool data.
 * @param spool - The spool data.
 * @param stakeAccounts - The stake accounts data.
 * @param coinAmount - The coin amount.
 * @param marketCoinAmount - The market coin amount.
 * @return User lending infomation for specific pool.
 */
export const getLending = async (
  query: ScallopQuery,
  coinName: SupportPoolCoins,
  ownerAddress?: string,
  marketPool?: MarketPool,
  spool?: Spool,
  stakeAccounts?: StakeAccount[],
  coinAmount?: number,
  marketCoinAmount?: number,
  coinPrice?: number
) => {
  const marketCoinName = `s${coinName}` as any;
  marketPool = marketPool || (await query.getMarketPool(coinName));
  spool =
    spool || [...SUPPORT_SPOOLS].includes(marketCoinName as any)
      ? await query.getSpool(marketCoinName)
      : undefined;
  stakeAccounts =
    stakeAccounts ||
    (await query.getStakeAccounts(marketCoinName, ownerAddress));
  coinAmount =
    coinAmount || (await query.getCoinAmount(coinName, ownerAddress));
  marketCoinAmount =
    marketCoinAmount ||
    (await query.getMarketCoinAmount(marketCoinName, ownerAddress));
  coinPrice =
    coinPrice || (await query.utils.getCoinPrices([coinName]))?.[coinName];
  const coinDecimal = query.utils.getCoinDecimal(coinName);

  // Handle staked scoin
  let stakedMarketCoin = BigNumber(0);
  let stakedCoin = BigNumber(0);
  let stakedValue = BigNumber(0);
  let availableUnstakeAmount = BigNumber(0);
  let availableClaimAmount = BigNumber(0);

  if (spool) {
    for (const stakeAccount of stakeAccounts) {
      const accountStakedMarketCoin = BigNumber(stakeAccount.staked).shiftedBy(
        -1 * spool.coinDecimal
      );
      const accountStakedCoin = accountStakedMarketCoin.multipliedBy(
        marketPool?.conversionRate ?? 1
      );

      stakedMarketCoin = stakedMarketCoin.plus(accountStakedMarketCoin);
      stakedCoin = stakedCoin.plus(accountStakedCoin);
      stakedValue = stakedValue.plus(
        BigNumber(accountStakedCoin).multipliedBy(spool.coinPrice)
      );
      availableUnstakeAmount = availableUnstakeAmount.plus(stakeAccount.staked);

      const baseIndexRate = 1_000_000_000;
      const increasedPointRate = spool?.currentPointIndex
        ? BigNumber(spool.currentPointIndex - stakeAccount.index).dividedBy(
            baseIndexRate
          )
        : 1;
      availableClaimAmount = availableClaimAmount.plus(
        BigNumber(stakeAccount.staked)
          .multipliedBy(increasedPointRate)
          .plus(stakeAccount.points)
          .multipliedBy(spool.exchangeRateNumerator)
          .dividedBy(spool.exchangeRateDenominator)
      );
    }
  }

  // Handle supplied coin
  const suppliedCoin = BigNumber(marketCoinAmount)
    .multipliedBy(marketPool?.conversionRate ?? 1)
    .shiftedBy(-1 * coinDecimal);
  const suppliedValue = suppliedCoin.multipliedBy(coinPrice ?? 0);

  const lending: Lending = {
    coin: coinName,
    symbol: query.utils.parseSymbol(coinName),
    coinType: query.utils.parseCoinType(coinName),
    marketCoinType: query.utils.parseMarketCoinType(coinName),
    coinDecimal: coinDecimal,
    coinPrice: coinPrice ?? 0,
    supplyApr: marketPool?.supplyApr ?? 0,
    supplyApy: marketPool?.supplyApy ?? 0,
    rewardApr: spool?.stakeApr ?? 0,
    suppliedCoin: suppliedCoin.plus(stakedCoin).toNumber(),
    suppliedValue: suppliedValue.plus(stakedValue).toNumber(),
    stakedMarketCoin: stakedMarketCoin.toNumber(),
    stakedCoin: stakedCoin.toNumber(),
    stakedValue: stakedValue.toNumber(),
    avaliableSupplyAmount: coinAmount,
    avaliableWithdrawAmount: 0,
    avaliableStakeAmount: marketCoinAmount,
    availableUnstakeAmount: availableUnstakeAmount.toNumber(),
    availableClaimAmount: availableClaimAmount.toNumber(),
  };

  return lending;
};
