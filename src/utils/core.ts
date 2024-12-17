import { SuiObjectData } from '@mysten/sui/client';

export const parseObjectAs = <T>(object: SuiObjectData): T => {
  if (!(object && object.content && 'fields' in object.content))
    throw new Error(`Failed to parse object`);

  const value = (object.content.fields as any).value;
  if (typeof value === 'object' && 'fields' in value)
    return (object.content.fields as any).value.fields as T;
  return value as T;
};
