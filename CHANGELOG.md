# Changelog

## 1.2.0 — 2026-07-22

### Added

- **`createS3Client(config)`** — universal `MeshkitClient` backed by any S3-compatible object store (fil.one, Lighthouse, Filebase, 4EVERLAND, etc.)
  - `config.endpoint` is now required and explicit — point it at any S3-compatible service
  - All upload/retrieve/pin/healthCheck logic is unchanged from the previous `createFilOneClient` implementation
  - **`listPins()`** — now works on S3 clients: issues a real `ListObjectsV2` XML request, handles pagination via `ContinuationToken`, filters out non-CID keys (any key containing `.` is excluded)
  - **`list()`** — new method; returns `StoredObject[]` with `{ cid, size, uploadedAt }` for every object in the bucket (same pagination and filtering as `listPins()`)
- **`StoredObject`** interface — `{ cid: string; size: number; uploadedAt: string }` (ISO 8601); exported from the package root
- **`S3StorageConfig`** interface — `{ accessKeyId, secretAccessKey, bucket, endpoint }`; exported from the package root
- **`list(): Promise<StoredObject[]>`** added to the `MeshkitClient` and `Meshkit` interfaces
  - Throws `MeshkitError` on Kubo clients (`createMeshkitClient`, `Meshkit` class) — use `listPins()` on the Kubo path instead
- **Browser / Capacitor build** — a separate `dist/index.browser.{js,cjs,d.ts}` entry is now built and wired to the `browser` export condition in `package.json`; Vite, Capacitor, and React Native bundlers resolve this automatically and no longer encounter `child_process` / `path` errors

### Changed

- **`createFilOneClient`** is now a thin preset over `createS3Client` — it passes through all config and defaults `endpoint` to `https://eu-west-1.s3.fil.one`. The exported `FilOneConfig` type is unchanged and `endpoint` remains optional. No breaking change.
- **`listPins()` on S3 clients** previously threw `MeshkitError`; it now returns real data. If you were catching that error to detect S3 backends, use `list()` as the feature-detection check instead.

### Notes

- `createS3Client` and `createFilOneClient` both implement the same `MeshkitClient` interface — they are drop-in replacements for each other and for `createMeshkitClient` wherever a `MeshkitClient` is accepted
- Store the CID returned by `upload()` in your own database — there is no IPFS DHT lookup on the S3 path; the CID is the S3 object key and is only retrievable if you hold it

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
