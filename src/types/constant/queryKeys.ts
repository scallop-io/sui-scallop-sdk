import { SuiClientTypes } from '@mysten/sui/client';
import type {
  SuiAmountsArg,
  SuiObjectArg,
  SuiTxArg,
} from '@scallop-io/sui-kit';
import type {
  GetDynamicFieldObjectParams,
  GetDynamicFieldsParams,
  SuiObjectData,
  SuiObjectDataOptions,
} from '../sui.js';

export namespace QueryKeys {
  export namespace API {
    export type GetAddresses = {
      addressId?: string;
    };
  }
  export namespace RPC {
    type BaseType = {
      node?: string;
    };

    export type GetInspectTxn = BaseType & {
      queryTarget?: string;
      args?: SuiObjectArg[];
      typeArgs?: any[];
      include?: SuiClientTypes.SimulateTransactionInclude;
    };
    export type GetObject = BaseType & {
      objectId?: string;
      include?: SuiObjectDataOptions;
    };
    export type GetObjects = BaseType & {
      objectIds?: string[];
      include?: SuiObjectDataOptions;
    };
    export type GetOwnedObjects = BaseType &
      Partial<SuiClientTypes.ListOwnedObjectsOptions>;
    export type GetDynamicFields = BaseType & Partial<GetDynamicFieldsParams>;
    // Native GraphQL dynamic-field read that returns names + inline values in one
    // paged query (Tier-2 optimization). Distinct cache entity from the
    // value-less `GetDynamicFields`, so it gets its own key.
    export type GetDynamicFieldsWithValues = BaseType & {
      parentId?: string;
      includeValue?: boolean;
    };
    // Native GraphQL aliased-batch dynamic-field read: N specific fields by name
    // in one query (Tier-2, for owner-key → global-table lookups). `names` is the
    // ordered list of base64 name bcs, so the cache key is order-sensitive.
    export type GetMultiDynamicFields = BaseType & {
      parentId?: string;
      names?: string[];
    };
    export type GetDynamicFieldObject = BaseType &
      Partial<GetDynamicFieldObjectParams>;
    export type getTotalVeScaTreasuryAmount = BaseType & {
      refreshArgs?: any[];
      veScaAmountArgs?: (
        | string
        | SuiObjectData
        | SuiTxArg
        | SuiAmountsArg
        | SuiObjectArg
      )[];
    };
    export type GetCoinBalance = BaseType & {
      address?: string;
      coinType?: string;
    };
    export type GetAllCoinBalances = BaseType & {
      activeAddress?: string;
    };
    export type GetCoinBalancesByTypes = BaseType & {
      address?: string;
      coinTypes?: string[];
    };
    export type GetNormalizedMoveFunction = BaseType & {
      target?: string;
    };
  }
}
