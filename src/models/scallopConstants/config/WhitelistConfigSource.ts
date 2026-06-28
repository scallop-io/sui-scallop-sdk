// Import directly from the defining module (not the `src/types` barrel) to
// avoid a circular chunk dependency: `Whitelist` is declared in
// `scallopConstants/types.ts`, and routing through `src/types/constant/index.ts`
// (which re-exports it) makes the two modules mutually dependent at build time.
import type { Whitelist } from '../types.js';
import type ScallopConstants from '../index.js';

export interface WhitelistConfigSource {
  getWhitelist(): Readonly<Whitelist>;
}

export const createLiveWhitelistConfigSource = (
  constants: ScallopConstants
): WhitelistConfigSource => ({
  getWhitelist: () => constants.whitelist,
});
