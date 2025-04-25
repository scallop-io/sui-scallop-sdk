import type {
  GetDynamicFieldObjectParams,
  GetDynamicFieldsParams,
  GetOwnedObjectsParams,
  SuiObjectData,
  SuiObjectDataOptions,
} from '@mysten/sui/dist/cjs/client';
import type { SuiObjectArg, SuiTxArg } from '@scallop-io/sui-kit';

export namespace QueryKeys {
  export namespace API {
    export type GetAddresses = {
      addressId?: string;
    };
  }
  export namespace RPC {
    type BaseType = {
      node: string;
    };

    export type GetInspectTxn = BaseType & {
      queryTarget?: string;
      args?: SuiObjectArg[];
      typeArgs?: any[];
    };
    export type GetObject = BaseType & {
      objectId?: string;
      options?: SuiObjectDataOptions;
    };
    export type GetObjects = BaseType & {
      objectIds?: string[];
    };
    export type GetOwnedObjects = BaseType & Partial<GetOwnedObjectsParams>;
    export type GetDynamicFields = BaseType & Partial<GetDynamicFieldsParams>;
    export type GetDynamicFieldObject = BaseType &
      Partial<GetDynamicFieldObjectParams>;
    export type getTotalVeScaTreasuryAmount = BaseType & {
      refreshArgs?: any[];
      vescaAmountArgs?: (string | SuiObjectData | SuiTxArg)[];
    };
    export type GetAllCoinBalances = BaseType & {
      activeAddress?: string;
    };
    export type GetNormalizedMoveFunction = BaseType & {
      target?: string;
    };
  }
}
