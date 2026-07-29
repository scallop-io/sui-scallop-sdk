import { SuiClientTypes } from '@mysten/sui/client';
import { SuiObjectArg, SuiTxBlock } from '@scallop-io/sui-kit';
import { GrpcDataSource } from 'src/datasources/grpc.js';
import type { SuiObjectData, SuiObjectRef } from 'src/types/index.js';
import { z } from 'zod';
import { FetchWithCache } from './cache.js';
import { queryKeys } from 'src/constants/queryKeys.js';

const DYNAMIC_FIELD_TYPE_PREFIX =
  '0x0000000000000000000000000000000000000000000000000000000000000002::dynamic_field::Field';

type SharedObjectData = {
  objectId: string;
  initialSharedVersion: string;
};

type ObjectJson = NonNullable<SuiObjectData['json']>;

type DynamicFieldInfo = {
  objectId: string;
  name: string;
  nameKind: 'type' | 'id' | 'bytes' | 'string';
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isSharedOwner = (
  owner: unknown
): owner is { $kind: 'Shared'; Shared: { initialSharedVersion: unknown } } => {
  if (!isObjectRecord(owner)) return false;
  if (owner.$kind !== 'Shared') return false;
  if (!('Shared' in owner) || !isObjectRecord(owner.Shared)) return false;
  return 'initialSharedVersion' in owner.Shared;
};

function assertObjectJson(
  object: SuiObjectData
): asserts object is SuiObjectData & { json: ObjectJson } {
  if (!object?.json) {
    throw new Error(
      `Failed to parse object: ${JSON.stringify(object, null, 2)}`
    );
  }
}

/**
 * Recursively unwrap JSON-RPC Move struct format `{ type: string, fields: {...} }`
 * into flat fields, matching the gRPC response format.
 */
const unwrapMoveJson = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(unwrapMoveJson);
  }
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    if (
      'type' in record &&
      'fields' in record &&
      typeof record.type === 'string'
    ) {
      return unwrapMoveJson(record.fields);
    }
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(record)) {
      result[key] = unwrapMoveJson(val);
    }
    return result;
  }
  return value;
};

const getObjectFields = (object: SuiObjectData): unknown => {
  assertObjectJson(object);
  const objectJson = object.json;
  const fields = 'fields' in objectJson ? objectJson.fields : objectJson;
  return unwrapMoveJson(fields);
};

const parseObjectData = (data: SuiObjectData) => {
  if (isSharedOwner(data.owner)) {
    return {
      objectId: data.objectId,
      initialSharedVersion: String(data.owner.Shared.initialSharedVersion),
    } satisfies SharedObjectData;
  }

  // throw new Error('Invalid shared object data');
  return data;
};

/**
 * Convert an object or object reference into a shared object if possible.
 * Else return the original object reference.
 * @param tx
 * @param param1
 * @returns
 */
export const asSharedObject = (
  tx: SuiTxBlock,
  {
    obj,
    mutable = false,
  }: {
    obj:
      | string
      | SuiObjectRef
      | SuiObjectArg
      | SuiObjectData
      | {
          objectId: string;
          initialSharedVersion: string;
        };
    mutable?: boolean;
  }
): SuiObjectArg => {
  if (typeof obj === 'object' && 'initialSharedVersion' in obj) {
    return tx.sharedObjectRef({
      objectId: obj.objectId,
      initialSharedVersion: obj.initialSharedVersion.toString(),
      mutable,
    });
  } else if (typeof obj === 'object' && 'objectId' in obj) {
    return tx.object(obj.objectId);
  } else if (typeof obj === 'string') {
    return tx.object(obj);
  }

  return obj;
};

export const getSharedObjectData = async (
  // Take the whole data source (not a destructured `getObject`): `getObject` is a
  // class method that reads `this.client`, so destructuring it here would drop the
  // `this` binding and throw "Cannot read properties of undefined (reading 'client')".
  {
    grpc,
    fetchWithCache,
  }: {
    grpc: GrpcDataSource;
    fetchWithCache: FetchWithCache;
  },
  {
    tx,
    objectId,
    mutable = false,
    include,
  }: {
    tx: SuiTxBlock;
    objectId: string | SuiObjectData | SuiObjectRef | SuiObjectArg;
    mutable?: boolean;
    include?: SuiClientTypes.ObjectInclude;
  }
) => {
  let parsed;
  // Handle string
  if (typeof objectId === 'string') {
    const objectData = await fetchWithCache({
      // Canonical object-read key (include-aware) so this shared-object fetch
      // shares one cache entry with plain `getObject` reads of the same object,
      // letting `fetchWithCache` dedupe identical in-flight requests.
      queryKey: queryKeys.rpc.getObject({
        objectId,
        include,
        node: grpc.url,
      }),
      queryFn: () =>
        grpc.getObject({
          objectId,
          include,
        }),
    });
    if (!objectData?.object) {
      throw new Error('Failed to get object data');
    }
    parsed = parseObjectData(objectData.object);
  } else if ('objectId' in objectId && 'owner' in objectId) {
    parsed = parseObjectData(objectId);
  }

  return asSharedObject(tx, { obj: parsed ?? objectId, mutable });
};

const dynamicFieldNameZod = z.union([
  z.string(),
  z.object({
    name: z.string(),
  }),
  z.object({
    id: z.string(),
  }),
  z.object({
    bytes: z.string(),
  }),
  z.record(z.unknown()),
]);

const dynamicFieldIdZod = z.union([z.string(), z.object({ id: z.string() })]);

const dynamicFieldZod = z.object({
  id: dynamicFieldIdZod,
  name: dynamicFieldNameZod,
  value: z.unknown().optional(),
});

type DynamicField = z.infer<typeof dynamicFieldZod>;
type DynamicFieldName = z.infer<typeof dynamicFieldNameZod>;

const isDfObject = (object: SuiObjectData): boolean => {
  return object.type.startsWith(DYNAMIC_FIELD_TYPE_PREFIX);
};

const isDynamicField = (field: unknown): field is DynamicField => {
  const { success } = dynamicFieldZod.safeParse(field);
  if (success) {
    return true;
  }
  // if (error) {
  //   console.error('Failed to parse dynamic field value', { field, error });
  // }
  return false;
};

const extractDfId = (id: string | { id: string }): string => {
  return typeof id === 'string' ? id : id.id;
};

const parseDynamicFieldValue = <T>(fields: T): T => {
  if (!isDynamicField(fields)) {
    throw new Error(
      `Invalid dynamic field data: ${JSON.stringify(fields, null, 2)}`
    );
  }
  const { value } = fields as DynamicField & { value: T };
  return value as T;
};

const parseDynamicFieldName = (name: DynamicFieldName): string | undefined => {
  if (typeof name === 'string') return name;
  if (!isObjectRecord(name)) return undefined;
  const recordName = name as Record<string, unknown>;
  const parsedName = recordName.name;
  const parsedId = recordName.id;
  const parsedBytes = recordName.bytes;
  if (typeof parsedName === 'string') return parsedName;
  if (typeof parsedId === 'string') return parsedId;
  if (typeof parsedBytes === 'string') return parsedBytes;
  return undefined;
};

const getNameKind = (name: DynamicFieldName): DynamicFieldInfo['nameKind'] => {
  if (typeof name === 'string') {
    if (name.includes('::')) return 'type';
    return 'string';
  }

  if (!isObjectRecord(name)) return 'string';

  const recordName = name as Record<string, unknown>;
  if (typeof recordName.id === 'string') return 'id';
  if (typeof recordName.bytes === 'string') return 'bytes';

  const nameValue = recordName.name;
  if (typeof nameValue === 'string' && nameValue.includes('::')) return 'type';
  return 'string';
};

/**
 * Parse the object data's json into expected type.
 * Note: For dynamic field object, it will unwrap the nested value and return the inner fields.
 * @param object
 * @returns
 */
export const parseObjectAs = <T>(object: SuiObjectData): T => {
  const fields = getObjectFields(object);

  // Only unwraps nested value if the object type is a dynamic field
  if (isDfObject(object) && typeof fields === 'object') {
    return parseDynamicFieldValue(fields as T);
  }
  return fields as T;
};

export const getDfObjectIdAndName = (
  object: SuiObjectData
): DynamicFieldInfo => {
  if (!isDfObject(object)) {
    throw new Error(`Object ${object.objectId} is not a dynamic field object`);
  }

  const fields = getObjectFields(object);

  if (isDynamicField(fields)) {
    const name = parseDynamicFieldName(fields.name);
    if (!name) {
      throw new Error(
        `Failed to parse dynamic field name from object ${object.objectId}: ${JSON.stringify(
          fields.name,
          null,
          2
        )}`
      );
    }

    return {
      objectId: extractDfId(fields.id),
      name,
      nameKind: getNameKind(fields.name),
    };
  }
  throw new Error(
    `Failed to parse dynamic field object ${object.objectId}, invalid fields: ${JSON.stringify(
      fields,
      null,
      2
    )}`
  );
};
