import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  target: 'es2022',
  dts: false,
  banner: {
    js: '#!/usr/bin/env node',
  },
  external: [
    '@ipfs-meshkit/meshkit',
    '@modelcontextprotocol/sdk',
    'zod',
    'kubo-rpc-client',
  ],
});
