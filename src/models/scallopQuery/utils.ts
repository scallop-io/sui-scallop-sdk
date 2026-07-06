/** Project a record down to the requested keys, dropping missing entries. */
export const pickRecord = <T>(
  record: Record<string, T | undefined>,
  names: string[]
): Record<string, T> =>
  names.reduce(
    (acc, name) => {
      const value = record[name];
      if (value !== undefined) acc[name] = value;
      return acc;
    },
    {} as Record<string, T>
  );
