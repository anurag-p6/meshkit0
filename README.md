# IPFS Meshkit

IPFS Meshkit is a universal SDK for decentralized storage on Node.js, React Native, Flutter, and Capacitor. Install **`@ipfs-meshkit/meshkit`** for the full experience — storage APIs, optional local Kubo startup, and failover — without wiring up Kubo RPC yourself.

## Why Meshkit on Kubo?

[Helia](https://github.com/ipfs/helia) embeds IPFS inside your app (Node.js or browser) as a JavaScript library. **IPFS Meshkit** takes a different approach: it is a TypeScript SDK on top of **Kubo** — you get `upload`, `retrieve`, and `pin` over Kubo’s HTTP RPC, with optional local daemon startup, failover, and platform adapters.

We built Meshkit because apps like invoice backup need **Kubo’s persistence and pinning** without wiring up `kubo-rpc-client`, node lifecycle, repo migration, and mobile/browser integration by hand.

| | **Helia** | **IPFS Meshkit (Kubo)** |
|---|-----------|-------------------------|
| **Model** | IPFS runs in-process in your app | App talks to a Kubo daemon via RPC |
| **API** | Compose `@helia/unixfs`, blockstores, libp2p | `upload`, `retrieve`, `pin` out of the box |
| **Persistence** | You choose and wire the datastore | Kubo repo on disk (default `./.ipfs`) |
| **Networking** | App joins libp2p directly | Kubo handles swarm, DHT, bitswap |
| **Node lifecycle** | Start/stop Helia in-process | `init({ localNode: true })`, graceful shutdown |
| **Multi-node** | Roll your own retry logic | Built-in health checks and failover |
| **Host migration** | Re-export blocks or re-provide CIDs | Copy `./.ipfs` + `listPins()` manifest |
| **Web / mobile** | Large bundles, polyfills, in-browser P2P | Kubo on a server; app uses Meshkit HTTP API |

```
Your app  ──►  @ipfs-meshkit/meshkit  ──►  Kubo (./.ipfs)
              upload · retrieve · pin       API :5001 · GW :8080
```

Meshkit keeps **Kubo as the engine** and gives applications a single SDK for storage, node management, and deployment across Node.js, Capacitor, and React Native.

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
npm test                  # unit tests (no Kubo)
npm run test:integration  # build + E2E (requires Kubo)
npm run test:all          # full suite
```

See [docs/Testing.md](./docs/Testing.md).

## Usage

```bash
npm install @ipfs-meshkit/meshkit
```

### Node.js — automatic local Kubo

`localNode: true` stores pinned data in `./.ipfs` (relative to where you start the process). Add `.ipfs` to `.gitignore`.

```typescript
import { readFile, writeFile } from 'node:fs/promises';
import { init, listPins, setupGracefulShutdown } from '@ipfs-meshkit/meshkit';

const { meshkit, localNode } = await init({ localNode: true });

setupGracefulShutdown(localNode); // Ctrl+C flushes Kubo; ./.ipfs stays on disk

const pdf = await readFile('./invoice.pdf');
const cid = await meshkit.upload(pdf);
await meshkit.pin(cid);

console.log('repo:', localNode?.repo);
console.log('pins:', await listPins(meshkit.activeNodes[0]!));

const retrieved = await meshkit.retrieve(cid);
await writeFile('./invoice-copy.pdf', retrieved);
```

### Migrating servers (AWS → GCP)

1. Stop the server gracefully (`setupGracefulShutdown` or `stopIPFSNode`)
2. Copy the `./.ipfs` directory (tar, EBS snapshot, S3, etc.)
3. Restore on the new host and start with the same repo path:

```typescript
const { meshkit, localNode } = await init({
  localNode: { repo: './.ipfs', init: false },
});
```

Use `listPins()` to export CIDs as a backup manifest for re-pinning.

### Node.js — server bootstrap

```typescript
import { init, setupGracefulShutdown } from '@ipfs-meshkit/meshkit';

const { meshkit, localNode } = await init({ localNode: true });
setupGracefulShutdown(localNode, {
  onShutdown: async () => { /* close HTTP server, DB, etc. */ },
});

// ... app.listen(3000) ...
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

### IPNS (mutable names)

Use a **CID** when you want a permanent link to one exact version of content. Use **IPNS** when you need a **stable name** that can be updated to point at a newer CID (e.g. latest invoice bundle).

| | **CID** | **IPNS** |
|---|---------|----------|
| **Address** | `/ipfs/Qm...` | `/ipns/Qm...` |
| **Mutability** | Immutable — new content = new CID | Mutable pointer — same name, new CID via `publishName` |
| **Analogy** | Direct file hash | DNS record pointing at current content |
| **Read access** | Public | Public (no key required to resolve) |
| **Write access** | Anyone can add content; pinning is separate | Only the node holding the **private key** can publish updates |

```typescript
import { init, IPNS_TTL_FAST } from '@ipfs-meshkit/meshkit';

const { meshkit } = await init({ localNode: true });

// One-time: create a stable signing identity
await meshkit.generateKey('invoice-latest');

// Publish v1
const cid1 = await meshkit.upload(invoiceV1);
await meshkit.pin(cid1);
const { name } = await meshkit.publishName(cid1, {
  key: 'invoice-latest',
  ttl: IPNS_TTL_FAST,
});

// Readers use the stable IPNS name (no key required)
const bytes = await meshkit.resolveAndRetrieve(`/ipns/${name}`);

// Update to v2 — same IPNS name, new CID
const cid2 = await meshkit.upload(invoiceV2);
await meshkit.pin(cid2);
await meshkit.publishName(cid2, { key: 'invoice-latest', ttl: IPNS_TTL_FAST });

// Verify latest (nocache bypasses local cache after publish)
const path = await meshkit.resolveName(`/ipns/${name}`, { nocache: true });
```

Gateway URL for browsers: `http://127.0.0.1:8080/ipns/${name}`.

**Operator notes:**

- `publishName` does **not** pin — always `pin(cid)` for content you publish.
- IPNS keys live in `./.ipfs/keystore` — copy the repo to migrate names (same as pins).
- **`ttl`** is a cache hint (upper bound on stale reads for cached resolvers), not a fixed global propagation delay. After updating a CID, expect eventual consistency (seconds to a few minutes).
- **Multi-node:** `publishName`, `generateKey`, and `listKeys` use the **primary node** (`activeNodes[0]`). `resolveName` and `resolveAndRetrieve` failover across healthy nodes.

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
