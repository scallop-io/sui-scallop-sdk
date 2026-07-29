import { AddressesInterface } from 'src/types/address.js';
import { BaseContext, BaseRepoParams } from '../types.js';
import { GrpcDataSource } from 'src/datasources/grpc.js';

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
  grpc: GrpcDataSource;
  metadata: ReferralRepoMetadata;
};
export type ReferralRepoParams = BaseRepoParams & {
  grpc: GrpcDataSource;
  metadata: ReferralRepoMetadata;
};

/**
 * Narrowed context for `getVeScaKeyIdFromRefBindingsFromOnChain`: it reads only
 * `metadata.addresses.referral.bindingTableId`, plus the `onchain` /
 * `fetchWithCache` fields it forwards to `getDynamicFieldOrNull`.
 */
export type ReferralBindingContext = BaseContext & {
  grpc: GrpcDataSource;
  metadata: { addresses: ReferralAddresses<'bindingTableId'> };
};
