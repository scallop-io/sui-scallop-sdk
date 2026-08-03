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

/**
 * Compatibility shim for bad `/pool/whitelist` data — NOT a general rule.
 *
 * The endpoint currently returns the pool's *coin* name in the `scoin` set for
 * `scasui`, whose sCoin is really `sscasui`. Everything else — pool addresses,
 * `scoin.coins.*` addresses, the derived `sCoinTypes` — already says `sscasui`,
 * so the whitelist is the single wrong copy and `parseSCoinType('scasui')`
 * misses. Rewrite those entries from the authoritative `sCoinName` on the pool
 * address so the whitelist agrees with the rest of the snapshot.
 *
 * Delete this once `/pool/whitelist` emits `sscasui`; it exists only to keep
 * the SDK working against the endpoint as it is deployed today.
 */
const normalizeSCoinWhitelist = (
  whitelist: Whitelist,
  poolAddresses: Record<string, PoolAddress | undefined>
): Whitelist => {
  const scoin = [...whitelist.scoin].map(
    (name) => poolAddresses[name]?.sCoinName ?? name
  );
  if (scoin.every((name) => whitelist.scoin.has(name))) return whitelist;
  return freezeWhitelist({ ...whitelist, scoin: new Set(scoin) });
};

const isEmptyObject = (obj: object) => {
  return Object.keys(obj).length === 0;
};

export {
  cloneDefaultWhitelist,
  freezeWhitelist,
  freezePoolAddresses,
  parseWhitelistParams,
  normalizeSCoinWhitelist,
  isEmptyObject,
};
