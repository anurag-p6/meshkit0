import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createMeshkitClient } = vi.hoisted(() => ({
  createMeshkitClient: vi.fn(),
}));

vi.mock('@ipfs-meshkit/core', () => ({
  createMeshkitClient,
}));

import { isKuboHealthy, waitForKubo } from '../src/health.js';

describe('isKuboHealthy', () => {
  beforeEach(() => {
    createMeshkitClient.mockReset();
  });

  it('returns true when healthCheck succeeds', async () => {
    createMeshkitClient.mockReturnValue({
      healthCheck: vi.fn(async () => undefined),
    });

    await expect(isKuboHealthy('http://127.0.0.1:5001')).resolves.toBe(true);
  });

  it('returns false when healthCheck fails', async () => {
    createMeshkitClient.mockReturnValue({
      healthCheck: vi.fn(async () => {
        throw new Error('down');
      }),
    });

    await expect(isKuboHealthy('http://127.0.0.1:5001')).resolves.toBe(false);
  });
});

describe('waitForKubo', () => {
  beforeEach(() => {
    createMeshkitClient.mockReset();
  });

  it('resolves once the API becomes healthy', async () => {
    const healthCheck = vi
      .fn()
      .mockRejectedValueOnce(new Error('starting'))
      .mockResolvedValueOnce(undefined);
    createMeshkitClient.mockReturnValue({ healthCheck });

    await expect(waitForKubo('http://127.0.0.1:5001', 1_000)).resolves.toBeUndefined();
    expect(healthCheck).toHaveBeenCalledTimes(2);
  });

  it('throws when the API never becomes healthy', async () => {
    createMeshkitClient.mockReturnValue({
      healthCheck: vi.fn(async () => {
        throw new Error('down');
      }),
    });

    await expect(waitForKubo('http://127.0.0.1:15099', 400)).rejects.toThrow(
      'Kubo RPC API did not become healthy',
    );
  });
});
