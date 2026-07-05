import { EventEmitter } from 'node:events';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { access } = vi.hoisted(() => ({
  access: vi.fn(),
}));

const { spawn } = vi.hoisted(() => ({
  spawn: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  access,
}));

vi.mock('node:child_process', () => ({
  spawn,
}));

import { MeshkitNodeError } from '../src/types.js';
import { ensureRepoConfigured } from '../src/repo-config.js';

function mockSpawnSuccess() {
  spawn.mockImplementation((_binary, args) => {
    const child = new EventEmitter() as NodeJS.EventEmitter & {
      stderr: EventEmitter;
    };
    child.stderr = new EventEmitter();
    queueMicrotask(() => child.emit('exit', 0));
    return child;
  });
}

describe('ensureRepoConfigured', () => {
  beforeEach(() => {
    access.mockReset();
    spawn.mockReset();
  });

  it('initializes a missing repo when init is true', async () => {
    access.mockRejectedValue(new Error('missing'));
    mockSpawnSuccess();

    await ensureRepoConfigured('ipfs', '/tmp/repo', '127.0.0.1', 5001, 8080, true);

    expect(spawn).toHaveBeenCalledWith(
      'ipfs',
      ['init'],
      expect.objectContaining({
        env: expect.objectContaining({ IPFS_PATH: '/tmp/repo' }),
      }),
    );
    expect(spawn).toHaveBeenCalledWith(
      'ipfs',
      ['config', 'Addresses.API', '/ip4/127.0.0.1/tcp/5001'],
      expect.any(Object),
    );
    expect(spawn).toHaveBeenCalledWith(
      'ipfs',
      ['config', 'Addresses.Gateway', '/ip4/127.0.0.1/tcp/8080'],
      expect.any(Object),
    );
  });

  it('skips init when the repo already exists', async () => {
    access.mockResolvedValue(undefined);
    mockSpawnSuccess();

    await ensureRepoConfigured('ipfs', '/tmp/repo', '127.0.0.1', 5001, 8080, true);

    expect(spawn).not.toHaveBeenCalledWith('ipfs', ['init'], expect.any(Object));
    expect(spawn).toHaveBeenCalledWith(
      'ipfs',
      ['config', 'Addresses.API', '/ip4/127.0.0.1/tcp/5001'],
      expect.any(Object),
    );
  });

  it('throws when repo is missing and init is false', async () => {
    access.mockRejectedValue(new Error('missing'));

    await expect(
      ensureRepoConfigured('ipfs', '/tmp/missing', '127.0.0.1', 5001, 8080, false),
    ).rejects.toBeInstanceOf(MeshkitNodeError);
    expect(spawn).not.toHaveBeenCalled();
  });

  it('uses IPv6 multiaddrs when host contains a colon', async () => {
    access.mockResolvedValue(undefined);
    mockSpawnSuccess();

    await ensureRepoConfigured('ipfs', '/tmp/repo', '::1', 5001, 8080, true);

    expect(spawn).toHaveBeenCalledWith(
      'ipfs',
      ['config', 'Addresses.API', '/ip6/::1/tcp/5001'],
      expect.any(Object),
    );
    expect(spawn).toHaveBeenCalledWith(
      'ipfs',
      ['config', 'Addresses.Gateway', '/ip6/::1/tcp/8080'],
      expect.any(Object),
    );
  });

  it('wraps non-zero ipfs command exits in MeshkitNodeError', async () => {
    access.mockResolvedValue(undefined);
    spawn.mockImplementation(() => {
      const child = new EventEmitter() as NodeJS.EventEmitter & {
        stderr: EventEmitter;
      };
      child.stderr = new EventEmitter();
      queueMicrotask(() => {
        child.stderr.emit('data', Buffer.from('config failed'));
        child.emit('exit', 1);
      });
      return child;
    });

    await expect(
      ensureRepoConfigured('ipfs', '/tmp/repo', '127.0.0.1', 5001, 8080, true),
    ).rejects.toMatchObject({
      name: 'MeshkitNodeError',
      message: expect.stringContaining('config Addresses.API'),
    });
  });
});
