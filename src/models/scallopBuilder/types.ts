import { SuiKitParams } from '@scallop-io/sui-kit';
import ScallopQuery from '../scallopQuery/index.js';
import { ScallopQueryConstructorParams } from '../scallopQuery/types.js';
import type { DistributiveOmit, DistributiveMerge } from 'src/types/utils.js';

// `DistributiveOmit` (not plain `Omit`) is load-bearing: plain `Omit` over the
// transport union collapses `SuiGrpcTransport | SuiGraphqlTransport` into one
// merged object, silently dropping the mutually-exclusive `readTransport` guard
// (so `readTransport: 'graphql'` + `suiClient` would wrongly typecheck at
// `new ScallopBuilder` / `new Scallop`). `DistributiveMerge` keeps the result a
// top-level union for the same reason. See `src/types/utils.ts`.
type ScallopBuilderBaseParams = DistributiveMerge<
  DistributiveOmit<ScallopQueryConstructorParams, 'walletAddress'>,
  {
    query?: ScallopQuery;
    usePythPullModel?: boolean;
    sponsoredFeeds?: string[];
    useOnChainXOracleList?: boolean;
  } & Omit<SuiKitParams, 'fullnodeUrls'>
>;

type ScallopBuilderWithQuery = DistributiveMerge<
  ScallopBuilderBaseParams,
  { query: ScallopQuery; walletAddress?: string }
>;

type ScallopBuilderWithWalletAddress = DistributiveMerge<
  ScallopBuilderBaseParams,
  { walletAddress: string }
>;

type ScallopBuilderWithSecretKey = DistributiveMerge<
  ScallopBuilderBaseParams,
  { secretKey: string | undefined; walletAddress?: never }
>;

type ScallopBuilderWithMnemonics = DistributiveMerge<
  ScallopBuilderBaseParams,
  { mnemonics: string | undefined; walletAddress?: never }
>;

export type ScallopBuilderConstructorParams =
  | ScallopBuilderWithQuery
  | ScallopBuilderWithWalletAddress
  | ScallopBuilderWithSecretKey
  | ScallopBuilderWithMnemonics;
