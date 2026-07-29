import { normalizeStructTag } from '@mysten/sui/utils';
import { ScallopParseError } from 'src/errors/index.js';
import type { MoveTypeName } from 'src/types/internal/index.js';

export const parseMoveTypeName = (typeName: MoveTypeName | unknown): string => {
  if (typeof typeName === 'string') return normalizeStructTag(typeName);

  if (typeName && typeof typeName === 'object') {
    const type = typeName as {
      address?: string;
      module?: string;
      name?: unknown;
      typeParams?: unknown[];
      typeParameters?: unknown[];
    };

    if (type.address && type.module && typeof type.name === 'string') {
      const typeParams = (type.typeParams ?? type.typeParameters ?? []).map(
        (param) => parseMoveTypeName(param)
      );
      const renderedTypeParams = typeParams.length
        ? `<${typeParams.join(',')}>`
        : '';

      return normalizeStructTag(
        `${type.address}::${type.module}::${type.name}${renderedTypeParams}`
      );
    }

    if (type.name) return parseMoveTypeName(type.name);
  }

  throw new ScallopParseError(
    `Invalid Move type name: ${JSON.stringify(typeName)}`,
    { context: { payload: typeName } }
  );
};

export const mapTypeNameField = (field: unknown, context: string): string => {
  try {
    return parseMoveTypeName(field);
  } catch (cause) {
    throw new ScallopParseError(`Failed to map Move type at ${context}`, {
      cause,
      context: { path: context },
    });
  }
};
