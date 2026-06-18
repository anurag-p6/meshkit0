export class MeshkitNodeError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'MeshkitNodeError';
  }
}

export interface StartIPFSNodeOptions {
  /**
   * Kubo RPC API host. Defaults to `127.0.0.1`.
   */
  host?: string;

  /**
   * Kubo RPC API port. Defaults to `5001`.
   */
  port?: number;

  /**
   * Kubo HTTP gateway port. Defaults to `8080`.
   * Set a unique port when running multiple local Kubo instances.
   */
  gatewayPort?: number;

  /**
   * Filesystem path for the Kubo repo (`IPFS_PATH`).
   * When omitted, Kubo uses its default repo location.
   */
  repo?: string;

  /**
   * Pass `--init` to `ipfs daemon` so a missing repo is initialized automatically.
   * Defaults to `true`.
   */
  init?: boolean;

  /**
   * Maximum time to wait for the RPC API to become healthy after spawn.
   * Defaults to `30000` ms.
   */
  readyTimeoutMs?: number;

  /**
   * Kubo binary name or absolute path. Defaults to `ipfs`.
   */
  ipfsBinary?: string;
}

export interface IPFSNodeHandle {
  /** Kubo RPC API base URL, e.g. `http://127.0.0.1:5001`. */
  readonly url: string;

  /**
   * Absolute path to the Kubo repo (`IPFS_PATH`) when Meshkit spawned the daemon.
   * Omitted when attaching to an existing daemon (`managed: false`).
   */
  readonly repo?: string;

  /**
   * `true` when Meshkit spawned this daemon; `false` when an existing daemon was reused.
   */
  readonly managed: boolean;

  /** Stop the daemon only when `managed` is `true`. */
  stop(): Promise<void>;
}
