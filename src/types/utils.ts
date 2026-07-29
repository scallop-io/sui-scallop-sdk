export type OptionalKeys<T> = {
  [K in keyof T]?: T[K];
};

export type CoinPrices = OptionalKeys<Record<string, number>>;

/**
 * `Omit` that distributes over a union. Plain `Omit<A | B, K>` collapses the
 * union into a single merged object (it is `Pick<T, Exclude<keyof T, K>>`),
 * which destroys discriminated-union guards — e.g. the mutually-exclusive
 * `readTransport` transport union in `ScallopUtilsConstructorParams`. This
 * variant maps over each member so the discriminant survives.
 */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/**
 * Intersect every member of a (possibly discriminated) union `U` with `T`,
 * keeping the union at the top level. `U & T` written directly is stored as an
 * intersection whose `keyof`/`Omit` behavior flattens the union; distributing
 * the intersection preserves each member so downstream `DistributiveOmit` and
 * assignability checks keep discriminating.
 */
export type DistributiveMerge<U, T> = U extends unknown ? U & T : never;
