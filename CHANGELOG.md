# Changelog

## 1.0.0 — 2026-06-18

### Added

- **`ipfs-meshkit` v1.0.0** — single npm package with root `dist/` (ESM + CJS + TypeScript)
- Bundles core, node, and meshkit into one install — `npm install ipfs-meshkit`
- Portable `./.ipfs` repo for server migration
- Unit test suite with coverage; integration tests for persistence, IPNS, attach (local, requires Kubo)

### Not included in 1.0.0

- Separate `@ipfs-meshkit/core` / `@ipfs-meshkit/node` npm packages (code is bundled into meshkit)
- `@ipfs-meshkit/react-native` and `@ipfs-meshkit/capacitor` remain private in the monorepo
