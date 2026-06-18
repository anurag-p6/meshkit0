# IPFS Meshkit

IPFS Meshkit is a universal SDK for decentralized storage on Node.js, React Native, Flutter, and Capacitor. Install **`@ipfs-meshkit/meshkit`** for the full experience — storage APIs, optional local Kubo startup, and failover — without wiring up Kubo RPC yourself.

## Typical use case

A developer building an invoice app can:

1. Store invoices in a local DB, **or**
2. Upload them to decentralized storage via Meshkit (`upload`, `retrieve`, `pin`)

On Node.js, Meshkit can start a local Kubo daemon for you. On mobile, point at a Kubo node on your PC or VPS.

## Packages

| Package | Description |
|---------|-------------|
| [`@ipfs-meshkit/meshkit`](./packages/meshkit) | **Primary entry** — storage + local Kubo lifecycle (Node.js) |
| [`@ipfs-meshkit/core`](./packages/core) | Kubo RPC client with multi-node failover |
| [`@ipfs-meshkit/node`](./packages/node) | Start/stop a local Kubo daemon (`startIPFSNode`) |
| [`@ipfs-meshkit/capacitor`](./packages/capacitor) | Capacitor adapter for Ionic / hybrid apps |
| [`@ipfs-meshkit/react-native`](./packages/react-native) | React Native adapter (re-exports core + polyfill entry) |

## Prerequisites

Install [Kubo](https://docs.ipfs.tech/install/) (`ipfs` on your PATH). Meshkit can spawn the daemon on Node.js; mobile apps still need a reachable Kubo endpoint (LAN IP or VPS).

## Development

```bash
npm install
npm run build
```

## Usage

```bash
npm install @ipfs-meshkit/meshkit
```

### Node.js — automatic local Kubo

```typescript
import { readFile, writeFile } from 'node:fs/promises';
import { init, stopIPFSNode } from '@ipfs-meshkit/meshkit';

const { meshkit, localNode } = await init({ localNode: true });

const pdf = await readFile('./invoice.pdf');
const cid = await meshkit.upload(pdf);
await meshkit.pin(cid);

const retrieved = await meshkit.retrieve(cid);
await writeFile('./invoice-copy.pdf', retrieved);

if (localNode?.managed) {
  await stopIPFSNode(localNode);
}
```

### Node.js — server bootstrap

```typescript
import { startIPFSNode, stopIPFSNode, init } from '@ipfs-meshkit/meshkit';

const kubo = await startIPFSNode();
const { meshkit } = await init({ nodes: [kubo.url] });

// ... your HTTP server ...

process.on('SIGTERM', async () => {
  if (kubo.managed) {
    await stopIPFSNode(kubo);
  }
  process.exit(0);
});
```

`startIPFSNode` reuses an existing daemon on `127.0.0.1:5001` when one is already healthy.

### Remote nodes + failover

```typescript
import { init } from '@ipfs-meshkit/meshkit';

const { meshkit } = await init({
  localNode: true,
  nodes: [
    'https://node2.yourinfra.com:5001',
    'https://node3.yourinfra.com:5001',
  ],
});

console.log('Active nodes:', meshkit.activeNodes);
```

Each `upload`, `retrieve`, and `pin` call tries nodes in priority order. If every node fails, a `MeshkitError` is thrown.

### Low-level client

For a single node without failover, use `@ipfs-meshkit/core` directly:

```typescript
import { createMeshkitClient } from '@ipfs-meshkit/core';

const client = createMeshkitClient({ apiUrl: 'http://127.0.0.1:5001' });
const cid = await client.upload(await readFile('./invoice.pdf'));
```

### React Native

```bash
npm install @ipfs-meshkit/react-native react-native-get-random-values \
  react-native-url-polyfill react-native-fetch-api web-streams-polyfill fast-text-encoding
```

```typescript
import '@ipfs-meshkit/react-native/polyfills';
import { Meshkit } from '@ipfs-meshkit/react-native';

const mk = await Meshkit.init({
  nodes: ['http://192.168.1.42:5001'],
});

const cid = await mk.upload(new Uint8Array([1, 2, 3]));
```

On Android, allow cleartext HTTP for local dev (`android:usesCleartextTraffic="true"`). On iOS, enable local networking in `Info.plist` if using `http://` on LAN.
