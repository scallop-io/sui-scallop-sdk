import { describe, expect, it, vi } from 'vitest';
import ScallopAddress from 'src/models/scallopAddress/index.js';
import type { AddressesInterface } from 'src/models/scallopAddress/types.js';
import { createLiveConstantsSource } from 'src/models/scallopConstants/constantsSource.js';
import { noopLogger } from 'src/logger/index.js';

/**
 * `defaultValues.addresses` was declared on `ScallopAddressConstructorParams` but
 * never read by the constructor, so callers that bundled an address snapshot
 * still paid a blocking API round trip before any on-chain read could start.
 * These tests pin the contract that fixes it:
 *
 *   - a seed is honored synchronously (so nothing blocks on the network), and
 *   - a seed is NOT authoritative (so it is still reconciled in the background).
 *
 * The second half is what keeps this distinct from `forceAddressesInterface`;
 * without it, honoring the seed would silently pin stale contract addresses
 * across protocol upgrades. Network-free: `read()` is stubbed throughout.
 */

const ADDRESS_ID = 'test-address-id';

/** Minimal stand-ins — these tests care about identity, not address shape. */
const seedAddresses = {
  core: { object: '0xseed' },
} as unknown as AddressesInterface;
const forcedAddresses = {
  core: { object: '0xforced' },
} as unknown as AddressesInterface;
const fetchedAddresses = {
  core: { object: '0xfetched' },
} as unknown as AddressesInterface;

/** Build an address whose `read()` resolves with `fetchedAddresses`, without network. */
const makeAddress = (
  params: Partial<ConstructorParameters<typeof ScallopAddress>[0]> = {}
) => {
  const address = new ScallopAddress({
    addressId: ADDRESS_ID,
    network: 'mainnet',
    ...params,
  });
  const read = vi
    .spyOn(address.addressApiRepo, 'read')
    .mockResolvedValue({ id: ADDRESS_ID, mainnet: fetchedAddresses } as never);
  return { address, read };
};

describe('ScallopAddress defaultValues seeding', () => {
  it('honors defaultValues.addresses synchronously, with no read', () => {
    const { address, read } = makeAddress({
      defaultValues: { addresses: { mainnet: seedAddresses } },
    });

    // The whole point: usable before anything touches the network.
    expect(address.getAddresses('mainnet')).toEqual(seedAddresses);
    expect(read).not.toHaveBeenCalled();
  });

  it('marks a seeded network as seeded, so callers know to refresh it', () => {
    const { address } = makeAddress({
      defaultValues: { addresses: { mainnet: seedAddresses } },
    });

    expect(address.isSeeded('mainnet')).toBe(true);
    expect(address.isSeeded('testnet')).toBe(false);
  });

  it('treats forceAddressesInterface as authoritative, not a seed', () => {
    const { address } = makeAddress({
      forceAddressesInterface: { mainnet: forcedAddresses },
    });

    expect(address.getAddresses('mainnet')).toEqual(forcedAddresses);
    // Never refreshed — a forced interface is the caller's deliberate override.
    expect(address.isSeeded('mainnet')).toBe(false);
  });

  it('lets a force interface win over a seed for the same network', () => {
    const { address } = makeAddress({
      defaultValues: { addresses: { mainnet: seedAddresses } },
      forceAddressesInterface: { mainnet: forcedAddresses },
    });

    expect(address.getAddresses('mainnet')).toEqual(forcedAddresses);
    expect(address.isSeeded('mainnet')).toBe(false);
  });

  it('clears the seed mark once real addresses land', async () => {
    const { address } = makeAddress({
      defaultValues: { addresses: { mainnet: seedAddresses } },
    });

    await address.read();

    expect(address.getAddresses('mainnet')).toEqual(fetchedAddresses);
    // Refreshed, so a later ensureAddresses must not queue another read.
    expect(address.isSeeded('mainnet')).toBe(false);
  });
});

describe('ensureAddresses with a seeded address', () => {
  /** Deferred read, so we can observe whether `ensureAddresses` awaited it. */
  const makeDeferredAddress = (opts: { seeded: boolean }) => {
    let release!: () => void;
    const readStarted = vi.fn();
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    const address = {
      getAddresses: () => (opts.seeded ? seedAddresses : undefined),
      isSeeded: () => opts.seeded,
      read: vi.fn(async () => {
        readStarted();
        await gate;
        return {} as never;
      }),
    };

    return { address, release, readStarted };
  };

  it('resolves without waiting for the background refresh', async () => {
    const { address, release, readStarted } = makeDeferredAddress({
      seeded: true,
    });
    const source = createLiveConstantsSource({
      address: address as never,
      logger: noopLogger,
    });

    // Must not block: the refresh is in flight but ensureAddresses is already done.
    await source.ensureAddresses({ network: 'mainnet', force: false });

    expect(readStarted).toHaveBeenCalledTimes(1);
    release();
  });

  it('still awaits the read when there are no addresses at all', async () => {
    const { address, release } = makeDeferredAddress({ seeded: false });
    const source = createLiveConstantsSource({
      address: address as never,
      logger: noopLogger,
    });

    let settled = false;
    const pending = source
      .ensureAddresses({ network: 'mainnet', force: false })
      .then(() => {
        settled = true;
      });

    // Nothing to serve, so this MUST block until the read completes.
    await Promise.resolve();
    expect(settled).toBe(false);

    release();
    await pending;
    expect(settled).toBe(true);
  });
});
