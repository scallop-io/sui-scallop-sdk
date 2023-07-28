import { SuiKit, SuiTxBlock } from '@scallop-io/sui-kit';
import BigNumber from 'bignumber.js';
import { ScallopAddress, ScallopUtils } from '../models';
import {
  MarketInterface,
  MarketDataInterface,
  AssetPoolInterface,
  CollateralPoolInterface,
  SupportCollateralCoins,
  SupportAssetCoins,
} from '../types';

export const queryMarket = async (
  scallopAddress: ScallopAddress,
  suiKit: SuiKit,
  scallopUtils: ScallopUtils
) => {
  const packageId = scallopAddress.get('core.packages.query.id');
  const marketId = scallopAddress.get('core.market');
  const txBlock = new SuiTxBlock();
  const queryTarget = `${packageId}::market_query::market_data`;
  txBlock.moveCall(queryTarget, [marketId]);
  const queryResult = await suiKit.inspectTxn(txBlock);
  const marketData = queryResult.events[0].parsedJson as MarketDataInterface;

  const assets: AssetPoolInterface[] = [];
  const collaterals: CollateralPoolInterface[] = [];

  for (const asset of marketData.pools) {
    // parse origin data
    const coinType = '0x' + asset.type.name;
    const borrowAPYFactor = 24 * 365 * 3600;
    const baseBorrowRate = Number(asset.baseBorrowRatePerSec.value) / 2 ** 32;
    const borrowRateOnHighKink =
      Number(asset.borrowRateOnHighKink.value) / 2 ** 32;
    const borrowRateOnMidKink =
      Number(asset.borrowRateOnMidKink.value) / 2 ** 32;
    const maxBorrowRate = Number(asset.maxBorrowRate.value) / 2 ** 32;
    const highKink = Number(asset.highKink.value) / 2 ** 32;
    const midKink = Number(asset.midKink.value) / 2 ** 32;
    const borrowRate = Number(asset.interestRate.value) / 2 ** 32;
    const borrowRateScale = Number(asset.interestRateScale);
    const borrowIndex = Number(asset.borrowIndex);
    const lastUpdated = Number(asset.lastUpdated);
    const cash = Number(asset.cash);
    const debt = Number(asset.debt);
    const marketCoinSupply = Number(asset.marketCoinSupply);
    const minBorrowAmount = Number(asset.minBorrowAmount);
    const reserve = Number(asset.reserve);
    const reserveFactor = Number(asset.reserveFactor.value) / 2 ** 32;
    const borrowWeight = Number(asset.borrowWeight.value) / 2 ** 32;

    // calculated  data
    const caculatedBaseBorrowRate = BigNumber(baseBorrowRate)
      .multipliedBy(borrowAPYFactor)
      .dividedBy(borrowRateScale)
      .toNumber();
    const caculatedBorrowRateOnHighKink = BigNumber(borrowRateOnHighKink)
      .multipliedBy(borrowAPYFactor)
      .dividedBy(borrowRateScale)
      .toNumber();
    const caculatedBorrowRateOnMidKink = BigNumber(borrowRateOnMidKink)
      .multipliedBy(borrowAPYFactor)
      .dividedBy(borrowRateScale)
      .toNumber();
    const caculatedMaxBorrowRate = BigNumber(maxBorrowRate)
      .multipliedBy(borrowAPYFactor)
      .dividedBy(borrowRateScale)
      .toNumber();
    const caculatedBorrowRate = BigNumber(borrowRate)
      .multipliedBy(borrowAPYFactor)
      .dividedBy(borrowRateScale)
      .toNumber();
    const newBorrowIndex = BigNumber(borrowRate)
      .multipliedBy(caculatedBorrowRate)
      .multipliedBy(Math.floor(new Date().getTime() / 1000) - lastUpdated);
    const currentBorrowIndex = BigNumber(borrowIndex).plus(newBorrowIndex);
    const totalSupply = BigNumber(debt).plus(Math.max(cash - reserve, 0));
    let utilizationRate = BigNumber(debt).dividedBy(totalSupply);
    utilizationRate = utilizationRate.isFinite()
      ? utilizationRate
      : BigNumber(0);
    let supplyRate = BigNumber(caculatedBorrowRate)
      .multipliedBy(utilizationRate)
      .multipliedBy(1 - reserveFactor);
    supplyRate = supplyRate.isFinite() ? supplyRate : BigNumber(0);

    // base data
    const coin = scallopUtils.getCoinNameFromCoinType(
      coinType
    ) as SupportCollateralCoins;
    const symbol = coin.toUpperCase() as Uppercase<SupportAssetCoins>;
    const marketCoinType = scallopUtils.parseMarketCoinType(
      scallopAddress.get(`core.coins.${coin}.id`),
      scallopAddress.get('core.packages.protocol.id'),
      coin
    );
    const wrappedType =
      coin === 'usdc'
        ? {
            from: 'Wormhole',
            type: 'Portal from Ethereum',
          }
        : undefined;

    assets.push({
      coin: coin,
      symbol: symbol,
      coinType: coinType,
      wrappedType: wrappedType,
      marketCoinType: marketCoinType,
      calculated: {
        utilizationRate: utilizationRate.toNumber(),
        baseBorrowRate: caculatedBaseBorrowRate,
        borrowInterestRate: Math.min(
          caculatedBorrowRate,
          caculatedMaxBorrowRate
        ),
        supplyInterestRate: supplyRate.toNumber(),
        newBorrowIndex: newBorrowIndex.toNumber(),
        currentBorrowIndex: currentBorrowIndex.toNumber(),
      },
      origin: {
        highKink,
        midKink,
        baseBorrowRate: caculatedBaseBorrowRate,
        borrowRateOnHighKink: caculatedBorrowRateOnHighKink,
        borrowRateOnMidKink: caculatedBorrowRateOnMidKink,
        borrowRate: caculatedBorrowRate,
        maxBorrowRate: caculatedMaxBorrowRate,
        reserveFactor,
        borrowWeight,
        borrowIndex,
        lastUpdated,
        debt,
        cash,
        marketCoinSupply,
        minBorrowAmount,
        reserve,
      },
    });
  }

  for (const collateral of marketData.collaterals) {
    // parse origin data
    const coinType = '0x' + collateral.type.name;
    const collateralFactor =
      Number(collateral.collateralFactor.value) / 2 ** 32;
    const liquidationFactor =
      Number(collateral.liquidationFactor.value) / 2 ** 32;
    const liquidationDiscount =
      Number(collateral.liquidationDiscount.value) / 2 ** 32;
    const liquidationPanelty =
      Number(collateral.liquidationPanelty.value) / 2 ** 32;
    const liquidationReserveFactor =
      Number(collateral.liquidationReserveFactor.value) / 2 ** 32;
    const maxCollateralAmount = Number(collateral.maxCollateralAmount);
    const totalCollateralAmount = Number(collateral.totalCollateralAmount);

    // base data
    const coin = scallopUtils.getCoinNameFromCoinType(
      coinType
    ) as SupportCollateralCoins;
    const symbol = coin.toUpperCase() as Uppercase<SupportCollateralCoins>;
    const wrappedType =
      coin === 'usdc'
        ? {
            from: 'Wormhole',
            type: 'Portal from Ethereum',
          }
        : undefined;

    collaterals.push({
      coin: coin,
      symbol: symbol,
      coinType: coinType,
      wrappedType: wrappedType,
      origin: {
        collateralFactor,
        liquidationFactor,
        liquidationDiscount,
        liquidationPanelty,
        liquidationReserveFactor,
        maxCollateralAmount,
        totalCollateralAmount,
      },
    });
  }

  return {
    assets: assets,
    collaterals: collaterals,
    data: marketData,
  } as MarketInterface;
};
