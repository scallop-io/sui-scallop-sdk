import { defineConfig } from 'tsup';

export default defineConfig((options) => {
  const isProduction = options.env?.NODE_ENV === 'production';
  return {
    // Multi-entry build. Root entry keeps the broad public surface for
    // compatibility; subpath entries expose intentional stable areas.
    entry: {
      index: 'src/index.ts',
      errors: 'src/errors/index.ts',
      logger: 'src/logger/index.ts',
      client: 'src/client/index.ts',
      query: 'src/query/index.ts',
      builder: 'src/builder/index.ts',
      types: 'src/types/public/index.ts',
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
