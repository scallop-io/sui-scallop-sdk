import { parseStructTag } from '@scallop-io/sui-kit';
import type { PoolAddress } from 'src/repositories/poolAddresses/types.js';
import type {
  CoinName,
  CoinType,
  OldMarketCoinType,
  SCoinName,
  SCoinRawName,
  SCoinType,
  Whitelist,
} from './types.js';

/**
 * The lookup maps derived purely from `poolAddresses` + `whitelist`. This is
 * the bulk of `ScallopConstants`' logic, extracted as a pure function so it can
 * be unit-tested without any network I/O or class construction.
 */
export type DerivedConstants = {
  coinDecimals: Record<CoinName, number | undefined>;
  coinTypes: Record<CoinName, CoinType | undefined>;
  coinTypeToCoinNameMap: Record<CoinType, CoinName | undefined>;
  coinNameToOldMarketCoinTypeMap: Record<
    CoinName,
    OldMarketCoinType | undefined
  >;
  wormholeCoinTypeToCoinNameMap: Record<CoinType, CoinName | undefined>;
  voloCoinTypeToCoinNameMap: Record<CoinType, CoinName | undefined>;
  suiBridgeCoinTypeToCoinNameMap: Record<CoinType, CoinName | undefined>;
  scoinRawNameToSCoinNameMap: Record<SCoinRawName, SCoinName | undefined>;
  scoinTypeToSCoinNameMap: Record<SCoinType, SCoinName | undefined>;
  sCoinTypes: Record<SCoinName, SCoinType | undefined>;
  supportedBorrowIncentiveRewards: Set<CoinName>;
};

export type DeriveConstantsInput = {
  poolAddresses: Record<string, PoolAddress | undefined>;
  whitelist: Whitelist;
  /**
   * Formats an asset coin type into its old `reserve::MarketCoin<...>` type.
   * Injected (rather than reading `protocolObjectId` here) so this function
   * stays free of `ScallopConstants` state.
   */
  parseToOldMarketCoin: (coinType: string) => string;
};

/**
 * Pure derivation of all `ScallopConstants` lookup maps. No I/O, no `this`.
 */
export const deriveConstants = ({
  poolAddresses,
  whitelist,
  parseToOldMarketCoin,
}: DeriveConstantsInput): DerivedConstants => {
  const coinDecimals = Object.fromEntries([
    ...Object.entries(poolAddresses)
      .filter(([_, value]) => !!value)
      .map(([key, value]) => [key, value!.decimals]),
    ...Object.entries(poolAddresses)
      .filter(([_, value]) => !!value?.sCoinName)
      .map(([_, value]) => [value!.sCoinName, value!.decimals]),
  ]);

  const coinTypes = Object.fromEntries([
    ...Object.entries(poolAddresses)
      .filter(([_, value]) => !!value)
      .map(([key, value]) => [key, value?.coinType]),
    ...Object.entries(poolAddresses)
      .filter(([_, value]) => !!value && value.sCoinName && value.sCoinType)
      .map(([_, value]) => [value!.sCoinName, value!.sCoinType]),
  ]);

  const coinTypeToCoinNameMap = Object.fromEntries(
    Object.entries(coinTypes).map(([key, val]) => [val, key])
  );

  const wormholeCoinTypeToCoinNameMap = Object.fromEntries(
    Object.entries(poolAddresses)
      .filter(([key, value]) => !!value && whitelist.wormhole.has(key))
      .map(([_, value]) => [value!.coinType, value!.coinName])
  );

  const coinNameToOldMarketCoinTypeMap = Object.fromEntries(
    Object.entries(poolAddresses)
      .filter(([_, value]) => !!value)
      .map(([_, value]) => [
        value!.coinName,
        parseToOldMarketCoin(value!.coinType),
      ])
  );

  const scoinRawNameToSCoinNameMap = Object.fromEntries(
    Object.entries(poolAddresses)
      .filter(([_, value]) => !!value && value.sCoinType && value.sCoinName)
      .map(([_, value]) => {
        const scoinRawName = parseStructTag(value!.sCoinType!).name;
        return [scoinRawName, value!.sCoinName!];
      })
  );

  const scoinTypeToSCoinNameMap = Object.fromEntries(
    Object.entries(poolAddresses)
      .filter(([_, value]) => !!value && value.sCoinType && value.sCoinName)
      .map(([_, value]) => [value!.sCoinType!, value!.sCoinName!])
  );

  const vSuiCoinType = poolAddresses['vsui']?.coinType;
  const voloCoinTypeToCoinNameMap: Record<CoinType, CoinName | undefined> =
    vSuiCoinType ? { [vSuiCoinType]: 'vsui' } : {};

  const suiBridgeCoinTypeToCoinNameMap = Object.fromEntries(
    Object.entries(poolAddresses)
      .filter(
        ([_, value]) => !!value && whitelist.suiBridge.has(value.coinName)
      )
      .map(([_, value]) => [value!.coinType, value!.coinName])
  );

  const sCoinTypes = Object.fromEntries(
    Object.entries(poolAddresses)
      .filter(([_, value]) => !!value && value.sCoinName && value.sCoinType)
      .map(([_, value]) => [value!.sCoinName, value!.sCoinType!])
  );

  const supportedBorrowIncentiveRewards = new Set<CoinName>([
    ...Object.values(poolAddresses)
      .filter((t) => !!t)
      .map((t) => (t!.sCoinName ? [t!.coinName, t!.sCoinName] : [t!.coinName]))
      .flat(),
  ]);

  // Freeze each lookup map so the derived snapshot is as immutable as the
  // whitelist/poolAddresses it came from (consumers only ever read these).
  return {
    coinDecimals: Object.freeze(coinDecimals),
    coinTypes: Object.freeze(coinTypes),
    coinTypeToCoinNameMap: Object.freeze(coinTypeToCoinNameMap),
    coinNameToOldMarketCoinTypeMap: Object.freeze(
      coinNameToOldMarketCoinTypeMap
    ),
    wormholeCoinTypeToCoinNameMap: Object.freeze(wormholeCoinTypeToCoinNameMap),
    voloCoinTypeToCoinNameMap: Object.freeze(voloCoinTypeToCoinNameMap),
    suiBridgeCoinTypeToCoinNameMap: Object.freeze(
      suiBridgeCoinTypeToCoinNameMap
    ),
    scoinRawNameToSCoinNameMap: Object.freeze(scoinRawNameToSCoinNameMap),
    scoinTypeToSCoinNameMap: Object.freeze(scoinTypeToSCoinNameMap),
    sCoinTypes: Object.freeze(sCoinTypes),
    supportedBorrowIncentiveRewards,
  };
};
