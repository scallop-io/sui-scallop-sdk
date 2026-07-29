import { BaseContext, BaseRepoParams } from '../types.js';
import { GrpcDataSource } from '../../datasources/grpc.js';
import { GraphQLDataSource } from '../../datasources/graphql/index.js';

export type FlashloanRepoContext = BaseContext & {
  grpc: GrpcDataSource;
  metadata: FlashloanMetadata;
  graphql?: GraphQLDataSource;
  preferGraphql?: boolean;
};

export type FlashloanRepoParams = BaseRepoParams & {
  grpc: GrpcDataSource;
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
