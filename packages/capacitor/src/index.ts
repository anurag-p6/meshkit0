import { registerPlugin } from '@capacitor/core';
import type { MeshkitCapacitorPlugin } from './definitions.js';

export type { MeshkitClient, MeshkitConfig } from '@ipfs-meshkit/core';
export { createMeshkitClient } from '@ipfs-meshkit/core';
export type { MeshkitCapacitorPlugin } from './definitions.js';

const MeshkitCapacitor = registerPlugin<MeshkitCapacitorPlugin>('MeshkitCapacitor', {
  web: () => import('./web.js').then((m) => new m.MeshkitCapacitorWeb()),
});

export { MeshkitCapacitor };
