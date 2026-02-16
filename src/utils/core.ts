import type { SuiObjectData } from '../types/index.js';

export const parseObjectAs = <T>(object: SuiObjectData): T => {
  if (!(object && object.json))
    throw new Error(
      `Failed to parse object: ${JSON.stringify(object, null, 2)}`
    );

  const fields = (
    'fields' in object.json ? object.json.fields : object.json
  ) as any;

  if (typeof fields === 'object' && 'value' in fields) {
    const value = fields.value;
    if (typeof value === 'object' && 'fields' in value)
      return value.fields as T;
    return value as T;
  } else if (typeof fields === 'object') {
    return fields as T;
  }
  return fields as T;
};
