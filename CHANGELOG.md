# Changelog

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
