# @ipfs-meshkit/node

**Private monorepo package** — start, attach to, or stop a local Kubo daemon. **Node.js only.**

Not published separately. It is bundled into the npm package [`ipfs-meshkit`](../../README.md).

## For app developers

Install and import from the published package:

```bash
npm install ipfs-meshkit
```

```typescript
import { init, startIPFSNode, stopIPFSNode, setupGracefulShutdown } from 'ipfs-meshkit';

// Recommended: init with local Kubo
const { meshkit, localNode } = await init({ localNode: true });
setupGracefulShutdown(localNode);

// Low-level daemon control
const node = await startIPFSNode({ repo: './.ipfs' });
await stopIPFSNode(node);
```

Requires the `ipfs` (Kubo) binary on `PATH` when spawning a new daemon.

## Monorepo development

Source lives in `packages/node/src/`. Imported by `packages/meshkit` as `@ipfs-meshkit/node`.

Full documentation: [repository README](../../README.md)
