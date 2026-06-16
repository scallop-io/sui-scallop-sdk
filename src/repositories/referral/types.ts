import { AddressesInterface } from 'src/types/address.js';
import { BaseContext, BaseRepoArgs } from '../types.js';

type ReferralAddresses<
  T extends keyof AddressesInterface['referral'] =
    keyof AddressesInterface['referral'],
> = {
  referral: Pick<AddressesInterface['referral'], T>;
};

export type ReferralRepoMetadata = {
  addresses: ReferralAddresses<'bindingTableId'>;
};

export type ReferralRepoContext = BaseContext & {
  metadata: ReferralRepoMetadata;
};
export type ReferralRepoArgs = BaseRepoArgs & {
  metadata: ReferralRepoMetadata;
};

/**
 * Narrowed context for `getVeScaKeyIdFromRefBindingsFromOnChain`: it reads only
 * `metadata.addresses.referral.bindingTableId`, plus the `onchain` /
 * `fetchWithCache` fields it forwards to `getDynamicFieldOrNull`.
 */
export type ReferralBindingContext = BaseContext & {
  metadata: { addresses: ReferralAddresses<'bindingTableId'> };
};
