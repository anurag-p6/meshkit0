export type {
  MeshkitClient,
  MeshkitConfig,
  MeshkitInitOptions,
  IpnsDuration,
  IpnsKey,
  IpnsKeyGenOptions,
  IpnsPublishOptions,
  IpnsPublishResult,
  IpnsResolveOptions,
} from './types.js';
export { MeshkitError } from './types.js';

export { Meshkit } from './meshkit.js';

export { createMeshkitClient } from './create-client.js';
export { createFilOneClient } from './create-filone-client.js';
export type { FilOneConfig } from './create-filone-client.js';

export { IPNS_TTL_DEFAULT, IPNS_TTL_FAST } from './ipns/constants.js';
export { extractCidFromPath, toIpfsPath, toIpnsPath } from './ipns/paths.js';
