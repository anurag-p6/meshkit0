# IPFS Meshkit

IPFS Meshkit is an SDK for mobile frameworks like Flutter, Ionic, and React Native. It talks to a **running IPFS node** (Kubo) on the developer's PC, VPS, or LAN — data is stored on that node, not inside the app process.

## Typical use case

A developer building an invoice app can:

1. Store invoices in a local DB, **or**
2. Upload them to decentralized storage via their IPFS node (`ipfs daemon` on PC or Kubo on a VPS)

Meshkit handles `upload`, `retrieve`, and `pin` against the node's RPC API.

## Packages

| Package | Description |
|---------|-------------|
| [`@ipfs-meshkit/core`](./packages/core) | TypeScript client for a Kubo RPC endpoint |
| [`@ipfs-meshkit/capacitor`](./packages/capacitor) | Capacitor adapter for Ionic / hybrid apps |
| [`@ipfs-meshkit/react-native`](./packages/react-native) | React Native adapter (re-exports core + polyfill entry) |

## Prerequisites

A running IPFS (Kubo) node with its API reachable, e.g.:

```bash
ipfs daemon
# API default: http://127.0.0.1:5001
```

## Development

```bash
npm install
npm run build
```

## Usage

```bash
npm install @ipfs-meshkit/core
```

### Connecting to nodes

`Meshkit.init` connects to one or more Kubo nodes. Pass the node URLs in
priority order: the first is the primary, and the rest are used for failover.
Each node is health-checked at startup, and unreachable nodes are dropped.

```typescript
import { readFile, writeFile } from 'node:fs/promises';
import { Meshkit } from '@ipfs-meshkit/core';

// Connect to one or more nodes (local daemon and/or VPS instances).
const mk = await Meshkit.init({
  nodes: [
    'http://127.0.0.1:5001',
    'https://node2.yourinfra.com:5001',
    'https://node3.yourinfra.com:5001',
  ],
});

console.log('Active nodes:', mk.activeNodes);

const pdf = await readFile('./invoice.pdf');
const cid = await mk.upload(pdf);

await mk.pin(cid);

const retrieved = await mk.retrieve(cid);
await writeFile('./invoice-copy.pdf', retrieved);
```

### Failover behavior

Each `upload`, `retrieve`, and `pin` call tries the nodes in priority order.
The first node that succeeds returns the result; if a node fails (network error,
timeout, or server error) the next node is tried. If every node fails, a
`MeshkitError` is thrown that aggregates the individual failures.

This removes the single point of failure: as long as one of your nodes is
reachable, the operation succeeds.

### Single node

For local development you can pass a single node:

```typescript
const mk = await Meshkit.init({ nodes: ['http://127.0.0.1:5001'] });
```

### Low-level client

For advanced use against a single node, `createMeshkitClient` is still
available and returns a client with the same `upload` / `retrieve` / `pin`
methods (no failover):

```typescript
import { createMeshkitClient } from '@ipfs-meshkit/core';

const client = createMeshkitClient({ apiUrl: 'http://127.0.0.1:5001' });
const cid = await client.upload(await readFile('./invoice.pdf'));
```

### React Native

Install the adapter and polyfills in your app:

```bash
npm install @ipfs-meshkit/react-native react-native-get-random-values \
  react-native-url-polyfill react-native-fetch-api web-streams-polyfill fast-text-encoding
```

Load polyfills once at app entry (before any Meshkit import):

```typescript
import '@ipfs-meshkit/react-native/polyfills';
import { Meshkit } from '@ipfs-meshkit/react-native';

const mk = await Meshkit.init({
  // Use your machine's LAN IP or a VPS — not 127.0.0.1 on a physical device.
  nodes: ['http://192.168.1.42:5001'],
});

const cid = await mk.upload(new Uint8Array([1, 2, 3]));
```

On Android, allow cleartext HTTP for local dev (`android:usesCleartextTraffic="true"`). On iOS, enable local networking in `Info.plist` if using `http://` on LAN.
