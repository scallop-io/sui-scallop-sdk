import { BaseContext, BaseRepoParams } from '../types.js';
import { OnChainDataSource } from '../../datasources/onchain.js';
import { GraphQLDataSource } from '../../datasources/graphql.js';

export type FlashloanRepoContext = BaseContext & {
  onchain: OnChainDataSource;
  metadata: FlashloanMetadata;
  graphql?: GraphQLDataSource;
  preferGraphql?: boolean;
};

export type FlashloanRepoParams = BaseRepoParams & {
  onchain: OnChainDataSource;
  metadata: FlashloanMetadata;
  graphql?: GraphQLDataSource;
  preferGraphql?: boolean;
};

/** Context for the native GraphQL flashloan-fee read (requires `graphql`). */
export type FlashloanGraphQLContext = FlashloanRepoContext & {
  graphql: GraphQLDataSource;
};

export type FlashloanMetadata = {
  coinTypeToCoinNameMap: ReadonlyMap<string, string>;
};
