import { PoolAddress } from 'src/repositories/poolAddresses/types.js';
import { DEFAULT_WHITELIST } from './const.js';
import { Whitelist } from './types.js';

const cloneDefaultWhitelist = (): Whitelist =>
  Object.fromEntries(
    Object.entries(DEFAULT_WHITELIST).map(([key, set]) => [key, new Set(set)])
  ) as Whitelist;

const readonlySet = <T>(values: Iterable<T>): Set<T> => {
  const set = new Set(values);
  const throwReadonlyMutation = () => {
    throw new TypeError('Cannot mutate readonly ScallopConstants whitelist');
  };

  Object.defineProperties(set, {
    add: { value: throwReadonlyMutation },
    clear: { value: throwReadonlyMutation },
    delete: { value: throwReadonlyMutation },
  });

  return Object.freeze(set);
};

const freezeWhitelist = (whitelist: Whitelist): Whitelist =>
  Object.freeze(
    Object.fromEntries(
      Object.entries(whitelist).map(([key, value]) => [key, readonlySet(value)])
    ) as Whitelist
  );

const freezePoolAddresses = (
  poolAddresses: Record<string, PoolAddress | undefined>
): Record<string, PoolAddress | undefined> =>
  Object.freeze(
    Object.fromEntries(
      Object.entries(poolAddresses).map(([key, value]) => [
        key,
        value ? Object.freeze({ ...value }) : undefined,
      ])
    )
  ) as Record<string, PoolAddress | undefined>;

const parseWhitelistParams = (
  params: Record<string, any> | Whitelist
): Whitelist => {
  const merged = cloneDefaultWhitelist();
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      merged[key as keyof Whitelist] = new Set(value);
    } else if (value instanceof Set) {
      merged[key as keyof Whitelist] = new Set(value);
    }
  }
  return freezeWhitelist(merged);
};

const isEmptyObject = (obj: object) => {
  return Object.keys(obj).length === 0;
};

export {
  cloneDefaultWhitelist,
  freezeWhitelist,
  freezePoolAddresses,
  parseWhitelistParams,
  isEmptyObject,
};
