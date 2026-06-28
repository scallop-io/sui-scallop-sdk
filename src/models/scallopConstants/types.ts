import { PoolAddress } from 'src/repositories/poolAddresses/types.js';
import ScallopAddress from '../scallopAddress/index.js';
import {
  AddressesInterface,
  ScallopAddressConstructorParams,
} from '../scallopAddress/types.js';
import type { SuiClientTypes } from '@mysten/sui/client';
import type { ConstantsSource } from './constantsSource.js';

export type Whitelist = {
  lending: Set<string>;
  borrowing: Set<string>;
  collateral: Set<string>;
  packages: Set<string>;
  spool: Set<string>;
  scoin: Set<string>;
  suiBridge: Set<string>;
  wormhole: Set<string>;
  layerZero: Set<string>;
  oracles: Set<string>;
  borrowIncentiveRewards: Set<string>;
  rewardsAsPoint: Set<string>;
  pythEndpoints: Set<string>;
  deprecated: Set<string>;
  emerging: Set<string>;
};

export type InitConfig = {
  /**
   * When true, `init()` throws `ScallopConfigError` at the tail if required
   * core addresses or required whitelist sets are missing/empty. Defaults to
   * false to preserve the existing best-effort behavior.
   */
  strictInit?: boolean;
};

export type ScallopConstantsConstructorParams = {
  forcePoolAddressInterface?: Record<string, PoolAddress>;
  forceWhitelistInterface?: Whitelist | Record<string, any>;
  urls?: {
    addresses?: string[];
    poolAddresses?: string[];
    whitelist?: string[];
  };
  defaultValues?: {
    addresses?: Partial<Record<SuiClientTypes.Network, AddressesInterface>>;
    poolAddresses?: Record<string, PoolAddress>;
    whitelist?: Whitelist | Record<string, any>;
  };
  /**
   * Optional pre-built ScallopAddress to compose. When omitted, a new
   * ScallopAddress is constructed from the same params object.
   */
  scallopAddress?: ScallopAddress;
  /**
   * Optional I/O source override (address read + whitelist/pool-address fetch).
   * Defaults to a live source built from the composed `ScallopAddress`. Mainly a
   * test seam so `init()` can run without network.
   */
  constantsSource?: ConstantsSource;
} & InitConfig &
  ScallopAddressConstructorParams;

export type CoinName = string;
export type CoinType = string;
export type SCoinType = string;
export type OldMarketCoinType = string;

/**
 *  @description `scallop_sui`, `scallop_usdt`, etc (parsed directly from coin type, ex: `0x...::scallop_sui::SCALLOP_SUI`)
 */
export type SCoinRawName = string;

/**
 * @description `ssui`, `susdc`, etc..
 */
export type SCoinName = string;
