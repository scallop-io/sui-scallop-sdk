import { normalizeStructTag } from '@mysten/sui/utils';
import { BigNumber } from 'bignumber.js';
import { ScallopParseError } from 'src/errors/index.js';
import type {
  CalculatedMarketCollateralData,
  CalculatedMarketPoolData,
  MarketRepoMetadata,
  OriginMarketCollateralData,
  OriginMarketPoolData,
  ParsedMarketCollateralData,
  ParsedMarketPoolData,
  TotalValueLocked,
  TvlMarketInput,
} from './types.js';

export const filterRecords = <T extends { coinName: string }>(
  records: Record<string, T | undefined>,
  coinNames?: string[]
) => {
  if (!coinNames) return records;
  return coinNames.reduce(
    (acc, coinName) => {
      acc[coinName] = records[coinName];
      return acc;
    },
    {} as Record<string, T | undefined>
  );
};

export const parseOriginMarketPoolData = (
  originMarketPoolData: OriginMarketPoolData
): ParsedMarketPoolData => ({
  coinType: normalizeStructTag(originMarketPoolData.type),
  maxBorrowRate: Number(originMarketPoolData.maxBorrowRate.value) / 2 ** 32,
  borrowRate: Number(originMarketPoolData.interestRate.value) / 2 ** 32,
  borrowRateScale: Number(originMarketPoolData.interestRateScale),
  borrowIndex: Number(originMarketPoolData.borrowIndex),
  lastUpdated: Number(originMarketPoolData.lastUpdated),
  cashAmount: Number(originMarketPoolData.cash),
  debtAmount: Number(originMarketPoolData.debt),
  marketCoinSupplyAmount: Number(originMarketPoolData.marketCoinSupply),
  reserveAmount: Number(originMarketPoolData.reserve),
  reserveFactor: Number(originMarketPoolData.reserveFactor.value) / 2 ** 32,
  borrowWeight: Number(originMarketPoolData.borrowWeight.value) / 2 ** 32,
  borrowFee: Number(originMarketPoolData.borrowFeeRate.value) / 2 ** 32,
  baseBorrowRate:
    Number(originMarketPoolData.baseBorrowRatePerSec.value) / 2 ** 32,
  borrowRateOnHighKink:
    Number(originMarketPoolData.borrowRateOnHighKink.value) / 2 ** 32,
  borrowRateOnMidKink:
    Number(originMarketPoolData.borrowRateOnMidKink.value) / 2 ** 32,
  highKink: Number(originMarketPoolData.highKink.value) / 2 ** 32,
  midKink: Number(originMarketPoolData.midKink.value) / 2 ** 32,
  minBorrowAmount: Number(originMarketPoolData.minBorrowAmount),
  isIsolated: originMarketPoolData.isIsolated,
  supplyLimit: Number(originMarketPoolData.supplyLimit),
  borrowLimit: Number(originMarketPoolData.borrowLimit),
});

export const calculateMarketPoolData = (
  metadata: Pick<
    MarketRepoMetadata,
    'parseCoinNameFromType' | 'getCoinDecimal' | 'parseAprToApy'
  >,
  parsedMarketPoolData: ParsedMarketPoolData
): CalculatedMarketPoolData => {
  const poolCoinName = metadata.parseCoinNameFromType(
    parsedMarketPoolData.coinType
  );
  const coinDecimal = metadata.getCoinDecimal(poolCoinName);
  if (coinDecimal === undefined) {
    throw new ScallopParseError(`Coin decimal not found for ${poolCoinName}`, {
      context: { coinName: poolCoinName },
    });
  }

  const borrowYearFactor = 24 * 365 * 3600;
  const baseBorrowApr =
    (parsedMarketPoolData.baseBorrowRate * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;
  const borrowAprOnHighKink =
    (parsedMarketPoolData.borrowRateOnHighKink * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;
  const borrowAprOnMidKink =
    (parsedMarketPoolData.borrowRateOnMidKink * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;
  const maxBorrowApr =
    (parsedMarketPoolData.maxBorrowRate * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;
  const borrowApr =
    (parsedMarketPoolData.borrowRate * borrowYearFactor) /
    parsedMarketPoolData.borrowRateScale;

  const timeDelta =
    Math.floor(new Date().getTime() / 1000) - parsedMarketPoolData.lastUpdated;
  const borrowIndexDelta = BigNumber(parsedMarketPoolData.borrowIndex)
    .multipliedBy(
      BigNumber(timeDelta).multipliedBy(parsedMarketPoolData.borrowRate)
    )
    .dividedBy(parsedMarketPoolData.borrowRateScale);
  const currentBorrowIndex = BigNumber(parsedMarketPoolData.borrowIndex).plus(
    borrowIndexDelta
  );
  const growthInterest = BigNumber(currentBorrowIndex)
    .dividedBy(parsedMarketPoolData.borrowIndex)
    .minus(1);
  const increasedDebtAmount = BigNumber(
    parsedMarketPoolData.debtAmount
  ).multipliedBy(growthInterest);
  const borrowAmount = increasedDebtAmount.plus(
    parsedMarketPoolData.debtAmount
  );
  const borrowCoin = borrowAmount.shiftedBy(-coinDecimal);
  const reserveAmount = BigNumber(parsedMarketPoolData.reserveAmount).plus(
    increasedDebtAmount.multipliedBy(parsedMarketPoolData.reserveFactor)
  );
  const reserveCoin = reserveAmount.shiftedBy(-coinDecimal);
  const supplyAmount = BigNumber(borrowAmount).plus(
    Math.max(parsedMarketPoolData.cashAmount - reserveAmount.toNumber(), 0)
  );
  const supplyCoin = supplyAmount.shiftedBy(-coinDecimal);
  let utilizationRate = BigNumber(borrowAmount).dividedBy(supplyAmount);
  utilizationRate = utilizationRate.isFinite() ? utilizationRate : BigNumber(0);
  let supplyApr = BigNumber(borrowApr)
    .multipliedBy(utilizationRate)
    .multipliedBy(1 - parsedMarketPoolData.reserveFactor);
  supplyApr = supplyApr.isFinite() ? supplyApr : BigNumber(0);
  let conversionRate = supplyAmount.dividedBy(
    parsedMarketPoolData.marketCoinSupplyAmount
  );
  conversionRate =
    conversionRate.isFinite() && !conversionRate.isNaN()
      ? conversionRate
      : BigNumber(1);

  return {
    baseBorrowApr,
    baseBorrowApy: metadata.parseAprToApy(baseBorrowApr),
    borrowAprOnHighKink,
    borrowApyOnHighKink: metadata.parseAprToApy(borrowAprOnHighKink),
    borrowAprOnMidKink,
    borrowApyOnMidKink: metadata.parseAprToApy(borrowAprOnMidKink),
    coinDecimal,
    maxBorrowApr,
    maxBorrowApy: metadata.parseAprToApy(maxBorrowApr),
    borrowApr: Math.min(borrowApr, maxBorrowApr),
    borrowApy: Math.min(
      metadata.parseAprToApy(borrowApr),
      metadata.parseAprToApy(maxBorrowApr)
    ),
    borrowIndex: currentBorrowIndex.toNumber(),
    growthInterest: growthInterest.toNumber(),
    supplyAmount: supplyAmount.toNumber(),
    supplyCoin: supplyCoin.toNumber(),
    borrowAmount: borrowAmount.toNumber(),
    borrowCoin: borrowCoin.toNumber(),
    reserveAmount: reserveAmount.toNumber(),
    reserveCoin: reserveCoin.toNumber(),
    utilizationRate: utilizationRate.toNumber(),
    supplyApr: supplyApr.toNumber(),
    supplyApy: metadata.parseAprToApy(supplyApr.toNumber()),
    conversionRate: conversionRate.toNumber(),
    isIsolated: parsedMarketPoolData.isIsolated,
    maxSupplyCoin: BigNumber(parsedMarketPoolData.supplyLimit)
      .shiftedBy(-coinDecimal)
      .toNumber(),
    maxBorrowCoin: BigNumber(parsedMarketPoolData.borrowLimit)
      .shiftedBy(-coinDecimal)
      .toNumber(),
  };
};

export const parseOriginMarketCollateralData = (
  originMarketCollateralData: OriginMarketCollateralData
): ParsedMarketCollateralData => {
  const divisor = 2 ** 32;
  return {
    coinType: normalizeStructTag(originMarketCollateralData.type),
    isIsolated: originMarketCollateralData.isIsolated,
    collateralFactor:
      Number(originMarketCollateralData.collateralFactor.value) / divisor,
    liquidationFactor:
      Number(originMarketCollateralData.liquidationFactor.value) / divisor,
    liquidationDiscount:
      Number(originMarketCollateralData.liquidationDiscount.value) / divisor,
    liquidationPenalty:
      Number(originMarketCollateralData.liquidationPenalty.value) / divisor,
    liquidationReserveFactor:
      Number(originMarketCollateralData.liquidationReserveFactor.value) /
      divisor,
    maxCollateralAmount: Number(originMarketCollateralData.maxCollateralAmount),
    totalCollateralAmount: Number(
      originMarketCollateralData.totalCollateralAmount
    ),
  };
};

export const calculateMarketCollateralData = (
  metadata: Pick<
    MarketRepoMetadata,
    'parseCoinNameFromType' | 'getCoinDecimal'
  >,
  parsedMarketCollateralData: ParsedMarketCollateralData
): CalculatedMarketCollateralData => {
  const collateralCoinName = metadata.parseCoinNameFromType(
    parsedMarketCollateralData.coinType
  );
  const coinDecimal = metadata.getCoinDecimal(collateralCoinName);
  if (coinDecimal === undefined) {
    throw new ScallopParseError(
      `Coin decimal not found for ${collateralCoinName}`,
      { context: { coinName: collateralCoinName } }
    );
  }

  const maxCollateralCoin = BigNumber(
    parsedMarketCollateralData.maxCollateralAmount
  ).shiftedBy(-coinDecimal);
  const depositCoin = BigNumber(
    parsedMarketCollateralData.totalCollateralAmount
  ).shiftedBy(-coinDecimal);

  return {
    coinDecimal,
    isIsolated: parsedMarketCollateralData.isIsolated,
    maxDepositAmount: parsedMarketCollateralData.maxCollateralAmount,
    maxDepositCoin: maxCollateralCoin.toNumber(),
    depositAmount: parsedMarketCollateralData.totalCollateralAmount,
    depositCoin: depositCoin.toNumber(),
  };
};

export const calculateTotalValueLocked = (
  market: TvlMarketInput
): TotalValueLocked => {
  let supplyLendingValue = BigNumber(0);
  let supplyCollateralValue = BigNumber(0);
  let borrowValue = BigNumber(0);

  for (const pool of Object.values(market.pools)) {
    if (!pool) continue;
    supplyLendingValue = supplyLendingValue.plus(
      BigNumber(pool.supplyCoin).multipliedBy(pool.coinPrice)
    );
    borrowValue = borrowValue.plus(
      BigNumber(pool.borrowCoin).multipliedBy(pool.coinPrice)
    );
  }

  for (const collateral of Object.values(market.collaterals)) {
    if (!collateral) continue;
    supplyCollateralValue = supplyCollateralValue.plus(
      BigNumber(collateral.depositCoin).multipliedBy(collateral.coinPrice)
    );
  }

  return {
    supplyValue: supplyLendingValue.plus(supplyCollateralValue).toNumber(),
    supplyLendingValue: supplyLendingValue.toNumber(),
    supplyCollateralValue: supplyCollateralValue.toNumber(),
    borrowValue: borrowValue.toNumber(),
    totalValue: supplyLendingValue
      .plus(supplyCollateralValue)
      .minus(borrowValue)
      .toNumber(),
  };
};

// export const checkAssetParams = (
//   whitelist: {
//     scoin: ReadonlySet<string>;
//   },
//   fromSCoin: string,
//   toSCoin: string
// ) => {
//   if (fromSCoin === toSCoin)
//     throw new Error('fromAsset and toAsset must be different');

//   if (!whitelist.scoin.has(fromSCoin))
//     throw new Error('fromAsset is not supported');

//   if (!whitelist.scoin.has(toSCoin)) {
//     throw new Error('toAsset is not supported');
//   }
// };
