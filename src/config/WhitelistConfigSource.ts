import type { Whitelist } from 'src/types/index.js';
import type ScallopConstants from 'src/models/scallopConstants.js';

export interface WhitelistConfigSource {
  getWhitelist(): Readonly<Whitelist>;
}

export const createLiveWhitelistConfigSource = (
  constants: ScallopConstants
): WhitelistConfigSource => ({
  getWhitelist: () => constants.whitelist,
});
