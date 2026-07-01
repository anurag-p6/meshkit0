/** Kubo duration string, e.g. "10s", "1m", "24h". */
export type IpnsDuration = string;

export interface IpnsPublishOptions {
  /**
   * Keystore label from {@link MeshkitClient.generateKey}. Default: node's
   * built-in `"self"` key (PeerID-derived IPNS name).
   */
  key?: string;

  /** Record validity window. Kubo default ~48h if omitted. */
  lifetime?: IpnsDuration;

  /**
   * Cache hint for resolvers — upper bound on stale reads for cached clients,
   * not a guaranteed global propagation delay.
   */
  ttl?: IpnsDuration;

  /** Resolve `value` before publishing. Kubo default: true. */
  resolve?: boolean;
}

export interface IpnsPublishResult {
  /** IPNS name hash, e.g. `"Qm..."` — use as `/ipns/${name}`. */
  name: string;

  /** Published path, e.g. `"/ipfs/Qm..."`. */
  value: string;
}

export interface IpnsResolveOptions {
  /** Resolve until the result is not another IPNS name. */
  recursive?: boolean;

  /** Bypass local cache — useful after publish to verify propagation. */
  nocache?: boolean;
}

export interface IpnsKeyGenOptions {
  type?: 'ed25519' | 'rsa';
  size?: number;
}

export interface IpnsKey {
  /** Public key hash used as the IPNS name. */
  id: string;

  /** Keystore label, e.g. `"invoice-latest"` or `"self"`. */
  name: string;
}
