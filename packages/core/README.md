# @ipfs-meshkit/core

**Private monorepo package** — Kubo RPC client with multi-node health checks and failover.

Not published separately. It is bundled into the npm package [`ipfs-meshkit`](../../README.md).

## For app developers

Install and import from the published package:

```bash
npm install ipfs-meshkit
```

```typescript
import { Meshkit, createMeshkitClient } from 'ipfs-meshkit';

// Multi-node failover
const meshkit = await Meshkit.init({
  nodes: ['http://127.0.0.1:5001'],
});

// Single node (no failover)
const client = createMeshkitClient({ apiUrl: 'http://127.0.0.1:5001' });
```

## Monorepo development

Source lives in `packages/core/src/`. Other workspace packages import this module as `@ipfs-meshkit/core`.

Full documentation: [repository README](../../README.md)
