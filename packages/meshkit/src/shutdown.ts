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

interface ShutdownState {
  localNode?: IPFSNodeHandle;
  options: GracefulShutdownOptions;
}

const shutdownState: ShutdownState = {
  options: {},
};

function setShutdownLocalNode(localNode: IPFSNodeHandle | undefined): void {
  if (localNode === undefined) {
    delete shutdownState.localNode;
    return;
  }
  shutdownState.localNode = localNode;
}

const signalListeners = new Map<NodeJS.Signals, () => void>();
let listenersRegistered = false;
let shuttingDown = false;

/**
 * Register SIGINT (Ctrl+C) and SIGTERM handlers that stop a managed Kubo daemon
 * gracefully so the repo on disk (e.g. `./.ipfs`) is left in a consistent state.
 *
 * Safe to call more than once — handlers are registered once; the latest
 * `localNode` and options are used on shutdown.
 */
export function setupGracefulShutdown(
  localNode: IPFSNodeHandle | undefined,
  options: GracefulShutdownOptions = {},
): void {
  setShutdownLocalNode(localNode);
  shutdownState.options = options;

  if (listenersRegistered) {
    return;
  }
  listenersRegistered = true;

  const handle = (signal: NodeJS.Signals) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;

    const { localNode: node, options: opts } = shutdownState;

    void (async () => {
      try {
        if (opts.onShutdown) {
          await opts.onShutdown();
        }
        if (node?.managed) {
          await stopIPFSNode(node);
        }
      } catch (error) {
        console.error(`Error during ${signal} shutdown:`, error);
        if (opts.exit !== false) {
          process.exit(1);
        }
        return;
      }

      if (opts.exit !== false) {
        process.exit(opts.exitCode ?? 0);
      }
    })();
  };

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    const listener = () => handle(signal);
    signalListeners.set(signal, listener);
    process.on(signal, listener);
  }
}

/** @internal Reset shutdown registration — for unit tests only. */
export function resetGracefulShutdownForTests(): void {
  for (const [signal, listener] of signalListeners) {
    process.removeListener(signal, listener);
  }
  signalListeners.clear();
  listenersRegistered = false;
  shuttingDown = false;
  setShutdownLocalNode(undefined);
  shutdownState.options = {};
}
