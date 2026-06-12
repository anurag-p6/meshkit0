import type { MeshkitClient } from './types.js';

export interface HealthyNodes {
  /** Clients whose nodes passed the health check, in priority order. */
  clients: MeshkitClient[];
  /** URLs of the healthy nodes, aligned with `clients`. */
  urls: string[];
  /** URLs of nodes that failed the health check. */
  failed: string[];
}

/**
 * Health-check each client in parallel and return only the reachable ones,
 * preserving the original priority order.
 */
export async function filterHealthy(
  clients: MeshkitClient[],
  urls: string[],
): Promise<HealthyNodes> {
  const results = await Promise.all(
    clients.map(async (client) => {
      try {
        await client.healthCheck();
        return true;
      } catch {
        return false;
      }
    }),
  );

  const healthy: HealthyNodes = { clients: [], urls: [], failed: [] };

  results.forEach((isHealthy, index) => {
    const url = urls[index]!;
    if (isHealthy) {
      healthy.clients.push(clients[index]!);
      healthy.urls.push(url);
    } else {
      healthy.failed.push(url);
    }
  });

  return healthy;
}
