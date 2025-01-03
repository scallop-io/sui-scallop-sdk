import { describe, it, expect } from 'vitest';
import {
  PROTOCOL_OBJECT_ID,
  SUPPORT_POOLS,
  SUPPORT_SCOIN,
} from '../src/constants';
import { scallopSDK } from './scallopSdk';

const ENABLE_LOG = false;

describe('Test Scallop Utils', async () => {
  const scallopUtils = await scallopSDK.createScallopUtils();
  const address = await scallopSDK.getScallopAddress();
  // const client = await scallopSDK.createScallopClient();

  it('Should parse to symbol from coin and market coin name', () => {
    const expectedCoinSymbols: string[] = [
      'USDC', // native USDC
      'sbETH', // sui bridge ETH
      'sbUSDT', // sui bridge USDT
      'wETH',
      'wBTC',
      'wUSDC',
      'wUSDT',
      'SUI',
      'wAPT',
      'wSOL',
      'CETUS',
      'afSUI',
      'haSUI',
      'vSUI',
      'SCA',
      'FUD',
      'DEEP',
      'FDUSD',
    ] as const;

    const expectedSCoinSymbols: string[] = [
      'sUSDC',
      'ssbETH',
      'ssbUSDT',
      'sSUI',
      'swUSDC',
      'swUSDT',
      'safSUI',
      'shaSUI',
      'svSUI',
      'swETH',
      'sSCA',
      'sCETUS',
      'swSOL',
      'swBTC',
      'sDEEP',
      'sFUD',
      'sFDUSD',
    ];

    // assert element length
    expect(expectedCoinSymbols.length).toBe(SUPPORT_POOLS.length);
    expect(expectedSCoinSymbols.length).toBe(SUPPORT_SCOIN.length);

    SUPPORT_POOLS.map((t) => scallopUtils.parseSymbol(t)).forEach(
      (symbol, idx) => {
        expect(expectedCoinSymbols[idx]).toEqual(symbol);
      }
    );
    SUPPORT_SCOIN.map((t) => scallopUtils.parseSymbol(t)).forEach(
      (symbol, idx) => {
        expect(expectedSCoinSymbols[idx]).toEqual(symbol);
      }
    );
  });

  it('Should parse to coin type from coin name', () => {
    const suiCoinType = scallopUtils.parseCoinType('sui');
    const usdcCoinType = scallopUtils.parseCoinType('wusdc');
    const usdtCoinType = scallopUtils.parseCoinType('wusdt');
    const afsuiCoinType = scallopUtils.parseCoinType('afsui');
    const vsuiCoinType = scallopUtils.parseCoinType('vsui');

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

  it('Should parse to market coin type from coin name', () => {
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

  it('Should parse to scoin type from coin name', () => {
    SUPPORT_SCOIN.forEach((t) => {
      const scoinType = scallopUtils.parseSCoinType(t);

      expect(scoinType).toBe(address.get(`scoin.coins.${t}.coinType`));
    });
  });

  it('Should parse to coin name from coin type', () => {
    const coinTypes = SUPPORT_POOLS.map((t) => scallopUtils.parseCoinType(t));
    const sCoinTypes = SUPPORT_SCOIN.map((t) => scallopUtils.parseSCoinType(t));

    if (ENABLE_LOG) {
      console.info('Coin types:', coinTypes);
      console.info('Scoin types:', sCoinTypes);
    }
    coinTypes.forEach((t, idx) => {
      const coinName = scallopUtils.parseCoinNameFromType(t);
      expect(coinName).toBeDefined();
      expect(coinName).toBe(SUPPORT_POOLS[idx]);
    });
    sCoinTypes.forEach((t, idx) => {
      const coinName = scallopUtils.parseCoinNameFromType(t);
      expect(coinName).toBeDefined();
      expect(coinName).toBe(SUPPORT_SCOIN[idx]);
    });
  });

  it('Should parse to coin name from market name', () => {
    SUPPORT_SCOIN.forEach((t) => {
      const coinName = scallopUtils.parseCoinName(t);
      expect(coinName).toBe(t.slice(1));
    });
  });

  it('Should parse to market coin name from coin name', () => {
    SUPPORT_POOLS.forEach((t) => {
      const marketCoinName = scallopUtils.parseMarketCoinName(t);
      expect(marketCoinName).toBe(`s${t}`);
    });
  });

  it('Should get spool reward coin name', () => {
    const spoolRewardCoinName = scallopUtils.getSpoolRewardCoinName('swusdc');
    if (ENABLE_LOG) {
      console.info('Spool reward coin name:', spoolRewardCoinName);
    }
    expect(!!spoolRewardCoinName).toBe(true);
  });

  it('Should get coin decimal', () => {
    const usdcCoinDecimal = scallopUtils.getCoinDecimal('wusdc');
    const usdcMarketCoinDecimal = scallopUtils.getCoinDecimal('swusdc');
    if (ENABLE_LOG) {
      console.info('Usdc coin decimal:', usdcCoinDecimal);
      console.info('Usdc market coin decimal:', usdcMarketCoinDecimal);
    }
    expect(usdcCoinDecimal).toEqual(6);
    expect(usdcMarketCoinDecimal).toEqual(6);
  });

  it('Should get coin wrap type', () => {
    const suiCoinWrapType = scallopUtils.getCoinWrappedType('sui');
    const usdcCoinWrapType = scallopUtils.getCoinWrappedType('wusdc');
    if (ENABLE_LOG) {
      console.info('Sui coin wrap type:', suiCoinWrapType);
      console.info('Usdc coin wrap type:', usdcCoinWrapType);
    }
    expect(suiCoinWrapType).toBeUndefined();
    expect(usdcCoinWrapType).toBeDefined();
  });

  it('Should get coin object ids within the selected coin amount range', () => {
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
    if (ENABLE_LOG) {
      console.info('All coin prices:', coinPrices);
    }
    expect(!!coinPrices).toBe(true);
    expect(Object.values(coinPrices).every((t) => t > 0)).toBe(true);
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
