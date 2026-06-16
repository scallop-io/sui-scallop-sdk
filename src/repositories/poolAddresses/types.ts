import { ApiDataSource } from 'src/datasources/api.js';
import { BaseContext, BaseRepoArgs } from '../types.js';
import { AddressesInterface } from 'src/types/address.js';

type PoolAddressesAddresses = {
  core: Pick<AddressesInterface['core'], 'coins' | 'market'>;
  spool: Pick<AddressesInterface['spool'], 'pools'>;
  scoin: Pick<AddressesInterface['scoin'], 'coins'>;
};

export type PoolAddressesRepoMetadata = {
  addresses: PoolAddressesAddresses;
};

export type PoolAddressesRepoArgs = BaseRepoArgs & {
  metadata: PoolAddressesRepoMetadata;
  api: ApiDataSource;
};

export type PoolAddressesRepoContext = BaseContext & {
  metadata: PoolAddressesRepoMetadata;
  api: ApiDataSource;
};

/** Minimal context for the API-sourced pool-addresses read. */
export type PoolAddressesApiContext = Pick<
  PoolAddressesRepoContext,
  'api' | 'fetchWithCache'
>;

/** Minimal context for the on-chain pool-addresses rebuild. */
export type PoolAddressesOnChainContext = Pick<
  PoolAddressesRepoContext,
  'onchain' | 'fetchWithCache' | 'metadata' | 'logger'
>;

export type PoolAddress = {
  coinName: string;
  symbol: string;
  coinType: string;
  coinMetadataId: string;
  decimals: number;
  isIsolated: boolean;
  // optional keys
  pythFeed?: string;
  pythFeedObjectId?: string;
  lendingPoolAddress?: string;
  borrowDynamic?: string;
  interestModel?: string;
  borrowFeeKey?: string;
  flashloanFeeObject?: string;
  coinGeckoId?: string;
  collateralPoolAddress?: string; // not all pool has collateral
  riskModel?: string;
  supplyLimitKey?: string;
  borrowLimitKey?: string;
  sCoinType?: string;
  sCoinName?: string;
  sCoinSymbol?: string;
  sCoinMetadataId?: string;
  sCoinTreasury?: string;
  isolatedAssetKey: string;
  spool?: string;
  spoolReward?: string;
  spoolName?: string;
};
