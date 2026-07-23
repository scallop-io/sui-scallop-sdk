import { BaseContext, BaseRepoParams } from '../types.js';
import { GrpcDataSource } from 'src/datasources/grpc.js';
import { GraphQLDataSource } from 'src/datasources/graphql/index.js';

type ObligationKeys =
  | 'protocolObjectId'
  | 'queryPackageId'
  | 'version'
  | 'market';

type ObligationNamingAddresses = {
  obligationNaming: {
    registryTableId: string;
  };
};

export type ObligationAddresses<T extends ObligationKeys = ObligationKeys> =
  Record<T, string>;

export type ObligationRepoMetadata = {
  addresses: ObligationAddresses & ObligationNamingAddresses;
};
export type ObligationRepoContext = BaseContext & {
  grpc: GrpcDataSource;
  metadata: ObligationRepoMetadata;
  graphql?: GraphQLDataSource;
  preferGraphql?: boolean;
};

export type ObligationRepoParams = BaseRepoParams & {
  grpc: GrpcDataSource;
  metadata: ObligationRepoMetadata;
  graphql?: GraphQLDataSource;
  preferGraphql?: boolean;
};

/** Minimal context for `queryObligationData`. */
export type ObligationDataContext = BaseContext & {
  grpc: GrpcDataSource;
  metadata: {
    addresses: ObligationAddresses<'queryPackageId' | 'version' | 'market'>;
  };
};

/** Minimal context for `getObligationNameByObligationId`. */
export type ObligationNamingContext = BaseContext & {
  grpc: GrpcDataSource;
  metadata: {
    addresses: ObligationNamingAddresses &
      Pick<ObligationAddresses, 'protocolObjectId'>;
  };
  graphql?: GraphQLDataSource;
  preferGraphql?: boolean;
};

/** Naming context with a required GraphQL source, for the aliased-batch read. */
export type ObligationNamingGraphQLContext = ObligationNamingContext & {
  graphql: GraphQLDataSource;
};

/** Minimal context for listing obligations owned by an address. */
export type ObligationsContext = BaseContext & {
  grpc: GrpcDataSource;
  metadata: { addresses: ObligationAddresses<'protocolObjectId'> };
};

export type Obligation = { id: string; keyId: string; locked: boolean };

/**
 * The query interface for `obligation_query::obligation_data` inspectTxn.
 */
export interface ObligationQueryInterface {
  collaterals: {
    type: {
      name: string;
    };
    amount: string;
  }[];
  debts: {
    type: {
      name: string;
    };
    amount: string;
    borrowIndex: string;
  }[];
}

export type MappedObligationQueryData = {
  collaterals: Array<
    Omit<ObligationQueryInterface['collaterals'][number], 'type'> & {
      type: string;
    }
  >;
  debts: Array<
    Omit<ObligationQueryInterface['debts'][number], 'type'> & {
      type: string;
    }
  >;
};
