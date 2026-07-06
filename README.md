# IPFS Meshkit0

**@ipfs-meshkit/meshkit** is a Node.js SDK for [Kubo](https://docs.ipfs.tech/) (IPFS). Upload, retrieve, and pin content over Kubo’s HTTP RPC, with optional local daemon startup, IPNS, and multi-node failover.

[![test](https://github.com/IPFS-Meshkit/meshkit0/actions/workflows/test.yml/badge.svg)](https://github.com/IPFS-Meshkit/meshkit0/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/@ipfs-meshkit/meshkit.svg)](https://www.npmjs.com/package/@ipfs-meshkit/meshkit)
[![license](https://img.shields.io/npm/l/@ipfs-meshkit/meshkit.svg)](https://github.com/IPFS-Meshkit/meshkit0/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/@ipfs-meshkit/meshkit.svg)](https://www.npmjs.com/package/@ipfs-meshkit/meshkit)

[![NPM](https://nodei.co/npm/@ipfs-meshkit/meshkit.png?downloads=true&downloadRank=true)](https://www.npmjs.com/package/@ipfs-meshkit/meshkit)

## Install

```bash
npm install @ipfs-meshkit/meshkit
```

**Requirements:** Node.js **20+**. For `localNode: true`, install [Kubo](https://docs.ipfs.tech/install/) and ensure `ipfs` is on your `PATH`.

## Quick start

```typescript
import { init, setupGracefulShutdown } from '@ipfs-meshkit/meshkit';

const { meshkit, localNode } = await init({ localNode: true });
setupGracefulShutdown(localNode);

const bytes = new TextEncoder().encode('hello');
const cid = await meshkit.upload(bytes);
await meshkit.pin(cid);

const retrieved = await meshkit.retrieve(cid);
console.log(new TextDecoder().decode(retrieved)); // hello
```

`localNode: true` starts or attaches to Kubo on `http://127.0.0.1:5001` and stores data in `./.ipfs`. Add `.ipfs` to `.gitignore`.

## How it works

```
Your app  →  init()  →  Kubo RPC (:5001)  →  ./.ipfs on disk
              upload · retrieve · pin · IPNS
```

1. **`init()`** — connect to one or more Kubo nodes; optionally spawn a local daemon.
2. **`meshkit`** — storage API with failover (`upload`, `retrieve`, `pin`, IPNS).
3. **`setupGracefulShutdown()`** — stop a managed Kubo cleanly on Ctrl+C / SIGTERM.

## Usage

### Local Kubo (recommended for Node.js)

```typescript
import { readFile } from 'node:fs/promises';
import { init, listPins, setupGracefulShutdown } from '@ipfs-meshkit/meshkit';

const { meshkit, localNode } = await init({ localNode: true });
setupGracefulShutdown(localNode);

const file = await readFile('./document.pdf');
const cid = await meshkit.upload(file);
await meshkit.pin(cid);

const pins = await listPins(meshkit.activeNodes[0]!);
console.log('pinned:', pins.length);
```

### Remote Kubo only (no local spawn)

Use when Kubo already runs on a server or LAN machine:

```typescript
import { init } from '@ipfs-meshkit/meshkit';

const { meshkit } = await init({
  nodes: ['https://kubo.example.com:5001'],
});

const cid = await meshkit.upload(new Uint8Array([1, 2, 3]));
```

### Local + backup nodes (failover)

```typescript
import { init } from '@ipfs-meshkit/meshkit';

const { meshkit } = await init({
  localNode: true,
  nodes: ['https://backup.example.com:5001'],
});

const backup = new TextEncoder().encode('failover example');
await meshkit.upload(backup);
```

### IPNS (mutable pointer)

```typescript
import { init, IPNS_TTL_FAST } from '@ipfs-meshkit/meshkit';

const { meshkit } = await init({ localNode: true });

await meshkit.generateKey('latest');
const contentBytes = new TextEncoder().encode('v1');
const cid = await meshkit.upload(contentBytes);
await meshkit.pin(cid); // publishName does not pin — pin content you care about

const { name } = await meshkit.publishName(cid, {
  key: 'latest',
  ttl: IPNS_TTL_FAST,
});

const latest = await meshkit.resolveAndRetrieve(`/ipns/${name}`);
```

### Server shutdown hook

```typescript
import { init, setupGracefulShutdown } from '@ipfs-meshkit/meshkit';

const { meshkit, localNode } = await init({ localNode: true });

setupGracefulShutdown(localNode, {
  onShutdown: async () => {
    // close HTTP server, DB, etc.
  },
});
```

### Low-level client (single node, no failover)

```typescript
import { createMeshkitClient } from '@ipfs-meshkit/meshkit';

const client = createMeshkitClient({ apiUrl: 'http://127.0.0.1:5001' });
const cid = await client.upload(new Uint8Array([1, 2, 3]));
```

### CommonJS

```javascript
const { init } = require('@ipfs-meshkit/meshkit');

(async () => {
  const { meshkit } = await init({ nodes: ['http://127.0.0.1:5001'] });
  console.log(await meshkit.upload(Buffer.from('hello')));
})();
```

## API overview

| Export | Purpose |
|--------|---------|
| `init()` | Main entry — connect (+ optional `localNode`) |
| `meshkit.upload` / `retrieve` / `pin` | Storage with failover |
| `meshkit.publishName` / `resolveName` / `resolveAndRetrieve` | IPNS |
| `meshkit.generateKey` / `listKeys` | IPNS keystore |
| `setupGracefulShutdown` | Graceful Kubo shutdown |
| `listPins` | List pinned CIDs (migration / backups) |
| `createMeshkitClient` | Single-node RPC client |
| `startIPFSNode` / `stopIPFSNode` | Low-level daemon control |

TypeScript types are included (`import type { Meshkit, IPFSNodeHandle } from '@ipfs-meshkit/meshkit'`).

## Documentation

- [GitHub repository](https://github.com/IPFS-Meshkit/meshkit0)
- [Kubo install guide](https://docs.ipfs.tech/install/)
- [Security policy](https://github.com/IPFS-Meshkit/meshkit0/blob/main/SECURITY.md)

## Support

- [GitHub Issues](https://github.com/IPFS-Meshkit/meshkit0/issues) — bugs and feature requests

## Credits

Open source project by **IPFS Meshkit Contributors**:

- [Anurag Pandey](https://github.com/anurag-p6) — primary development
- [Manu Sheel Gupta](https://github.com/seetadev) — project lead

## License

[MIT](https://github.com/IPFS-Meshkit/meshkit0/blob/main/LICENSE)
