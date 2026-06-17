export class MeshkitError extends Error {
  /** The individual errors collected from each node that was tried. */
  readonly causes: Error[];

  constructor(message: string, causes: Error[] = []) {
    super(causes.length > 0 ? `${message}: ${causes.map((e) => e.message).join('; ')}` : message);
    this.name = 'MeshkitError';
    this.causes = causes;
  }
}

export interface MeshkitConfig {
  /**
   * Kubo RPC API base URL for a running IPFS node.
   * Examples: `http://127.0.0.1:5001` (local) or `https://ipfs.example.com:5001` (VPS).
   */
  apiUrl: string;

  /**
   * Optional request headers (e.g. API auth configured on the node).
   */
  headers?: Record<string, string>;
}

export interface MeshkitClient {
  /** Upload raw bytes to the connected IPFS node. Returns the CID string. */
  upload(data: Uint8Array): Promise<string>;

  /** Retrieve file contents from the connected IPFS node by CID. */
  retrieve(cid: string): Promise<Uint8Array>;

  /** Pin a CID on the connected IPFS node so it is not garbage-collected. */
  pin(cid: string): Promise<void>;

  /** Confirm the node's RPC API is reachable. Throws if it is not. */
  healthCheck(): Promise<void>;
}

export interface MeshkitInitOptions {
  /**
   * Kubo RPC API URLs for the IPFS nodes to connect to, in priority order.
   * The first node is the primary; later nodes are used for failover.
   * Examples: `http://127.0.0.1:5001` (local) or `https://node.example.com:5001` (VPS).
   */
  nodes: string[];

  /** Optional request headers sent to every node (e.g. API auth). */
  headers?: Record<string, string>;
}

export interface Meshkit {
  /** Upload raw bytes, trying each healthy node in priority order. */
  upload(data: Uint8Array): Promise<string>;

  /** Retrieve file contents by CID, trying each healthy node in priority order. */
  retrieve(cid: string): Promise<Uint8Array>;

  /** Pin a CID, trying each healthy node in priority order. */
  pin(cid: string): Promise<void>;

  /** Nodes that passed the health check at init, in priority order. */
  readonly activeNodes: readonly string[];
}
