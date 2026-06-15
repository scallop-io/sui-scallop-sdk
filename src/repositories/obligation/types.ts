import { BaseContext, BaseRepoArgs } from '../types.js';

type ObligationKeys =
  | 'protocolObjectId'
  | 'queryPackageId'
  | 'version'
  | 'market';
export type ObligationAddresses<T extends ObligationKeys = ObligationKeys> =
  Record<T, string>;

export type ObligationRepoMetadata = {
  addresses: ObligationAddresses;
};
export type ObligationRepoContext = BaseContext & {
  metadata: ObligationRepoMetadata;
};

export type ObligationRepoArgs = BaseRepoArgs & {
  metadata: ObligationRepoMetadata;
};

/** Minimal context for `queryObligationData`. */
export type ObligationDataContext = BaseContext & {
  metadata: {
    addresses: ObligationAddresses<'queryPackageId' | 'version' | 'market'>;
  };
};

/** Minimal context for listing obligations owned by an address. */
export type ObligationsContext = BaseContext & {
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
