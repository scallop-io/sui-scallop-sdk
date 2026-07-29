// Root types barrel. Delegates to the public surface; every public type is
// reachable here. Internal-only types live under `src/types/internal/` and are
// intentionally not re-exported via this barrel.
export type * from './public/index.js';
