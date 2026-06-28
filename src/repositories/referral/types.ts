import { AddressesInterface } from 'src/types/address.js';
import { BaseContext, BaseRepoParams } from '../types.js';
import { OnChainDataSource } from 'src/datasources/onchain.js';

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
  onchain: OnChainDataSource;
  metadata: ReferralRepoMetadata;
};
export type ReferralRepoParams = BaseRepoParams & {
  onchain: OnChainDataSource;
  metadata: ReferralRepoMetadata;
};

/**
 * Narrowed context for `getVeScaKeyIdFromRefBindingsFromOnChain`: it reads only
 * `metadata.addresses.referral.bindingTableId`, plus the `onchain` /
 * `fetchWithCache` fields it forwards to `getDynamicFieldOrNull`.
 */
export type ReferralBindingContext = BaseContext & {
  onchain: OnChainDataSource;
  metadata: { addresses: ReferralAddresses<'bindingTableId'> };
};
