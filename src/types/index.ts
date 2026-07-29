// Root types barrel. Delegates to the public surface for back-compat — every
// type previously reachable from `src/types/index.js` is still reachable here.
// Internal-only types live under `src/types/internal/` and are intentionally
// not re-exported via this barrel.
export type * from './public/index.js';
