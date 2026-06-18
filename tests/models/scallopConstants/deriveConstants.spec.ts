import { describe, expect, it } from 'vitest';
import { deriveConstants } from 'src/models/scallopConstants/deriveConstants.js';
import type { Whitelist } from 'src/models/scallopConstants/types.js';
import type { PoolAddress } from 'src/repositories/poolAddresses/types.js';

/**
 * `deriveConstants` is the pure core lifted out of `ScallopConstants.initConstants`.
 * These tests pin the derivation contract directly — no network, no class — so a
 * change to any lookup-map rule fails here instead of only in an integration run.
 */

const WHITELIST_KEYS: (keyof Whitelist)[] = [
  'lending',
  'borrowing',
  'collateral',
  'packages',
  'spool',
  'scoin',
  'suiBridge',
  'wormhole',
  'layerZero',
  'oracles',
  'borrowIncentiveRewards',
  'rewardsAsPoint',
  'pythEndpoints',
  'deprecated',
  'emerging',
];

const whitelist = (
  overrides: Partial<Record<keyof Whitelist, string[]>> = {}
): Whitelist =>
  Object.fromEntries(
    WHITELIST_KEYS.map((k) => [k, new Set(overrides[k] ?? [])])
  ) as Whitelist;

const pool = (p: Partial<PoolAddress>): PoolAddress => p as PoolAddress;

// Injected formatter — mirrors ScallopConstants.parseToOldMarketCoin shape.
const parseToOldMarketCoin = (coinType: string) =>
  `0xPKG::reserve::MarketCoin<${coinType}>`;

describe('deriveConstants', () => {
  it('maps both asset and sCoin names to decimals', () => {
    const { coinDecimals } = deriveConstants({
      poolAddresses: {
        sui: pool({ coinName: 'sui', coinType: '0x2::sui::SUI', decimals: 9 }),
        usdc: pool({
          coinName: 'usdc',
          coinType: '0xusdc::usdc::USDC',
          decimals: 6,
          sCoinName: 'susdc',
          sCoinType: '0xpkg::scallop_usdc::SCALLOP_USDC',
        }),
      },
      whitelist: whitelist(),
      parseToOldMarketCoin,
    });

    expect(coinDecimals).toEqual({ sui: 9, usdc: 6, susdc: 6 });
  });

  it('builds coinTypes for asset + sCoin names and its inverse map', () => {
    const { coinTypes, coinTypeToCoinNameMap } = deriveConstants({
      poolAddresses: {
        usdc: pool({
          coinName: 'usdc',
          coinType: '0xusdc::usdc::USDC',
          decimals: 6,
          sCoinName: 'susdc',
          sCoinType: '0xpkg::scallop_usdc::SCALLOP_USDC',
        }),
      },
      whitelist: whitelist(),
      parseToOldMarketCoin,
    });

    expect(coinTypes).toEqual({
      usdc: '0xusdc::usdc::USDC',
      susdc: '0xpkg::scallop_usdc::SCALLOP_USDC',
    });
    // inverse: type → name
    expect(coinTypeToCoinNameMap['0xusdc::usdc::USDC']).toBe('usdc');
    expect(coinTypeToCoinNameMap['0xpkg::scallop_usdc::SCALLOP_USDC']).toBe(
      'susdc'
    );
  });

  it('derives old market coin types via the injected formatter', () => {
    const { coinNameToOldMarketCoinTypeMap } = deriveConstants({
      poolAddresses: {
        sui: pool({ coinName: 'sui', coinType: '0x2::sui::SUI', decimals: 9 }),
      },
      whitelist: whitelist(),
      parseToOldMarketCoin,
    });

    expect(coinNameToOldMarketCoinTypeMap.sui).toBe(
      '0xPKG::reserve::MarketCoin<0x2::sui::SUI>'
    );
  });

  it('filters the wormhole map by pool KEY membership', () => {
    const { wormholeCoinTypeToCoinNameMap } = deriveConstants({
      poolAddresses: {
        wusdc: pool({
          coinName: 'wusdc',
          coinType: '0xwh::coin::COIN',
          decimals: 6,
        }),
        sui: pool({ coinName: 'sui', coinType: '0x2::sui::SUI', decimals: 9 }),
      },
      // whitelist.wormhole is keyed by the pool KEY ('wusdc'), not coinName
      whitelist: whitelist({ wormhole: ['wusdc'] }),
      parseToOldMarketCoin,
    });

    expect(wormholeCoinTypeToCoinNameMap).toEqual({
      '0xwh::coin::COIN': 'wusdc',
    });
  });

  it('filters the suiBridge map by coinName membership', () => {
    const { suiBridgeCoinTypeToCoinNameMap } = deriveConstants({
      poolAddresses: {
        suiusdc: pool({
          coinName: 'suiusdc',
          coinType: '0xsb::coin::COIN',
          decimals: 6,
        }),
      },
      // suiBridge filters on value.coinName, not the pool key
      whitelist: whitelist({ suiBridge: ['suiusdc'] }),
      parseToOldMarketCoin,
    });

    expect(suiBridgeCoinTypeToCoinNameMap).toEqual({
      '0xsb::coin::COIN': 'suiusdc',
    });
  });

  it('populates the volo map only when a vsui pool exists', () => {
    const withVsui = deriveConstants({
      poolAddresses: {
        vsui: pool({
          coinName: 'vsui',
          coinType: '0xvolo::cert::CERT',
          decimals: 9,
        }),
      },
      whitelist: whitelist(),
      parseToOldMarketCoin,
    });
    expect(withVsui.voloCoinTypeToCoinNameMap).toEqual({
      '0xvolo::cert::CERT': 'vsui',
    });

    const withoutVsui = deriveConstants({
      poolAddresses: {
        sui: pool({ coinName: 'sui', coinType: '0x2::sui::SUI', decimals: 9 }),
      },
      whitelist: whitelist(),
      parseToOldMarketCoin,
    });
    expect(withoutVsui.voloCoinTypeToCoinNameMap).toEqual({});
  });

  it('builds sCoin maps only for pools with both sCoinName and sCoinType', () => {
    const { scoinRawNameToSCoinNameMap, scoinTypeToSCoinNameMap, sCoinTypes } =
      deriveConstants({
        poolAddresses: {
          usdc: pool({
            coinName: 'usdc',
            coinType: '0xusdc::usdc::USDC',
            decimals: 6,
            sCoinName: 'susdc',
            sCoinType: '0xpkg::scallop_usdc::SCALLOP_USDC',
          }),
          // no sCoin* → excluded from every sCoin map
          sui: pool({
            coinName: 'sui',
            coinType: '0x2::sui::SUI',
            decimals: 9,
          }),
        },
        whitelist: whitelist(),
        parseToOldMarketCoin,
      });

    // raw name = the struct tag's `name` segment
    expect(scoinRawNameToSCoinNameMap).toEqual({ SCALLOP_USDC: 'susdc' });
    expect(scoinTypeToSCoinNameMap).toEqual({
      '0xpkg::scallop_usdc::SCALLOP_USDC': 'susdc',
    });
    expect(sCoinTypes).toEqual({
      susdc: '0xpkg::scallop_usdc::SCALLOP_USDC',
    });
  });

  it('collects borrow-incentive rewards as both coin and sCoin names', () => {
    const { supportedBorrowIncentiveRewards } = deriveConstants({
      poolAddresses: {
        usdc: pool({
          coinName: 'usdc',
          coinType: '0xusdc::usdc::USDC',
          decimals: 6,
          sCoinName: 'susdc',
          sCoinType: '0xpkg::scallop_usdc::SCALLOP_USDC',
        }),
        sui: pool({ coinName: 'sui', coinType: '0x2::sui::SUI', decimals: 9 }),
      },
      whitelist: whitelist(),
      parseToOldMarketCoin,
    });

    expect([...supportedBorrowIncentiveRewards].sort()).toEqual(
      ['sui', 'susdc', 'usdc'].sort()
    );
  });
});
