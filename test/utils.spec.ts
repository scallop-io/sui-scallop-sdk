import { describe, it, expect } from 'vitest';
import { PROTOCOL_OBJECT_ID, SUPPORT_POOLS } from '../src/constants';
import { scallopSDK } from './scallopSdk';

const ENABLE_LOG = false;

describe('Test Scallop Utils', async () => {
  const scallopUtils = await scallopSDK.createScallopUtils();
  const address = await scallopSDK.getScallopAddress();
  // const client = await scallopSDK.createScallopClient();

  it('Should parse to symbol from coin and market coin name', async () => {
    const usdcSymbol = scallopUtils.parseSymbol('wusdc');
    const ssuiSymbol = scallopUtils.parseSymbol('ssui');
    const vsuiSymbol = scallopUtils.parseSymbol('vsui');

    const usdcAssertSymbol = 'wUSDC';
    const ssuiAssertSymbol = 'sSUI';
    const vsuiAssertSymbol = 'vSUI';
    if (ENABLE_LOG) {
      console.info('wUsdc Symbol:', usdcSymbol);
      console.info('sSui Symbol:', ssuiSymbol);
      console.info('vSUI Symbol:', vsuiSymbol);
    }
    expect(usdcSymbol).toEqual(usdcAssertSymbol);
    expect(ssuiSymbol).toEqual(ssuiAssertSymbol);
    expect(vsuiSymbol).toEqual(vsuiAssertSymbol);
  });

  it('Should parse to coin type from coin name', async () => {
    const suiCoinType = scallopUtils.parseCoinType('sui');
    const usdcCoinType = scallopUtils.parseCoinType('wusdc');
    const usdtCoinType = scallopUtils.parseCoinType('swusdt');
    const afsuiCoinType = scallopUtils.parseCoinType('afsui');
    const vsuiCoinType = scallopUtils.parseCoinType('svsui');

    const suiAssertCoinType = `${address.get('core.coins.sui.id')}::sui::SUI`;
    const usdcAssertCoinType = `${address.get(
      'core.coins.wusdc.id'
    )}::coin::COIN`;
    const usdtAssertCoinType = `${address.get(
      'core.coins.wusdt.id'
    )}::coin::COIN`;
    const afsuiAssertCoinType = `${address.get(
      'core.coins.afsui.id'
    )}::afsui::AFSUI`;
    const vsuiAssertCoinType = `${address.get(
      'core.coins.vsui.id'
    )}::cert::CERT`;
    if (ENABLE_LOG) {
      console.info('Usdc coin type:', usdcCoinType);
      console.info('Sui coin type:', suiCoinType);
      console.info('Usdt coin type from market coin name:', usdtCoinType);
      console.info('Afsui coin type:', afsuiCoinType);
      console.info('vsui coin type from market coin name:', vsuiCoinType);
    }
    expect(suiCoinType).toEqual(suiAssertCoinType);
    expect(usdcCoinType).toEqual(usdcAssertCoinType);
    expect(usdtCoinType).toEqual(usdtAssertCoinType);
    expect(afsuiCoinType).toEqual(afsuiAssertCoinType);
    expect(vsuiCoinType).toEqual(vsuiAssertCoinType);
  });

  it('Should parse to market coin type from coin name', async () => {
    const suiMarketCoinType = scallopUtils.parseMarketCoinType('sui');
    const usdcMarketCoinType = scallopUtils.parseMarketCoinType('wusdc');
    const usdtMarketCoinType = scallopUtils.parseMarketCoinType('swusdt');
    const vsuiMarketCoinType = scallopUtils.parseMarketCoinType('svsui');

    const suiAssertMarketCoinType = `${PROTOCOL_OBJECT_ID}::reserve::MarketCoin<${address.get(
      'core.coins.sui.id'
    )}::sui::SUI>`;
    const usdcAssertMarketCoinType = `${PROTOCOL_OBJECT_ID}::reserve::MarketCoin<${address.get(
      'core.coins.wusdc.id'
    )}::coin::COIN>`;
    const usdtAssertMarketCoinType = `${PROTOCOL_OBJECT_ID}::reserve::MarketCoin<${address.get(
      'core.coins.wusdt.id'
    )}::coin::COIN>`;
    const vsuiAssertMarketCoinType = `${PROTOCOL_OBJECT_ID}::reserve::MarketCoin<${address.get(
      'core.coins.vsui.id'
    )}::cert::CERT>`;
    if (ENABLE_LOG) {
      console.info('Sui market coin type:', suiMarketCoinType);
      console.info('Usdc market coin type:', usdcMarketCoinType);
      console.info('Usdt market coin type:', usdtMarketCoinType);
      console.info('Vsui market coin type:', vsuiMarketCoinType);
    }
    expect(suiMarketCoinType).toEqual(suiAssertMarketCoinType);
    expect(usdcMarketCoinType).toEqual(usdcAssertMarketCoinType);
    expect(usdtMarketCoinType).toEqual(usdtAssertMarketCoinType);
    expect(vsuiMarketCoinType).toEqual(vsuiAssertMarketCoinType);
  });

  it('Should parse to coin name from coin type', async () => {
    const suiCoinType = scallopUtils.parseCoinType('sui');
    const usdcCoinType = scallopUtils.parseCoinType('wusdc');
    const usdtMarketCoinType = scallopUtils.parseMarketCoinType('wusdt');
    const suiCoinObjectType = `0x2::coin::Coin<${suiCoinType}>`;
    const usdtMarketCoinObjectType = `0x2::coin::Coin<${usdtMarketCoinType}>`;
    const vsuiMarketCoinType = scallopUtils.parseMarketCoinType('vsui');

    const suiCoinName = scallopUtils.parseCoinNameFromType(suiCoinType);
    const usdcCoinName = scallopUtils.parseCoinNameFromType(usdcCoinType);
    const usdtMarketCoinName =
      scallopUtils.parseCoinNameFromType(usdtMarketCoinType);
    const suiCoinNameFromObjectType =
      scallopUtils.parseCoinNameFromType(suiCoinObjectType);
    const usdtMarketCoinNameFromObjectType = scallopUtils.parseCoinNameFromType(
      usdtMarketCoinObjectType
    );
    const vsuiMarketCoinName =
      scallopUtils.parseCoinNameFromType(vsuiMarketCoinType);

    const suiAssertCoinName = 'sui';
    const usdcAssertCoinName = 'wusdc';
    const usdtAssertMarketCoinName = 'swusdt';
    const vsuiAssertMarketCoinName = 'svsui';
    if (ENABLE_LOG) {
      console.info('Sui coin name:', suiCoinName);
      console.info('Usdc coin name:', usdcCoinName);
      console.info('Usdt market coin name:', usdtMarketCoinName);
      console.info('Sui coin name:', suiCoinNameFromObjectType);
      console.info('Usdt market coin name:', usdtMarketCoinNameFromObjectType);
      console.info('Vsui market coin name:', vsuiMarketCoinName);
    }
    expect(suiCoinName).toEqual(suiAssertCoinName);
    expect(usdcCoinName).toEqual(usdcAssertCoinName);
    expect(usdtMarketCoinName).toEqual(usdtAssertMarketCoinName);
    expect(suiCoinNameFromObjectType).toEqual(suiAssertCoinName);
    expect(usdtMarketCoinNameFromObjectType).toEqual(usdtAssertMarketCoinName);
    expect(vsuiMarketCoinName).toEqual(vsuiAssertMarketCoinName);
  });

  it('Should parse to coin name from market name', async () => {
    const usdcCoinName = scallopUtils.parseCoinName('swusdc');

    const usdcAssertCoinName = 'wusdc';
    if (ENABLE_LOG) {
      console.info('Sui coin name:', usdcCoinName);
    }
    expect(usdcCoinName).toEqual(usdcAssertCoinName);
  });

  it('Should parse to market coin name from coin name', async () => {
    const usdcMarketCoinName = scallopUtils.parseMarketCoinName('wusdc');

    const usdcAssertMarketCoinName = 'swusdc';
    if (ENABLE_LOG) {
      console.info('Usdc market coin name:', usdcMarketCoinName);
    }
    expect(usdcMarketCoinName).toEqual(usdcAssertMarketCoinName);
  });

  it('Should get spool reward coin name', async () => {
    const spoolRewardCoinName = scallopUtils.getSpoolRewardCoinName('swusdc');
    if (ENABLE_LOG) {
      console.info('Spool reward coin name:', spoolRewardCoinName);
    }
    expect(!!spoolRewardCoinName).toBe(true);
  });

  it('Should get coin decimal', async () => {
    const usdcCoinDecimal = scallopUtils.getCoinDecimal('wusdc');
    const usdcMarketCoinDecimal = scallopUtils.getCoinDecimal('swusdc');
    if (ENABLE_LOG) {
      console.info('Usdc coin decimal:', usdcCoinDecimal);
      console.info('Usdc market coin decimal:', usdcMarketCoinDecimal);
    }
    expect(usdcCoinDecimal).toEqual(6);
    expect(usdcMarketCoinDecimal).toEqual(6);
  });

  it('Should get coin wrap type', async () => {
    const suiCoinWrapType = scallopUtils.getCoinWrappedType('sui');
    const usdcCoinWrapType = scallopUtils.getCoinWrappedType('wusdc');
    if (ENABLE_LOG) {
      console.info('Sui coin wrap type:', suiCoinWrapType);
      console.info('Usdc coin wrap type:', usdcCoinWrapType);
    }
    expect(suiCoinWrapType).toBeUndefined();
    expect(usdcCoinWrapType).toBeDefined();
  });

  it('Should get coin object ids within the selected coin amount range', async () => {
    const suiCoinType = scallopUtils.parseCoinType('sui');
    const suiMarketCoinType = scallopUtils.parseSCoinType('ssui');
    const suiCoinObjectIds = scallopUtils.selectCoins(1e7, suiCoinType);
    const suiMarketCoinObjectIds = scallopUtils.selectCoins(
      1,
      suiMarketCoinType
    );
    if (ENABLE_LOG) {
      console.info('Sui coin object ids:', suiCoinObjectIds);
      console.info('Sui market coin object ids:', suiMarketCoinObjectIds);
    }
    expect(!!suiCoinObjectIds).toBe(true);
    expect(!!suiMarketCoinObjectIds).toBe(true);
  });

  // it('Should get all asset coin names from obligation account', async () => {
  //   const obligations = await client.getObligations();
  //   expect(obligations.length).toBeGreaterThan(0);

  //   const assetCoinNames = await scallopUtils.getObligationCoinNames(
  //     obligations[0].id
  //   );
  //   if (ENABLE_LOG) {
  //     console.info('Asset coin names from obligation:', assetCoinNames);
  //   }
  //   expect(!!assetCoinNames).toBe(true);
  // });

  it('Should get coin prices', async () => {
    const coinPrices = await scallopUtils.getCoinPrices();
    const usdcCoinPrice = coinPrices['wusdc'];
    if (ENABLE_LOG) {
      console.info('All coin prices:', coinPrices);
      console.info('Usdc coin price:', usdcCoinPrice);
    }
    expect(!!coinPrices).toBe(true);
    expect(usdcCoinPrice).toBeGreaterThanOrEqual(0);
  });

  it('Should return supported pool addresses', () => {
    const poolInfos = scallopUtils.getSupportedPoolAddresses();
    if (ENABLE_LOG) {
      console.info('Pool infos:', poolInfos);
    }
    expect(!!poolInfos).toBe(true);
    expect(poolInfos.length).toBe(SUPPORT_POOLS.length);
  });
});
