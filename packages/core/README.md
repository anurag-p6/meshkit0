# @ipfs-meshkit/core

**Private monorepo package** — Kubo RPC client with multi-node health checks and failover.

Not published separately. It is bundled into [`@ipfs-meshkit/meshkit`](../../README.md).

## For app developers

```bash
npm install @ipfs-meshkit/meshkit
```

```typescript
import { Meshkit, createMeshkitClient } from '@ipfs-meshkit/meshkit';

const meshkit = await Meshkit.init({ nodes: ['http://127.0.0.1:5001'] });
const client = createMeshkitClient({ apiUrl: 'http://127.0.0.1:5001' });
```

## Monorepo development

Source: `packages/core/src/`. Imported as `@ipfs-meshkit/core`.

Full documentation: [repository README](../../README.md)
