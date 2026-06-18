import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const srcDir = fileURLToPath(new URL('./src/', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      src: srcDir,
    },
  },
  test: {
    testTimeout: 60_000,
    // Selection is glob-based (not hardcoded filenames) so moving a spec never
    // touches package.json. Colocated specs live next to their source.
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          // Network-free. All specs live under tests/ (mirroring the src tree);
          // integration specs are split out into their own project below.
          include: ['tests/**/*.spec.ts'],
          exclude: ['tests/integration/**'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          // Mainnet dry-run + fixture-backed specs (need .env / network).
          include: ['tests/integration/**/*.spec.ts'],
        },
      },
    ],
  },
});
