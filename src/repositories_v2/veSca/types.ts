import { SuiObjectRef } from 'src/types/sui.js';
import { AddressesInterface } from 'src/types/address.js';
import { BaseContext, BaseRepoArgs } from '../type.js';

// Derived from the canonical address schema (verbatim subset of the `vesca`
// branch) so a rename/retype upstream is a compile error here.
type VeScaKeys = 'id' | 'config' | 'tableId' | 'object' | 'treasury';
type VeScaAddresses<T extends VeScaKeys = VeScaKeys> = {
  veSca: Pick<AddressesInterface['vesca'], T>;
};

export type VeScaRepoMetadata = {
  addresses: VeScaAddresses;
};

export type VeScaRepoContext = BaseContext & {
  metadata: VeScaRepoMetadata;
};

/**
 * Minimal context required by `getVeScaDataFromOnChain`. Both `VeScaRepoContext`
 * and other domain contexts (e.g. veScaLoyaltyProgram) structurally satisfy it,
 * since all it needs is `metadata.addresses.veSca.tableId`.
 */
export type VeScaDataContext = BaseContext & {
  metadata: { addresses: VeScaAddresses<'tableId'> };
};

/** Minimal context for reading all veScas owned by an address. */
export type VeScasByAddressContext = BaseContext & {
  metadata: { addresses: VeScaAddresses<'tableId' | 'object'> };
};

/** Minimal context for reading veSca treasury info. */
export type VeScaTreasuryContext = BaseContext & {
  metadata: { addresses: VeScaAddresses<'id' | 'config' | 'treasury'> };
};
export type VeScaRepoArgs = BaseRepoArgs & {
  metadata: VeScaRepoMetadata;
};

export type VeSca = {
  id: string;
  keyId: string;
  keyObject?: SuiObjectRef;
  object: SuiObjectRef;
  lockedScaAmount: string;
  lockedScaCoin: number;
  currentVeScaBalance: number;
  unlockAt: number;
};

export type VeScaTreasuryFields = {
  total_ve_sca_amount: string;
  sca_balance: string;
  unlock_schedule: {
    locked_sca_amount: string;
  };
};

export type VeScaTreasuryInfo = {
  totalLockedSca: number;
  totalVeSca: number;
  averageLockingPeriod: number;
  averageLockingPeriodUnit: string;
};
