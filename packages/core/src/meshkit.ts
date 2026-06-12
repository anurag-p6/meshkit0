import { createMeshkitClient } from './create-client.js';
import { filterHealthy } from './health.js';
import { withFailover } from './node-pool.js';
import { MeshkitError } from './types.js';
import type {
  Meshkit as MeshkitFacade,
  MeshkitClient,
  MeshkitInitOptions,
} from './types.js';

export class Meshkit implements MeshkitFacade {
  readonly activeNodes: readonly string[];

  private readonly clients: MeshkitClient[];

  private constructor(clients: MeshkitClient[], urls: string[]) {
    this.clients = clients;
    this.activeNodes = Object.freeze([...urls]);
  }

  /**
   * Connect to one or more running Kubo nodes. Each node is health-checked;
   * unreachable nodes are dropped. Throws if no node is reachable.
   */
  static async init(options: MeshkitInitOptions): Promise<Meshkit> {
    if (options.nodes.length === 0) {
      throw new MeshkitError('At least one node URL is required');
    }

    const clients = options.nodes.map((url) =>
      options.headers
        ? createMeshkitClient({ apiUrl: url, headers: options.headers })
        : createMeshkitClient({ apiUrl: url }),
    );

    const healthy = await filterHealthy(clients, options.nodes);

    if (healthy.clients.length === 0) {
      throw new MeshkitError(
        `No reachable nodes (tried: ${options.nodes.join(', ')})`,
      );
    }

    return new Meshkit(healthy.clients, healthy.urls);
  }

  upload(data: Uint8Array): Promise<string> {
    return withFailover(this.clients, (client) => client.upload(data));
  }

  retrieve(cid: string): Promise<Uint8Array> {
    return withFailover(this.clients, (client) => client.retrieve(cid));
  }

  pin(cid: string): Promise<void> {
    return withFailover(this.clients, (client) => client.pin(cid));
  }
}
