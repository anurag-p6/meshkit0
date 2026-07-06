# IPFS Meshkit

**ipfs-meshkit** is a Node.js SDK for [Kubo](https://docs.ipfs.tech/) (IPFS). It provides `upload`, `retrieve`, `pin`, and IPNS over Kubo’s HTTP RPC, with optional local daemon startup and multi-node failover.

Requires **Node.js 20+**. For `localNode: true`, install [Kubo](https://docs.ipfs.tech/install/) (`ipfs` on your PATH).

[![test](https://github.com/seetadev/IPFS-meshkit/actions/workflows/test.yml/badge.svg)](https://github.com/seetadev/IPFS-meshkit/actions/workflows/test.yml)
[![npm version](https://img.shields.io/npm/v/ipfs-meshkit.svg)](https://www.npmjs.com/package/ipfs-meshkit)
[![license](https://img.shields.io/npm/l/ipfs-meshkit.svg)](https://github.com/seetadev/IPFS-meshkit/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/ipfs-meshkit.svg)](https://www.npmjs.com/package/ipfs-meshkit)

[![NPM](https://nodei.co/npm/ipfs-meshkit.png?downloads=true&downloadRank=true)](https://www.npmjs.com/package/ipfs-meshkit)

```bash
npm install ipfs-meshkit
```

## Quick start

```typescript
import { init, setupGracefulShutdown } from 'ipfs-meshkit';

const { meshkit, localNode } = await init({ localNode: true });
setupGracefulShutdown(localNode);

const cid = await meshkit.upload(new TextEncoder().encode('hello'));
await meshkit.pin(cid);
const data = await meshkit.retrieve(cid);
```

`localNode: true` stores data in `./.ipfs` (add `.ipfs` to `.gitignore`).

## Documentation

The main guide lives in this repository:

- [Usage examples](#examples) — local Kubo, remote nodes, IPNS
- [Testing](docs/Testing.md) — unit and integration tests
- [Publishing](docs/PUBLISHING.md) — release checklist for maintainers
- [Security](SECURITY.md) — reporting vulnerabilities

[Kubo documentation](https://docs.ipfs.tech/) · [GitHub repository](https://github.com/seetadev/IPFS-meshkit)

## Examples

### Local Kubo

```typescript
import { init, listPins, setupGracefulShutdown } from 'ipfs-meshkit';

const { meshkit, localNode } = await init({ localNode: true });
setupGracefulShutdown(localNode);

const cid = await meshkit.upload(fileBytes);
await meshkit.pin(cid);
const pins = await listPins(meshkit.activeNodes[0]!);
```

### Remote Kubo + failover

```typescript
import { init } from 'ipfs-meshkit';

const { meshkit } = await init({
  nodes: [
    'http://127.0.0.1:5001',
    'https://backup.example.com:5001',
  ],
});
```

### IPNS

```typescript
import { init, IPNS_TTL_FAST } from 'ipfs-meshkit';

const { meshkit } = await init({ localNode: true });
await meshkit.generateKey('latest');
const cid = await meshkit.upload(content);
await meshkit.pin(cid);
const { name } = await meshkit.publishName(cid, { key: 'latest', ttl: IPNS_TTL_FAST });
const bytes = await meshkit.resolveAndRetrieve(`/ipns/${name}`);
```

### Low-level client (single node)

```typescript
import { createMeshkitClient } from 'ipfs-meshkit';

const client = createMeshkitClient({ apiUrl: 'http://127.0.0.1:5001' });
const cid = await client.upload(data);
```

## Support

- [GitHub Issues](https://github.com/seetadev/IPFS-meshkit/issues) — bugs and feature requests
- [Security policy](SECURITY.md) — private vulnerability reports

## Credits

Open source project by **IPFS Meshkit Contributors**:

- [Anurag Pandey](https://github.com/anurag-p6) — primary development
- [Manu Sheel Gupta](https://github.com/seetadev) — project lead

## License

[MIT](LICENSE)
