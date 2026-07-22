# IPFS Meshkit0

**@ipfs-meshkit/meshkit** is a TypeScript SDK for decentralized storage. Use it with [Kubo](https://docs.ipfs.tech/) (IPFS) for server and Node.js apps, or with [fil.one](https://fil.one) (Filecoin-native S3-compatible storage) for browser, Ionic, and mobile apps — no daemon required.

[![test](https://github.com/IPFS-Meshkit/meshkit0/actions/workflows/test.yml/badge.svg)](https://github.com/IPFS-Meshkit/meshkit0/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/@ipfs-meshkit/meshkit.svg)](https://www.npmjs.com/package/@ipfs-meshkit/meshkit)
[![license](https://img.shields.io/npm/l/@ipfs-meshkit/meshkit.svg)](https://github.com/IPFS-Meshkit/meshkit0/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/@ipfs-meshkit/meshkit.svg)](https://www.npmjs.com/package/@ipfs-meshkit/meshkit)

[![NPM](https://nodei.co/npm/@ipfs-meshkit/meshkit.png?downloads=true&downloadRank=true)](https://www.npmjs.com/package/@ipfs-meshkit/meshkit)

## Install

```bash
npm install @ipfs-meshkit/meshkit
```

**Requirements:** Node.js **20+**. For the Kubo path (`localNode: true`), install [Kubo](https://docs.ipfs.tech/install/) and ensure `ipfs` is on your `PATH`. For the fil.one path, no daemon is needed — works in any environment including browsers and Ionic/Capacitor.

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

Two backends, one interface:

```
                ┌─ Kubo path (Node.js / server) ──────────────────────────┐
Your app  →  init()  →  Kubo RPC (:5001)  →  ./.ipfs on disk
                         upload · retrieve · pin · IPNS · failover
                └─────────────────────────────────────────────────────────┘

                ┌─ fil.one path (browser / Ionic / mobile) ───────────────┐
Your app  →  createFilOneClient()  →  Filecoin (fil.one S3)
                                       upload · retrieve
                └─────────────────────────────────────────────────────────┘
```

1. **`init()`** — connect to one or more Kubo nodes; optionally spawn a local daemon.
2. **`createFilOneClient()`** — connect to fil.one without any daemon; works in browsers and Ionic apps.
3. **`meshkit`** — storage API with failover (`upload`, `retrieve`, `pin`, IPNS).
4. **`setupGracefulShutdown()`** — stop a managed Kubo cleanly on Ctrl+C / SIGTERM.

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

### Filecoin via fil.one (browser, Ionic, React Native — no daemon)

Use `createFilOneClient` when you can't run a Kubo daemon — browser apps, Ionic/Capacitor, and mobile environments. Get your API key and bucket from [app.fil.one](https://app.fil.one).

```typescript
import { createFilOneClient } from '@ipfs-meshkit/meshkit';

const client = createFilOneClient({
  accessKeyId: process.env.FIL_ACCESS_KEY!,    // format: FHXXXXXXXXXXXXXXXX
  secretAccessKey: process.env.FIL_SECRET_KEY!,
  bucket: 'my-invoices',
  // endpoint defaults to 'https://eu-west-1.s3.fil.one'
});

// Upload — CID is computed locally, no IPFS node involved
const bytes = new TextEncoder().encode('invoice data');
const cid = await client.upload(bytes);
console.log('stored at CID:', cid); // bafkrei...

// Retrieve
const retrieved = await client.retrieve(cid);

// pin() is a no-op on fil.one — safe to call, does nothing
await client.pin(cid);
```

The fil.one client implements the same `MeshkitClient` interface as `createMeshkitClient`, so it is a drop-in replacement anywhere a `MeshkitClient` is accepted.

> **Note:** IPNS operations (`publishName`, `resolveName`, `generateKey`, etc.) are not supported by fil.one and will throw a `MeshkitError`.

#### In an Ionic / Angular service

```typescript
import { Injectable } from '@angular/core';
import { createFilOneClient, type MeshkitClient } from '@ipfs-meshkit/meshkit';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InvoiceStorageService {
  private client: MeshkitClient = createFilOneClient(environment.filOne);

  async uploadInvoice(file: File): Promise<string> {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return this.client.upload(bytes); // returns CID
  }

  async getInvoice(cid: string): Promise<Blob> {
    const bytes = await this.client.retrieve(cid);
    return new Blob([bytes], { type: 'application/pdf' });
  }
}
```

### Low-level client (single Kubo node, no failover)

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

### Kubo / IPFS

| Export | Purpose |
|--------|---------|
| `init(options?)` | Main entry — connect to Kubo nodes, optionally spawn local daemon |
| `meshkit.upload(bytes)` | Upload bytes, returns CID string; uses failover |
| `meshkit.retrieve(cid)` | Retrieve bytes by CID; uses failover |
| `meshkit.pin(cid)` | Pin a CID on the primary node |
| `meshkit.publishName` / `resolveName` / `resolveAndRetrieve` | IPNS mutable pointers |
| `meshkit.generateKey` / `listKeys` / `listPins` | IPNS keystore and pin listing |
| `setupGracefulShutdown` | Stop managed Kubo on Ctrl+C / SIGTERM |
| `listPins(apiUrl)` | Raw pin listing via HTTP (migration / backups) |
| `createMeshkitClient(config)` | Single-node Kubo RPC client (no failover) |
| `startIPFSNode` / `stopIPFSNode` | Low-level daemon lifecycle control |

### Filecoin / fil.one

| Export | Purpose |
|--------|---------|
| `createFilOneClient(config)` | `MeshkitClient` backed by fil.one — browser/mobile safe, no daemon |
| `FilOneConfig` | Config type: `accessKeyId`, `secretAccessKey`, `bucket`, optional `endpoint` |

### Constants and utilities

| Export | Purpose |
|--------|---------|
| `IPNS_TTL_FAST` / `IPNS_TTL_DEFAULT` | TTL constants for IPNS publish |
| `extractCidFromPath(path)` | Extract CID from `/ipfs/<cid>` path string |
| `toIpfsPath(cid)` / `toIpnsPath(name)` | Normalize to `/ipfs/` or `/ipns/` path |
| `MeshkitError` / `MeshkitNodeError` | Error classes |

TypeScript types are included — `import type { MeshkitClient, FilOneConfig, IPFSNodeHandle, ... } from '@ipfs-meshkit/meshkit'`.

## Documentation

- [GitHub repository](https://github.com/IPFS-Meshkit/meshkit0)
- [Kubo install guide](https://docs.ipfs.tech/install/)
- [fil.one dashboard](https://app.fil.one) — create buckets and API keys
- [Security policy](https://github.com/IPFS-Meshkit/meshkit0/blob/main/SECURITY.md)

## Support

- [GitHub Issues](https://github.com/IPFS-Meshkit/meshkit0/issues) — bugs and feature requests

## Credits

Open source project by **IPFS Meshkit Contributors**:

- [Anurag Pandey](https://github.com/anurag-p6) — primary development
- [Manu Sheel Gupta](https://github.com/seetadev) — project lead

## License

[MIT](https://github.com/IPFS-Meshkit/meshkit0/blob/main/LICENSE)
