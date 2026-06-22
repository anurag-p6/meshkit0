import { stopIPFSNode } from '@ipfs-meshkit/node';
import type { IPFSNodeHandle } from '@ipfs-meshkit/node';

export interface GracefulShutdownOptions {
  /** Called before Kubo is stopped. Use to close HTTP servers, DB pools, etc. */
  onShutdown?: () => void | Promise<void>;

  /** Exit the process after shutdown. Defaults to `true`. */
  exit?: boolean;

  /** Exit code. Defaults to `0`. */
  exitCode?: number;
}

/**
 * Register SIGINT (Ctrl+C) and SIGTERM handlers that stop a managed Kubo daemon
 * gracefully so the repo on disk (e.g. `./.ipfs`) is left in a consistent state.
 */
export function setupGracefulShutdown(
  localNode: IPFSNodeHandle | undefined,
  options: GracefulShutdownOptions = {},
): void {
  let shuttingDown = false;
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

  const handle = (signal: NodeJS.Signals) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;

    void (async () => {
      try {
        if (options.onShutdown) {
          await options.onShutdown();
        }
        if (localNode?.managed) {
          await stopIPFSNode(localNode);
        }
      } catch (error) {
        console.error(`Error during ${signal} shutdown:`, error);
        if (options.exit !== false) {
          process.exit(1);
        }
        return;
      }

      if (options.exit !== false) {
        process.exit(options.exitCode ?? 0);
      }
    })();
  };

  for (const signal of signals) {
    process.on(signal, () => handle(signal));
  }
}
