import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { stopIPFSNode } = vi.hoisted(() => ({
  stopIPFSNode: vi.fn(async () => undefined),
}));

vi.mock('@ipfs-meshkit/node', () => ({
  stopIPFSNode,
}));

import {
  resetGracefulShutdownForTests,
  setupGracefulShutdown,
} from '../src/shutdown.js';

describe('setupGracefulShutdown', () => {
  const listeners = new Map<string, () => void>();

  beforeEach(() => {
    resetGracefulShutdownForTests();
    listeners.clear();
    stopIPFSNode.mockClear();
    vi.spyOn(process, 'on').mockImplementation(((event: string, listener: () => void) => {
      listeners.set(event, listener);
      return process;
    }) as never);
    vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never);
  });

  afterEach(() => {
    resetGracefulShutdownForTests();
  });

  it('stops managed Kubo when a shutdown signal fires', async () => {
    const onShutdown = vi.fn();
    const localNode = {
      url: 'http://127.0.0.1:5001',
      managed: true,
      stop: vi.fn(),
    };

    setupGracefulShutdown(localNode, { onShutdown, exit: false });
    listeners.get('SIGINT')?.();

    await vi.waitFor(() => {
      expect(onShutdown).toHaveBeenCalledOnce();
      expect(stopIPFSNode).toHaveBeenCalledWith(localNode);
    });
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('does not stop unmanaged nodes', async () => {
    setupGracefulShutdown(
      {
        url: 'http://127.0.0.1:5001',
        managed: false,
        stop: vi.fn(),
      },
      { exit: false },
    );

    listeners.get('SIGTERM')?.();

    await vi.waitFor(() => {
      expect(stopIPFSNode).not.toHaveBeenCalled();
    });
    expect(process.exit).not.toHaveBeenCalled();
  });

  it('exits with the configured code by default', async () => {
    setupGracefulShutdown(undefined, { exitCode: 0 });

    listeners.get('SIGTERM')?.();

    await vi.waitFor(() => {
      expect(process.exit).toHaveBeenCalledWith(0);
    });
  });

  it('exits with code 1 when onShutdown throws', async () => {
    setupGracefulShutdown(undefined, {
      onShutdown: async () => {
        throw new Error('shutdown failed');
      },
    });

    listeners.get('SIGTERM')?.();

    await vi.waitFor(() => {
      expect(process.exit).toHaveBeenCalledWith(1);
    });
  });

  it('registers signal handlers only once when called multiple times', async () => {
    const firstNode = {
      url: 'http://127.0.0.1:5001',
      managed: true,
      stop: vi.fn(),
    };
    const secondNode = {
      url: 'http://127.0.0.1:5002',
      managed: true,
      stop: vi.fn(),
    };

    setupGracefulShutdown(firstNode, { exit: false });
    setupGracefulShutdown(secondNode, { exit: false });

    expect(process.on).toHaveBeenCalledTimes(2);

    listeners.get('SIGINT')?.();

    await vi.waitFor(() => {
      expect(stopIPFSNode).toHaveBeenCalledWith(secondNode);
      expect(stopIPFSNode).not.toHaveBeenCalledWith(firstNode);
    });
  });
});
