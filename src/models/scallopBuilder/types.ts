import { SuiKitParams } from '@scallop-io/sui-kit';
import ScallopQuery from '../scallopQuery/index.js';
import { ScallopQueryConstructorParams } from '../scallopQuery/types.js';

type ScallopBuilderBaseParams = {
  query?: ScallopQuery;
  usePythPullModel?: boolean;
  sponsoredFeeds?: string[];
  useOnChainXOracleList?: boolean;
} & Omit<ScallopQueryConstructorParams, 'walletAddress'> &
  Omit<SuiKitParams, 'fullnodeUrls'>;

type ScallopBuilderWithQuery = ScallopBuilderBaseParams & {
  query: ScallopQuery;
  walletAddress?: string;
};

type ScallopBuilderWithWalletAddress = ScallopBuilderBaseParams & {
  walletAddress: string;
};

type ScallopBuilderWithSecretKey = ScallopBuilderBaseParams & {
  secretKey: string | undefined;
  walletAddress?: never;
};

type ScallopBuilderWithMnemonics = ScallopBuilderBaseParams & {
  mnemonics: string | undefined;
  walletAddress?: never;
};

export type ScallopBuilderConstructorParams =
  | ScallopBuilderWithQuery
  | ScallopBuilderWithWalletAddress
  | ScallopBuilderWithSecretKey
  | ScallopBuilderWithMnemonics;
