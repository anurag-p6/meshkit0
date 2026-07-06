# @ipfs-meshkit/meshkit-workspace

**Private monorepo package** — workspace source for the published npm package [`ipfs-meshkit`](../../README.md).

The public API (`init`, `setupGracefulShutdown`, storage, IPNS, Kubo lifecycle) is built from this folder and published as a single bundle from the repository root `dist/`.

## For app developers

Use the published package — not this workspace folder directly:

```bash
npm install ipfs-meshkit
```

```typescript
import { init, setupGracefulShutdown } from 'ipfs-meshkit';

const { meshkit, localNode } = await init({ localNode: true });
setupGracefulShutdown(localNode);
```

## Monorepo development

- Entry: `packages/meshkit/src/index.ts`
- Build: `npm run build` at repo root (tsup → `dist/`)
- Depends on `@ipfs-meshkit/core` and `@ipfs-meshkit/node` (workspace imports)

Full documentation, examples, and IPNS guide: [repository README](../../README.md)
