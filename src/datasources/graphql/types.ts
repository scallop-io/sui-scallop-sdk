type MultiGetBalancesResult = {
  address: {
    multiGetBalances: {
      coinType: { repr: string };
      totalBalance: string | null;
      coinBalance: string | null;
      addressBalance: string | null;
    }[];
  } | null;
};

type MultiGetBalancesVariables = {
  address: string;
  coinTypes: string[];
};

// Single shape with all selected fields optional, discriminated at runtime on
// `__typename`. A proper `MoveValue | MoveObject | Other` union would defeat
// narrowing here (an `{ __typename: string }` member widens the discriminant),
// so we keep one shape and branch on the string.
type DynamicFieldValueNode = {
  __typename: string;
  // MoveValue
  bcs?: string | null;
  json?: unknown;
  type?: { repr: string } | null;
  // MoveObject
  address?: string;
  contents?: {
    bcs: string | null;
    json: unknown;
    type: { repr: string } | null;
  } | null;
} | null;

/**
 * One normalized dynamic-field entry with its value resolved inline. `fieldId`
 * is derived exactly as the Sui SDK's own GraphQL Core does
 * (`deriveDynamicFieldID`), so it matches the `fieldId` that Core
 * `listDynamicFields` would return for the same field.
 */
type GraphQLDynamicField = {
  /** Derived dynamic-field object id (matches Core `listDynamicFields`). */
  fieldId: string;
  /** Field key: Move type repr + base64 BCS bytes of the name. */
  name: { type: string; bcs: string };
  /** Value Move type repr. */
  valueType: string;
  /** True for dynamic OBJECT fields (value is a separately-stored object). */
  isDynamicObject: boolean;
  /** Referenced object id, for dynamic object fields only. */
  childId?: string;
  /** Base64 BCS of the value (`MoveValue.bcs` / `MoveObject.contents.bcs`). */
  valueBcs: string | null;
  /** JSON of the value (`MoveValue.json` / `MoveObject.contents.json`). */
  valueJson: unknown;
};

export type {
  MultiGetBalancesResult,
  MultiGetBalancesVariables,
  DynamicFieldValueNode,
  GraphQLDynamicField,
};
