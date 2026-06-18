import { Meshkit as CoreMeshkit } from '@ipfs-meshkit/core';
import { startIPFSNode } from '@ipfs-meshkit/node';
import type { StartIPFSNodeOptions, IPFSNodeHandle } from '@ipfs-meshkit/node';
import type { Meshkit, MeshkitInitOptions } from '@ipfs-meshkit/core';
import { MeshkitError } from '@ipfs-meshkit/core';

export type LocalNodeOption = boolean | StartIPFSNodeOptions;

export interface MeshkitBootstrapOptions extends Omit<MeshkitInitOptions, 'nodes'> {
  /**
   * Kubo RPC URLs in priority order. Optional when `localNode` is enabled.
   */
  nodes?: string[];

  /**
   * Start or attach to a local Kubo daemon before connecting.
   * When `true`, uses default local settings (`127.0.0.1:5001`).
   */
  localNode?: LocalNodeOption;
}

export interface MeshkitBootstrapResult {
  /** Connected Meshkit client with failover across healthy nodes. */
  meshkit: Meshkit;

  /**
   * Present when `localNode` was requested. Call `localNode.stop()` on shutdown
   * if `localNode.managed` is `true`.
   */
  localNode?: IPFSNodeHandle;
}

/**
 * Connect to Kubo with optional local daemon startup.
 *
 * This is the primary Meshkit entry point for Node.js apps. For mobile or
 * remote-only setups, use `Meshkit.init` from `@ipfs-meshkit/core` directly.
 */
export async function init(
  options: MeshkitBootstrapOptions = {},
): Promise<MeshkitBootstrapResult> {
  let localNode: IPFSNodeHandle | undefined;
  const nodes = [...(options.nodes ?? [])];

  if (options.localNode) {
    const nodeOptions =
      typeof options.localNode === 'object' ? options.localNode : {};
    localNode = await startIPFSNode(nodeOptions);
    if (!nodes.includes(localNode.url)) {
      nodes.unshift(localNode.url);
    }
  }

  if (nodes.length === 0) {
    throw new MeshkitError(
      'At least one node URL is required. Pass nodes or set localNode: true.',
    );
  }

  const meshkit = await CoreMeshkit.init({
    nodes,
    ...(options.headers !== undefined ? { headers: options.headers } : {}),
  });

  return localNode !== undefined ? { meshkit, localNode } : { meshkit };
}
