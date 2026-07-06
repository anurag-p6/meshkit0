import { execSync } from 'node:child_process';
import { access, rm } from 'node:fs/promises';
import {
  extractCidFromPath,
  stopIPFSNode,
  type IPFSNodeHandle,
  type Meshkit,
} from '@ipfs-meshkit/meshkit';

export function hasKubo(): boolean {
  if (process.env.SKIP_INTEGRATION === '1') {
    return false;
  }
  try {
    execSync('ipfs --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function removeDir(path: string): Promise<void> {
  if (await pathExists(path)) {
    await rm(path, { recursive: true, force: true });
  }
}

export async function stopManagedNode(
  localNode: IPFSNodeHandle | undefined,
): Promise<void> {
  if (localNode?.managed) {
    await stopIPFSNode(localNode);
  }
}

export async function waitForIpnsResolve(
  meshkit: Meshkit,
  ipnsName: string,
  expectedCid: string,
  { timeoutMs = 15_000, intervalMs = 200 } = {},
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastPath = '';

  while (Date.now() < deadline) {
    lastPath = await meshkit.resolveName(ipnsName, { nocache: true });
    const resolvedCid = extractCidFromPath(lastPath);
    if (resolvedCid === expectedCid) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    `Timed out waiting for IPNS ${ipnsName} to resolve to ${expectedCid}; last path: ${lastPath}`,
  );
}
