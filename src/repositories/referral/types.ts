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
