const IPFS_PREFIX = '/ipfs/';
const IPNS_PREFIX = '/ipns/';

/**
 * Normalize a CID or path to `/ipfs/<cid>`.
 */
export function toIpfsPath(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith(IPFS_PREFIX)) {
    return trimmed;
  }
  return `${IPFS_PREFIX}${trimmed}`;
}

/**
 * Normalize an IPNS name hash or path to `/ipns/<name>`.
 */
export function toIpnsPath(name: string): string {
  const trimmed = name.trim();
  if (trimmed.startsWith(IPNS_PREFIX)) {
    return trimmed;
  }
  return `${IPNS_PREFIX}${trimmed}`;
}

/**
 * Extract the CID from an `/ipfs/<cid>` path.
 */
export function extractCidFromPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed.startsWith(IPFS_PREFIX)) {
    throw new Error(`Expected IPFS path starting with ${IPFS_PREFIX}, got: ${path}`);
  }
  const cid = trimmed.slice(IPFS_PREFIX.length);
  if (!cid) {
    throw new Error(`No CID found in IPFS path: ${path}`);
  }
  return cid;
}
