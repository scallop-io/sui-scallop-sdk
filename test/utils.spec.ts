import * as dotenv from 'dotenv';
import { describe, it, expect } from 'vitest';
import { PROTOCOL_OBJECT_ID } from '../src/constants';
import { Scallop } from '../src';
import type { NetworkType } from '@scallop-io/sui-kit';

dotenv.config();

const ENABLE_LOG = true;

const NETWORK: NetworkType = 'mainnet';

describe('Test Scallop Utils', async () => {
  const scallopSDK = new Scallop({
    secretKey: process.env.SECRET_KEY,
    networkType: NETWORK,
  });
  const scallopUtils = await scallopSDK.createScallopUtils();
  const address = await scallopSDK.getScallopAddress();

  it('Should get symbol from coin and market coin name', async () => {
    const usdcSymbol = scallopUtils.parseSymbol('usdc');
    const ssuiSymbol = scallopUtils.parseSymbol('ssui');

    const usdcAssertSymbol = 'USDC';
    const ssuiAssertSymbol = 'sSUI';
    if (ENABLE_LOG) {
      console.info('Usdc Symbol:', usdcSymbol);
      console.info('sSui Symbol:', ssuiSymbol);
    }
    expect(usdcSymbol).toEqual(usdcAssertSymbol);
    expect(ssuiSymbol).toEqual(ssuiAssertSymbol);
  });

  it('Should get coin type from coin name', async () => {
    const usdcCoinType = scallopUtils.parseCoinType('usdc');
    const suiCoinType = scallopUtils.parseCoinType('sui');

    const usdcAssertCoinType = `${address.get(
      'core.coins.usdc.id'
    )}::coin::COIN`;
    const suiAssertCoinType = `${address.get('core.coins.sui.id')}::sui::SUI`;
    if (ENABLE_LOG) {
      console.info('Usdc coin type:', usdcCoinType);
      console.info('Sui coin type:', suiCoinType);
    }
    expect(usdcCoinType).toEqual(usdcAssertCoinType);
    expect(suiCoinType).toEqual(suiAssertCoinType);
  });

  it('Should get coin name from coin type', async () => {
    const usdcCoinName = scallopUtils.parseCoinName(
      `${address.get('core.coins.usdc.id')}::coin::COIN`
    );
    const suiCoinName = scallopUtils.parseCoinName('0x2::sui::SUI');

    const usdcAssertCoinName = 'usdc';
    const suiAssertCoinName = 'sui';
    if (ENABLE_LOG) {
      console.info('Usdc coin name:', usdcCoinName);
      console.info('Sui coin name:', suiCoinName);
    }
    expect(usdcCoinName).toEqual(usdcAssertCoinName);
    expect(suiCoinName).toEqual(suiAssertCoinName);
  });

  it('Should get market coin type from market coin type', async () => {
    const usdcMarketCoinType = scallopUtils.parseMarketCoinType('usdc');
    const suiMarketCoinType = scallopUtils.parseMarketCoinType('sui');

    const usdcAssertMarketCoinType = `${PROTOCOL_OBJECT_ID}::reserve::MarketCoin<${address.get(
      'core.coins.usdc.id'
    )}::coin::COIN>`;
    const suiAssertMarketCoinType = `${PROTOCOL_OBJECT_ID}::reserve::MarketCoin<${address.get(
      'core.coins.sui.id'
    )}::sui::SUI>`;
    if (ENABLE_LOG) {
      console.info('Usdc market coin type:', usdcMarketCoinType);
      console.info('Sui market coin type:', suiMarketCoinType);
    }
    expect(usdcMarketCoinType).toEqual(usdcAssertMarketCoinType);
    expect(suiMarketCoinType).toEqual(suiAssertMarketCoinType);
  });

  it('Should get spool reward coin name', async () => {
    const rewardCoinName = scallopUtils.getRewardCoinName('susdc');
    if (ENABLE_LOG) {
      console.info('Reward coin name:', rewardCoinName);
    }
    expect(!!rewardCoinName).toBe(true);
  });

  it('Should get coin decimal', async () => {
    const usdcCoinDecimal = scallopUtils.getCoinDecimal('usdc');
    if (ENABLE_LOG) {
      console.info('Usdc coin decimal:', usdcCoinDecimal);
    }
    expect(!!usdcCoinDecimal).toBe(true);
  });

  it('Should get coin wrap type', async () => {
    const usdcCoinWrapType = scallopUtils.getCoinWrappedType('usdc');
    if (ENABLE_LOG) {
      console.info('Usdc coin wrap type:', usdcCoinWrapType);
    }
    expect(!!usdcCoinWrapType).toBe(true);
  });

  it('Should get coin prices', async () => {
    const coinPrices = await scallopUtils.getAllCoinPrice(['usdc']);
    if (ENABLE_LOG) {
      console.info('Usdc coin prices:', coinPrices);
    }
    expect(!!coinPrices).toBe(true);
  });
});
