import type { Meshkit } from '@ipfs-meshkit/meshkit';

export interface MeshkitContext {
  meshkit: Meshkit;
  primaryNode: string;
}

export function createContext(meshkit: Meshkit): MeshkitContext {
  const primaryNode = meshkit.activeNodes[0];
  if (primaryNode === undefined) {
    throw new Error('No active Meshkit nodes available');
  }

  return { meshkit, primaryNode };
}
