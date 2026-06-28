import { defineConfig } from 'tsup';

export default defineConfig((options) => {
  const isProduction = options.env?.NODE_ENV === 'production';
  return {
    // Multi-entry build. Every entry lives under `src/entries/` (thin
    // re-exports) so the public surface is visually separate from internals —
    // entry keys stay identical, so dist filenames + package.json exports are
    // unchanged. Root entry keeps the broad public surface for compatibility.
    entry: {
      index: 'src/entries/index.ts',
      errors: 'src/entries/errors.ts',
      logger: 'src/entries/logger.ts',
      client: 'src/entries/client.ts',
      query: 'src/entries/query.ts',
      builder: 'src/entries/builder.ts',
      types: 'src/entries/types.ts',
    },

    // Generate TypeScript declaration files (.d.ts) for type safety.
    dts: true,

    // Clean the 'dist' directory before each build to ensure a fresh output.
    clean: true,

    // Generate source maps for easier debugging in development.
    sourcemap: !isProduction,

    // Output formats: ESM (ECMAScript Modules) for modern environments
    // and CJS (CommonJS) for Node.js and older toolchains.
    format: ['esm', 'cjs'],

    // Minify the output for production builds to reduce file size.
    minify: isProduction,

    // Target a specific ECMAScript version for broader compatibility.
    // 'esnext' is often suitable for modern libraries.
    target: 'esnext',

    // Specify the output directory for the bundled files.
    outDir: 'dist',

    // Optionally, define modules that should not be bundled but treated as external dependencies.
    // This is crucial for libraries to avoid bundling their dependencies into the output.
    // external: ["react", "react-dom"],

    treeshake: 'recommended',
  };
});
