import { createMeshkitClient } from '@ipfs-meshkit/core';

export async function isKuboHealthy(apiUrl: string): Promise<boolean> {
  const client = createMeshkitClient({ apiUrl });
  try {
    await client.healthCheck();
    return true;
  } catch {
    return false;
  }
}

export async function waitForKubo(
  apiUrl: string,
  timeoutMs: number,
): Promise<void> {
  const startedAt = Date.now();
  const pollIntervalMs = 200;

  while (Date.now() - startedAt < timeoutMs) {
    if (await isKuboHealthy(apiUrl)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Kubo RPC API did not become healthy at ${apiUrl} within ${timeoutMs}ms`);
}
