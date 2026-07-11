import type {
  IpnsKey,
  IpnsKeyGenOptions,
  IpnsPublishOptions,
  IpnsPublishResult,
  IpnsResolveOptions,
} from './ipns/types.js';

export type {
  IpnsDuration,
  IpnsKey,
  IpnsKeyGenOptions,
  IpnsPublishOptions,
  IpnsPublishResult,
  IpnsResolveOptions,
} from './ipns/types.js';

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

  /**
   * Publish an IPNS record pointing at a CID or `/ipfs/...` path.
   * Requires the node's private key (see `generateKey`). Does not pin content.
   */
  publishName(
    value: string,
    options?: IpnsPublishOptions,
  ): Promise<IpnsPublishResult>;

  /**
   * Resolve an IPNS name to a fully resolved `/ipfs/...` path.
   * No private key required — resolution is public.
   */
  resolveName(name: string, options?: IpnsResolveOptions): Promise<string>;

  /**
   * Resolve an IPNS name and retrieve the content bytes.
   * Composes `resolveName` then `retrieve`.
   */
  resolveAndRetrieve(
    name: string,
    options?: IpnsResolveOptions,
  ): Promise<Uint8Array>;

  /**
   * Create a named signing key in the node's keystore for stable IPNS names.
   */
  generateKey(name: string, options?: IpnsKeyGenOptions): Promise<IpnsKey>;

  /** List keys in the node's keystore (includes `"self"`). */
  listKeys(): Promise<IpnsKey[]>;

  /** List all pinned CIDs on the connected node. */
  listPins(): Promise<string[]>;

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

  /**
   * Publish an IPNS record on the primary node (owns the keystore).
   */
  publishName(
    value: string,
    options?: IpnsPublishOptions,
  ): Promise<IpnsPublishResult>;

  /**
   * Resolve an IPNS name, trying each healthy node in priority order.
   */
  resolveName(name: string, options?: IpnsResolveOptions): Promise<string>;

  /**
   * Resolve an IPNS name and retrieve bytes, with failover across healthy nodes.
   */
  resolveAndRetrieve(
    name: string,
    options?: IpnsResolveOptions,
  ): Promise<Uint8Array>;

  /**
   * Create a named signing key on the primary node.
   */
  generateKey(name: string, options?: IpnsKeyGenOptions): Promise<IpnsKey>;

  /** List keys on the primary node's keystore. */
  listKeys(): Promise<IpnsKey[]>;

  /** List all pinned CIDs on the primary node. */
  listPins(): Promise<string[]>;

  /** Nodes that passed the health check at init, in priority order. */
  readonly activeNodes: readonly string[];
}
