import type { SuiClientTypes } from '@mysten/sui/client';
import type { PoolAddress } from 'src/repositories/poolAddresses/types.js';
import type { ConstantsSource } from './constantsSource.js';
import { deriveConstants, type DerivedConstants } from './deriveConstants.js';
import type { Whitelist } from './types.js';
import {
  freezePoolAddresses,
  freezeWhitelist,
  normalizeSCoinWhitelist,
  parseWhitelistParams,
} from './utils.js';

/**
 * Whitelist keys that must be non-empty for constants to count as "initialized".
 * Mirrors the validator's list in `config/ConfigValidator.ts` (kept separate to
 * avoid a config↔constants import cycle).
 */
export const REQUIRED_WHITELIST_KEYS = [
  'lending',
  'collateral',
  'borrowing',
  'packages',
  'scoin',
  'spool',
  'oracles',
  'pythEndpoints',
  'emerging',
] as const;

/** Immutable assembled constants — the value `ScallopConstants` holds + exposes. */
export type ConstantsState = {
  readonly whitelist: Whitelist;
  readonly poolAddresses: Record<string, PoolAddress | undefined>;
  readonly derived: DerivedConstants;
};

export type LoadConstantsStateOptions = {
  source: ConstantsSource;
  network: SuiClientTypes.Network;
  force: boolean;
  addressId?: string;
  /** Force-override bundles (win over fetched data; skip fetch when already initialized). */
  overrides?: {
    forcePoolAddressInterface?: Record<string, PoolAddress>;
    forceWhitelistInterface?: Whitelist | Record<string, unknown>;
  };
  /** Existing state — lets the loader short-circuit when already initialized. */
  current: Pick<ConstantsState, 'whitelist' | 'poolAddresses'>;
  parseToOldMarketCoin: (coinType: string) => string;
};

/** Keep only pool entries whitelisted under some set, normalizing field values. */
const filterPoolAddresses = (
  response: Record<string, PoolAddress>,
  whitelist: Whitelist
): Record<string, PoolAddress | undefined> =>
  Object.fromEntries(
    Object.entries(response)
      .filter(([key]) => Object.values(whitelist).some((set) => set.has(key)))
      .filter((entry): entry is [string, PoolAddress] => entry[1] !== undefined)
      .map(([key, value]) => {
        const parsedValue = Object.fromEntries(
          Object.entries(value).map(([k, v]) => [
            k,
            typeof v === 'boolean' ? (v ?? false) : v || undefined,
          ])
        );
        return [key, parsedValue as PoolAddress];
      })
  );

const isInitialized = (
  source: ConstantsSource,
  network: SuiClientTypes.Network,
  whitelist: Whitelist,
  poolAddresses: Record<string, PoolAddress | undefined>
): boolean => {
  const addresses = source.getAddresses(network);
  const addressInitialized = !!addresses && Object.keys(addresses).length > 0;
  return (
    addressInitialized &&
    Object.keys(poolAddresses).length > 0 &&
    REQUIRED_WHITELIST_KEYS.every((k) => whitelist[k].size > 0)
  );
};

/**
 * Imperative shell: ensure addresses, apply force overrides, fetch (unless
 * already initialized), filter + freeze, then derive. Returns a fresh immutable
 * `ConstantsState`. Pure of `ScallopConstants` — driven entirely by the injected
 * `source` so it can be unit-tested with a fake.
 */
export const loadConstantsState = async ({
  source,
  network,
  force,
  addressId,
  overrides = {},
  current,
  parseToOldMarketCoin,
}: LoadConstantsStateOptions): Promise<ConstantsState> => {
  await source.ensureAddresses({ network, force, addressId });

  let whitelist = current.whitelist;
  let poolAddresses = current.poolAddresses;

  if (overrides.forcePoolAddressInterface) {
    poolAddresses = freezePoolAddresses(overrides.forcePoolAddressInterface);
  }
  if (overrides.forceWhitelistInterface) {
    whitelist = parseWhitelistParams(overrides.forceWhitelistInterface);
  }

  const finalize = (): ConstantsState => {
    const normalized = normalizeSCoinWhitelist(whitelist, poolAddresses);
    return {
      whitelist: normalized,
      poolAddresses,
      derived: deriveConstants({
        poolAddresses,
        whitelist: normalized,
        parseToOldMarketCoin,
      }),
    };
  };

  if (isInitialized(source, network, whitelist, poolAddresses) && !force) {
    return finalize();
  }

  const [whitelistResponse, poolAddressesResponse] = await Promise.all([
    source.fetchWhitelist(),
    source.fetchPoolAddresses(),
  ]);

  if (!overrides.forceWhitelistInterface) {
    whitelist = freezeWhitelist(whitelistResponse);
  }
  if (!overrides.forcePoolAddressInterface) {
    poolAddresses = freezePoolAddresses(
      filterPoolAddresses(poolAddressesResponse, whitelist)
    );
  }

  return finalize();
};
