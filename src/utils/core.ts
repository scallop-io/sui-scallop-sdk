import { SuiObjectData } from '@mysten/sui/client';

export const parseObjectAs = <T>(object: SuiObjectData): T => {
  if (!(object && object.content && 'fields' in object.content))
    throw new Error(`Failed to parse object ${object}`);

  const fields = object.content.fields as any;

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
