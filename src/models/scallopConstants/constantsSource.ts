import type { SuiClientTypes } from '@mysten/sui/client';
import { queryKeys } from 'src/constants/index.js';
import type { Logger } from 'src/logger/index.js';
import type { PoolAddress } from 'src/repositories/poolAddresses/types.js';
import type ScallopAddress from '../scallopAddress/index.js';
import type { AddressesInterface } from '../scallopAddress/types.js';
import type { ScallopConstantsConstructorParams, Whitelist } from './types.js';
import { cloneDefaultWhitelist, parseWhitelistParams } from './utils.js';

/**
 * The I/O port for `ScallopConstants`. Everything that touches the network
 * (address read, whitelist + pool-address fetch) lives behind this interface so
 * the loader/orchestration can be driven by a fake in unit tests.
 *
 * Acquisition only — filtering, freezing and derivation happen in the loader.
 */
export interface ConstantsSource {
  /** Read on-chain addresses if missing (or `force`). */
  ensureAddresses(opts: {
    network: SuiClientTypes.Network;
    force: boolean;
    addressId?: string;
  }): Promise<void>;
  getAddresses(
    network?: SuiClientTypes.Network
  ): AddressesInterface | undefined;
  /** Fetched whitelist, parsed into the `Whitelist` shape (with default fallback). */
  fetchWhitelist(): Promise<Whitelist>;
  /** Raw pool-address bundle (unfiltered; default fallback on failure). */
  fetchPoolAddresses(): Promise<Record<string, PoolAddress>>;
}

export type LiveConstantsSourceDeps = {
  address: ScallopAddress;
  logger: Logger;
  defaultValues?: ScallopConstantsConstructorParams['defaultValues'];
};

/**
 * Live adapter over `ScallopAddress` + its cached axios client. Holds the
 * try/catch → `defaultValues` fallback for `readWhiteList` / `readPoolAddresses`.
 */
export const createLiveConstantsSource = ({
  address,
  logger,
  defaultValues,
}: LiveConstantsSourceDeps): ConstantsSource => ({
  async ensureAddresses({ network, force, addressId }) {
    const addresses = address.getAddresses(network);
    if (!addresses || Object.keys(addresses).length === 0 || force) {
      await address.read(addressId);
      return;
    }

    // Addresses seeded from `defaultValues` are complete enough to build on, but
    // they are a bundled snapshot — contract addresses move on protocol upgrades.
    // Serve the seed immediately and reconcile behind it: awaiting here would put
    // a full API round trip in front of every on-chain read, which is the whole
    // reason a caller bothers to supply `defaultValues`. `read()` mutates the same
    // address map in place, so later `get()` calls pick up the refreshed values.
    if (address.isSeeded(network)) {
      void address.read(addressId).catch((e) => {
        logger.warn('background address refresh failed; using default values', {
          message: (e as Error)?.message,
        });
      });
    }
  },

  getAddresses(network) {
    return address.getAddresses(network);
  },

  async fetchWhitelist() {
    const { api, fetchWithCache } = address.addressApiRepo.context;
    const response = await (async () => {
      try {
        return await fetchWithCache({
          queryKey: queryKeys.api.getWhiteList(),
          queryFn: () =>
            api.get<Record<keyof Whitelist, string[]>>(`/pool/whitelist`),
        });
      } catch (e) {
        logger.warn('whitelist fetch failed; using default values', {
          message: (e as Error)?.message,
        });
        return defaultValues?.whitelist ?? cloneDefaultWhitelist();
      }
    })();

    return parseWhitelistParams(response);
  },

  async fetchPoolAddresses() {
    const { api, fetchWithCache } = address.addressApiRepo.context;
    const response = await (async () => {
      try {
        return await fetchWithCache({
          queryKey: queryKeys.api.getPoolAddresses(),
          queryFn: () =>
            api.get<Record<string, PoolAddress>>(`/pool/addresses`),
        });
      } catch (e) {
        logger.warn('poolAddresses fetch failed; using default values', {
          message: (e as Error)?.message,
        });
        return defaultValues?.poolAddresses ?? {};
      }
    })();
    return response;
  },
});
