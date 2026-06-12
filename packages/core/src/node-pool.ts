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
