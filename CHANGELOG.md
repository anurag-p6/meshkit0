# Changelog

## 1.1.0 — 2026-07-22

### Added

- **`createFilOneClient(config)`** — new `MeshkitClient` backed by [fil.one](https://fil.one) (Filecoin-native S3-compatible object storage) instead of a Kubo daemon
  - CID is computed locally (CIDv1, raw codec, sha2-256) — no IPFS node required
  - Objects stored at `<endpoint>/<bucket>/<cid>` via AWS Signature V4 (`aws4fetch`)
  - `upload()` issues a signed PUT; `retrieve()` issues a signed GET
  - `pin()` is a silent no-op (object store has no pin layer, so callers don't need special-casing)
  - `healthCheck()` issues a signed HEAD on the bucket — validates credentials and bucket existence
  - IPNS operations (`publishName`, `resolveName`, `resolveAndRetrieve`, `generateKey`, `listKeys`, `listPins`) throw `MeshkitError` with a clear message explaining the limitation
- **`FilOneConfig`** interface exported from the root package — `accessKeyId`, `secretAccessKey`, `bucket`, optional `endpoint` (default: `https://eu-west-1.s3.fil.one`)
- `multiformats` added as a dependency for local CID computation

### Notes

- `createFilOneClient` is a drop-in `MeshkitClient` — works anywhere `createMeshkitClient` works, including Ionic/Capacitor, React Native, and browser environments (no daemon spawn required)
- Do not use `init()` or `startIPFSNode()` with fil.one — those are Node.js daemon paths; use `createFilOneClient` directly

## 1.0.2 — 2026-07-11

### Added

- `Meshkit.listPins()` and `MeshkitClient.listPins()` — list pinned CIDs on the primary node via `kubo-rpc-client` (respects RPC auth headers)

### Notes

- Publish `@ipfs-meshkit/meshkit@1.0.2` before `@ipfs-meshkit/mcp@1.0.0`; MCP depends on `meshkit.listPins()`.

## 1.0.1 — 2026-07-06

### Fixed

- README and package metadata: correct repository links to [IPFS-Meshkit/meshkit0](https://github.com/IPFS-Meshkit/meshkit0)
- Expanded README with install, usage examples, API overview, and CommonJS support

## 1.0.0 — 2026-06-18

### Added

- **`@ipfs-meshkit/meshkit` v1.0.0** — single npm package with root `dist/` (ESM + CJS + TypeScript)
- Bundles core, node, and meshkit into one install — `npm install @ipfs-meshkit/meshkit`
- Portable `./.ipfs` repo for server migration
- Unit test suite with coverage; integration tests for persistence, IPNS, attach (local, requires Kubo)

### Not included in 1.0.0

- Separate `@ipfs-meshkit/core` / `@ipfs-meshkit/node` npm packages (code is bundled into meshkit)
- `@ipfs-meshkit/react-native` and `@ipfs-meshkit/capacitor` remain private in the monorepo
