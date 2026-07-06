# @ipfs-meshkit/meshkit-workspace

**Private monorepo package** — source for the published npm package [`@ipfs-meshkit/meshkit`](../../README.md).

Built from this folder into root `dist/` via `npm run build`.

## For app developers

```bash
npm install @ipfs-meshkit/meshkit
```

```typescript
import { init, setupGracefulShutdown } from '@ipfs-meshkit/meshkit';
```

## Monorepo development

- Entry: `packages/meshkit/src/index.ts`
- Depends on `@ipfs-meshkit/core` and `@ipfs-meshkit/node`

Full documentation: [repository README](../../README.md)
