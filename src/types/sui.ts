import type { SuiClientTypes } from '@mysten/sui/client';

/** Sui Object with content and json (from getObject, listOwnedObjects, etc.) */
export type SuiObjectData = SuiClientTypes.Object<{
  content: true;
  json: true;
}>;

/**
 * SDK v2 GetObjectResponse format
 * getObject, getDynamicField, etc. return { object: Object | null }
 */
export type SuiObjectResponse = {
  object: SuiObjectData | null;
};

/** Move object parsed content (dataType, fields structure) */
export type SuiParsedData = {
  dataType?: string;
  type?: string;
  hasPublicTransfer?: boolean;
  fields?: Record<string, unknown>;
};

export type SuiObjectRef = {
  objectId: string;
  version: number | string;
  digest: string;
};

/** Sui object response with move object content (queryGetObject / queryGetDynamicFieldObject) */
export type SuiObjectResponseWithMoveContent = {
  data?: {
    content?: {
      dataType?: string;
      fields?: Record<string, unknown>;
    };
  };
};

/** Paginated objects response (listDynamicFields, getOwnedObjects, etc.) */
export type PaginatedObjectsResponse<T = unknown> = {
  objects?: T[];
  hasNextPage?: boolean;
  nextCursor?: string | null;
};

/** Extract parsedJson from queryInspectTxn result (Transaction.events[0].parsedJson) */
export type InspectTxnParsedJson<T> =
  | {
      Transaction?: {
        events?: Array<{ parsedJson?: T }>;
      };
      commandResults?: unknown;
    }
  | null
  | undefined;

// SDK v2 API parameter types
export type GetBalanceParams = { owner: string; coinType?: string | null };
export type GetDynamicFieldObjectParams = { parentId: string; name: any };
export type GetDynamicFieldsParams = {
  parentId: string;
  cursor?: string | null;
  limit?: number | null;
};
export type GetOwnedObjectsParams = {
  owner: string;
  filter?: any;
  options?: SuiClientTypes.ObjectInclude;
  cursor?: string | null;
  limit?: number | null;
};

// SDK v2 response types
export type CoinBalance = {
  coinType: string;
  balance: string;
  coinBalance?: bigint;
  addressBalance?: bigint;
};
export type DevInspectResults = SuiClientTypes.SimulateTransactionResult<{
  effects: true;
  events: true;
  balanceChanges: true;
  commandResults: true;
}>;
export type DynamicFieldPage = SuiClientTypes.ListDynamicFieldsResponse;
export type SuiObjectDataOptions = SuiClientTypes.ObjectInclude;

// Dynamic field types
export type DynamicFieldName = {
  type: string;
  value: any;
};
export type DynamicFieldInfo = {
  name: DynamicFieldName;
  objectType: string;
  objectId: string;
  version: string;
  digest: string;
};
