import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'tsup';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  entry: [path.join(root, 'packages/meshkit/src/index.ts')],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  target: 'es2022',
  esbuildOptions(options) {
    options.alias = {
      '@ipfs-meshkit/core': path.join(root, 'packages/core/src/index.ts'),
      '@ipfs-meshkit/node': path.join(root, 'packages/node/src/index.ts'),
    };
  },
  dts: {
    compilerOptions: {
      composite: false,
      incremental: false,
      ignoreDeprecations: '6.0',
      paths: {
        '@ipfs-meshkit/core': ['./packages/core/src/index.ts'],
        '@ipfs-meshkit/node': ['./packages/node/src/index.ts'],
      },
      baseUrl: '.',
    },
  },
  // Bundle workspace packages into one publishable artifact.
  noExternal: [/^@ipfs-meshkit\//],
  external: ['kubo-rpc-client'],
});
