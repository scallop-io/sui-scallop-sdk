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
    export type GetSharedObject = BaseType & {
      objectId?: string;
    };
    export type GetObjects = BaseType & SuiClientTypes.GetObjectsOptions;
    export type GetOwnedObjects = BaseType &
      Partial<SuiClientTypes.ListOwnedObjectsOptions>;
    export type GetDynamicFields = BaseType & Partial<GetDynamicFieldsParams>;
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
    export type GetNormalizedMoveFunction = BaseType & {
      target?: string;
    };
  }
}
