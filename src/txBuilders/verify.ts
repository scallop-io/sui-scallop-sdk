import type { Logger } from 'src/logger/index.js';
import {
  TX_BLOCK_MANIFEST,
  detectManifestCollisions,
  type TxBlockManifest,
} from './manifest.js';

export type VerifyTxBlockResult = {
  collisions: ReturnType<typeof detectManifestCollisions>;
  missing: { module: string; method: string }[];
};

export const verifyTxBlockMethods = (
  txBlock: object,
  manifest: TxBlockManifest = TX_BLOCK_MANIFEST,
  logger?: Logger
): VerifyTxBlockResult => {
  const collisions = detectManifestCollisions(manifest);
  const missing: VerifyTxBlockResult['missing'] = [];

  for (const [moduleName, methods] of Object.entries(manifest)) {
    for (const method of methods) {
      const value = (txBlock as Record<string, unknown>)[method];
      if (typeof value !== 'function') {
        missing.push({ module: moduleName, method });
      }
    }
  }

  if (logger) {
    if (collisions.length) {
      logger.warn('Tx-block manifest collisions detected', {
        collisions: collisions.map((c) => ({
          method: c.method,
          modules: c.modules,
        })),
      });
    }
    if (missing.length) {
      logger.warn('Tx-block manifest methods missing at runtime', { missing });
    }
  }

  return { collisions, missing };
};
