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
  },
});
