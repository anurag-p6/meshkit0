# @ipfs-meshkit/node

**Private monorepo package** — start, attach to, or stop a local Kubo daemon. **Node.js only.**

Bundled into [`@ipfs-meshkit/meshkit`](../../README.md).

## For app developers

```bash
npm install @ipfs-meshkit/meshkit
```

```typescript
import { init, startIPFSNode, stopIPFSNode, setupGracefulShutdown } from '@ipfs-meshkit/meshkit';

const { meshkit, localNode } = await init({ localNode: true });
setupGracefulShutdown(localNode);
```

Requires Kubo (`ipfs`) on `PATH` when spawning a daemon.

## Monorepo development

Source: `packages/node/src/`. Imported as `@ipfs-meshkit/node`.

Full documentation: [repository README](../../README.md)
