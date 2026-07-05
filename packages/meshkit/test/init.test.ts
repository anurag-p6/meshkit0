import { beforeEach, describe, expect, it, vi } from 'vitest';

const { startIPFSNode, coreInit } = vi.hoisted(() => ({
  startIPFSNode: vi.fn(),
  coreInit: vi.fn(),
}));

vi.mock('@ipfs-meshkit/node', () => ({
  DEFAULT_REPO: '.ipfs',
  startIPFSNode,
}));

vi.mock('@ipfs-meshkit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ipfs-meshkit/core')>();
  return {
    ...actual,
    Meshkit: {
      init: coreInit,
    },
  };
});

import { MeshkitError } from '@ipfs-meshkit/core';
import { init } from '../src/init.js';

describe('meshkit init', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    coreInit.mockResolvedValue({ activeNodes: ['http://127.0.0.1:5001'] });
  });

  it('throws when no nodes and localNode is disabled', async () => {
    await expect(init({})).rejects.toBeInstanceOf(MeshkitError);
  });

  it('starts local node with default ./.ipfs repo', async () => {
    startIPFSNode.mockResolvedValue({
      url: 'http://127.0.0.1:5001',
      repo: '/tmp/.ipfs',
      managed: true,
      stop: async () => undefined,
    });

    const result = await init({ localNode: true });

    expect(startIPFSNode).toHaveBeenCalledWith({ repo: '.ipfs' });
    expect(coreInit).toHaveBeenCalledWith({
      nodes: ['http://127.0.0.1:5001'],
    });
    expect(result.localNode?.managed).toBe(true);
  });

  it('merges custom localNode options over defaults', async () => {
    startIPFSNode.mockResolvedValue({
      url: 'http://127.0.0.1:15001',
      managed: true,
      stop: async () => undefined,
    });

    await init({
      localNode: { port: 15_001, repo: '.ipfs-custom' },
      nodes: ['https://backup.example.com:5001'],
    });

    expect(startIPFSNode).toHaveBeenCalledWith({
      repo: '.ipfs-custom',
      port: 15_001,
    });
    expect(coreInit).toHaveBeenCalledWith({
      nodes: ['http://127.0.0.1:15001', 'https://backup.example.com:5001'],
    });
  });

  it('does not duplicate local node URL in nodes list', async () => {
    startIPFSNode.mockResolvedValue({
      url: 'http://127.0.0.1:5001',
      managed: true,
      stop: async () => undefined,
    });

    await init({
      localNode: true,
      nodes: ['http://127.0.0.1:5001', 'https://backup.example.com:5001'],
    });

    expect(coreInit).toHaveBeenCalledWith({
      nodes: ['http://127.0.0.1:5001', 'https://backup.example.com:5001'],
    });
  });

  it('forwards headers to core Meshkit.init', async () => {
    startIPFSNode.mockResolvedValue({
      url: 'http://127.0.0.1:5001',
      managed: true,
      stop: async () => undefined,
    });

    await init({
      localNode: true,
      headers: { Authorization: 'Bearer test' },
    });

    expect(coreInit).toHaveBeenCalledWith({
      nodes: ['http://127.0.0.1:5001'],
      headers: { Authorization: 'Bearer test' },
    });
  });

  it('connects to remote nodes without starting a local daemon', async () => {
    const result = await init({
      nodes: ['https://remote.example.com:5001'],
    });

    expect(startIPFSNode).not.toHaveBeenCalled();
    expect(coreInit).toHaveBeenCalledWith({
      nodes: ['https://remote.example.com:5001'],
    });
    expect(result.localNode).toBeUndefined();
  });

  it('propagates startIPFSNode failures', async () => {
    startIPFSNode.mockRejectedValue(new Error('spawn failed'));

    await expect(init({ localNode: true })).rejects.toThrow('spawn failed');
    expect(coreInit).not.toHaveBeenCalled();
  });
});
