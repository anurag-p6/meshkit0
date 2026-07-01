import { MeshkitError } from './types.js';
import type { MeshkitClient } from './types.js';

/**
 * Run an operation against each client in priority order, returning the first
 * successful result. If every client fails, throws a `MeshkitError` that
 * aggregates the individual failures.
 */
export async function withFailover<T>(
  clients: MeshkitClient[],
  operation: (client: MeshkitClient) => Promise<T>,
): Promise<T> {
  const errors: Error[] = [];

  for (const client of clients) {
    try {
      return await operation(client);
    } catch (err) {
      errors.push(err instanceof Error ? err : new Error(String(err)));
    }
  }

  throw new MeshkitError('All nodes failed', errors);
}

/**
 * Run an operation against the primary (first) client only.
 * Used for keystore-bound writes such as IPNS publish and key management.
 */
export async function withPrimary<T>(
  clients: MeshkitClient[],
  operation: (client: MeshkitClient) => Promise<T>,
): Promise<T> {
  const primary = clients[0];
  if (!primary) {
    throw new MeshkitError('No nodes available');
  }

  try {
    return await operation(primary);
  } catch (err) {
    throw new MeshkitError('Primary node failed', [
      err instanceof Error ? err : new Error(String(err)),
    ]);
  }
}
