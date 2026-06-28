export type MoveTypeName =
  | string
  | {
      name?: MoveTypeName;
      address?: string;
      module?: string;
      typeParams?: MoveTypeName[];
      typeParameters?: MoveTypeName[];
    };

export type TypeNameField = {
  name: MoveTypeName;
};
