# IPFS Meshkit0

**@ipfs-meshkit/meshkit** is a TypeScript SDK for decentralized storage with two backends and one unified interface:

- **Kubo / IPFS** — for Node.js and server apps that can run a daemon
- **S3-compatible object storage** (fil.one, Lighthouse, Filebase, 4EVERLAND, …) — for browsers, Ionic/Capacitor, and mobile apps where no daemon is possible

Both backends implement the same `MeshkitClient` interface (`upload`, `retrieve`, `pin`, `list`, `listPins`, …) so you can swap backends without changing application logic.

[![test](https://github.com/IPFS-Meshkit/meshkit0/actions/workflows/test.yml/badge.svg)](https://github.com/IPFS-Meshkit/meshkit0/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/@ipfs-meshkit/meshkit.svg)](https://www.npmjs.com/package/@ipfs-meshkit/meshkit)
[![license](https://img.shields.io/npm/l/@ipfs-meshkit/meshkit.svg)](https://github.com/IPFS-Meshkit/meshkit0/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/@ipfs-meshkit/meshkit.svg)](https://www.npmjs.com/package/@ipfs-meshkit/meshkit)

[![NPM](https://nodei.co/npm/@ipfs-meshkit/meshkit.png?downloads=true&downloadRank=true)](https://www.npmjs.com/package/@ipfs-meshkit/meshkit)

---

## Install

```bash
npm install @ipfs-meshkit/meshkit
```

**Requirements:** Node.js **20+**.
- **Kubo path** (`localNode: true`): install [Kubo](https://docs.ipfs.tech/install/) and ensure `ipfs` is on your `PATH`.
- **S3 path** (`createS3Client` / `createFilOneClient`): no daemon needed — works in browsers, Ionic/Capacitor, and React Native.

---

## How it works

```
Two backends, one MeshkitClient interface
─────────────────────────────────────────────────────────────────────

  Kubo / IPFS path (Node.js, server)
  ────────────────────────────────────────────────────────────────
  init()  →  Kubo RPC (:5001)  →  ./.ipfs on disk
               upload · retrieve · pin · IPNS · listPins · failover

  S3-compatible path (browser, Ionic, mobile — no daemon)
  ────────────────────────────────────────────────────────────────
  createS3Client()  →  fil.one / Lighthouse / Filebase / …
                          upload · retrieve · list · listPins
```

The S3 path computes a CID locally (CIDv1, raw codec, sha2-256) from the raw bytes and uses it as the S3 object key. **This CID is not published to the IPFS network** — it is a content-addressed key private to your bucket. Store the CID in your own database so you can retrieve the file later.

---

## Quick start — Kubo (Node.js)

```typescript
import { init, setupGracefulShutdown } from '@ipfs-meshkit/meshkit';

const { meshkit, localNode } = await init({ localNode: true });
setupGracefulShutdown(localNode);

const bytes = new TextEncoder().encode('hello world');
const cid = await meshkit.upload(bytes);
await meshkit.pin(cid);

const retrieved = await meshkit.retrieve(cid);
console.log(new TextDecoder().decode(retrieved)); // hello world
```

`localNode: true` starts or attaches to a Kubo daemon on `http://127.0.0.1:5001` and stores data in `./.ipfs`. Add `.ipfs` to `.gitignore`.

---

## Quick start — S3-compatible storage (browser / Ionic / mobile)

```typescript
import { createS3Client } from '@ipfs-meshkit/meshkit';

const client = createS3Client({
  accessKeyId: process.env.STORAGE_KEY!,
  secretAccessKey: process.env.STORAGE_SECRET!,
  bucket: 'my-invoices',
  endpoint: 'https://eu-west-1.s3.fil.one', // or any S3-compatible URL
});

// Upload — CID is computed locally from the raw bytes
const bytes = new TextEncoder().encode('invoice payload');
const cid = await client.upload(bytes);
console.log('stored at key:', cid); // bafkrei...

// Retrieve — fetch back by the same CID
const retrieved = await client.retrieve(cid);

// List everything in the bucket
const objects = await client.list();
// → [{ cid: 'bafkrei...', size: 14, uploadedAt: '2026-07-22T10:00:00.000Z' }, ...]
```

> **Store your CIDs.** There is no directory listing backed by IPFS. `list()` queries the S3 bucket directly. If you lose the CID and the bucket is empty, there is no way to rediscover the file from the IPFS network.

---

## Usage

### Local Kubo daemon (recommended for Node.js servers)

```typescript
import { readFile } from 'node:fs/promises';
import { init, setupGracefulShutdown } from '@ipfs-meshkit/meshkit';

const { meshkit, localNode } = await init({ localNode: true });
setupGracefulShutdown(localNode);

const file = await readFile('./document.pdf');
const cid = await meshkit.upload(file);
await meshkit.pin(cid);

const pins = await meshkit.listPins();
console.log('pinned CIDs:', pins.length);
```

### Remote Kubo only (no local daemon spawn)

```typescript
import { init } from '@ipfs-meshkit/meshkit';

const { meshkit } = await init({
  nodes: ['https://kubo.example.com:5001'],
});

const cid = await meshkit.upload(new Uint8Array([1, 2, 3]));
```

### Multi-node failover

Meshkit health-checks all nodes at init time and routes requests through the first healthy one. If it fails mid-operation, the next node is tried automatically.

```typescript
import { init } from '@ipfs-meshkit/meshkit';

const { meshkit } = await init({
  localNode: true,
  nodes: ['https://backup1.example.com:5001', 'https://backup2.example.com:5001'],
});

await meshkit.upload(new TextEncoder().encode('stored across failover nodes'));
```

### IPNS — mutable pointers

IPNS lets you publish a stable name that always points to your latest content. Only available on the Kubo path.

```typescript
import { init, IPNS_TTL_FAST } from '@ipfs-meshkit/meshkit';

const { meshkit } = await init({ localNode: true });

// Create a named key — the key name becomes a stable IPNS address
await meshkit.generateKey('my-app');

const v1 = new TextEncoder().encode('version 1');
const cid = await meshkit.upload(v1);
await meshkit.pin(cid);

// Publish: /ipns/<name> now resolves to this CID
const { name } = await meshkit.publishName(cid, {
  key: 'my-app',
  ttl: IPNS_TTL_FAST,
});

// Later — resolve and fetch in one call
const latest = await meshkit.resolveAndRetrieve(`/ipns/${name}`);
console.log(new TextDecoder().decode(latest)); // version 1
```

### Server shutdown hook

```typescript
import { init, setupGracefulShutdown } from '@ipfs-meshkit/meshkit';

const { meshkit, localNode } = await init({ localNode: true });

setupGracefulShutdown(localNode, {
  onShutdown: async () => {
    // close HTTP servers, DB connections, etc.
  },
});
```

### S3-compatible storage — fil.one preset

`createFilOneClient` is a convenience preset over `createS3Client` that defaults `endpoint` to `https://eu-west-1.s3.fil.one`. Get your API key and bucket at [app.fil.one](https://app.fil.one).

```typescript
import { createFilOneClient } from '@ipfs-meshkit/meshkit';

const client = createFilOneClient({
  accessKeyId: process.env.FIL_ACCESS_KEY!,    // format: FHXXXXXXXXXXXXXXXX
  secretAccessKey: process.env.FIL_SECRET_KEY!,
  bucket: 'my-invoices',
  // endpoint defaults to 'https://eu-west-1.s3.fil.one'
});

const cid = await client.upload(new TextEncoder().encode('invoice data'));
const retrieved = await client.retrieve(cid);
```

### S3-compatible storage — custom endpoint (Lighthouse, Filebase, 4EVERLAND, …)

`createS3Client` works with any S3-compatible service. Pass the endpoint explicitly.

```typescript
import { createS3Client } from '@ipfs-meshkit/meshkit';

// Lighthouse
const lighthouse = createS3Client({
  accessKeyId: process.env.LH_KEY!,
  secretAccessKey: process.env.LH_SECRET!,
  bucket: 'my-bucket',
  endpoint: 'https://gateway.lighthouse.storage',
});

// Filebase
const filebase = createS3Client({
  accessKeyId: process.env.FB_KEY!,
  secretAccessKey: process.env.FB_SECRET!,
  bucket: 'my-bucket',
  endpoint: 'https://s3.filebase.com',
});

const cid = await lighthouse.upload(new TextEncoder().encode('data'));
```

### Listing stored objects

On S3 clients, `list()` queries the bucket and returns metadata for every stored object. `listPins()` returns just the CID strings (same data, different shape).

```typescript
import { createS3Client } from '@ipfs-meshkit/meshkit';

const client = createS3Client({ /* config */ });

// Full metadata
const objects = await client.list();
for (const obj of objects) {
  console.log(obj.cid);        // 'bafkrei...'
  console.log(obj.size);       // 1024 (bytes)
  console.log(obj.uploadedAt); // '2026-07-22T10:00:00.000Z'
}

// CID strings only
const cids = await client.listPins();
```

> `list()` is **not available on Kubo clients** — it throws `MeshkitError`. Use `listPins()` on the Kubo path.

### In an Ionic / Angular service

```typescript
import { Injectable } from '@angular/core';
import { createFilOneClient, type MeshkitClient } from '@ipfs-meshkit/meshkit';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class InvoiceStorageService {
  private client: MeshkitClient = createFilOneClient(environment.filOne);

  async uploadInvoice(file: File): Promise<string> {
    const bytes = new Uint8Array(await file.arrayBuffer());
    return this.client.upload(bytes); // returns CID — store this in your DB
  }

  async getInvoice(cid: string): Promise<Blob> {
    const bytes = await this.client.retrieve(cid);
    return new Blob([bytes], { type: 'application/pdf' });
  }

  async listInvoices() {
    return this.client.list(); // [{ cid, size, uploadedAt }, ...]
  }
}
```

### Low-level single-node client (no failover)

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

---

## API overview

### Kubo / IPFS

| Export | Purpose |
|---|---|
| `init(options?)` | Main entry — connect to Kubo nodes, optionally spawn local daemon |
| `meshkit.upload(bytes)` | Upload bytes; returns CID string; uses failover |
| `meshkit.retrieve(cid)` | Retrieve bytes by CID; uses failover |
| `meshkit.pin(cid)` | Pin a CID on the primary node |
| `meshkit.listPins()` | List all pinned CIDs on the primary node |
| `meshkit.publishName` / `resolveName` / `resolveAndRetrieve` | IPNS mutable pointers |
| `meshkit.generateKey` / `listKeys` | IPNS keystore management |
| `setupGracefulShutdown` | Stop managed Kubo on Ctrl+C / SIGTERM |
| `createMeshkitClient(config)` | Single-node Kubo RPC client (no failover) |
| `startIPFSNode` / `stopIPFSNode` | Low-level daemon lifecycle control |

### S3-compatible object storage

| Export | Purpose |
|---|---|
| `createS3Client(config)` | `MeshkitClient` backed by any S3-compatible service |
| `createFilOneClient(config)` | Preset of `createS3Client` for fil.one; `endpoint` defaults to `eu-west-1.s3.fil.one` |
| `client.upload(bytes)` | PUT bytes to the bucket; CID computed locally and used as the object key |
| `client.retrieve(cid)` | GET bytes from the bucket by CID key |
| `client.list()` | List all objects: `{ cid, size, uploadedAt }[]`; handles pagination |
| `client.listPins()` | Same as `list()` but returns only the CID strings |
| `client.pin(cid)` | No-op — safe to call, does nothing (no pin layer on object stores) |
| `client.healthCheck()` | HEAD the bucket — confirms credentials and bucket exist |
| `S3StorageConfig` | Type: `{ accessKeyId, secretAccessKey, bucket, endpoint }` |
| `FilOneConfig` | Type: `{ accessKeyId, secretAccessKey, bucket, endpoint? }` |
| `StoredObject` | Type: `{ cid: string; size: number; uploadedAt: string }` |

> IPNS operations (`publishName`, `resolveName`, `resolveAndRetrieve`, `generateKey`, `listKeys`) are **not supported on S3 clients** and throw `MeshkitError`.

### Constants and utilities

| Export | Purpose |
|---|---|
| `IPNS_TTL_FAST` / `IPNS_TTL_DEFAULT` | TTL constants for IPNS publish |
| `extractCidFromPath(path)` | Extract CID string from `/ipfs/<cid>` path |
| `toIpfsPath(cid)` / `toIpnsPath(name)` | Normalize to `/ipfs/` or `/ipns/` path |
| `MeshkitError` / `MeshkitNodeError` | Error classes |

TypeScript types are included — no `@types/` package needed:

```typescript
import type {
  MeshkitClient,
  StoredObject,
  S3StorageConfig,
  FilOneConfig,
  IPFSNodeHandle,
} from '@ipfs-meshkit/meshkit';
```

---

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
