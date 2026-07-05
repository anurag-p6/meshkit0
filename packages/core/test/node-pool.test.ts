import { describe, expect, it } from 'vitest';
import { withFailover, withPrimary } from '../src/node-pool.js';
import { MeshkitError } from '../src/types.js';
import { createMockClient } from './helpers/mock-client.js';

describe('withFailover', () => {
  it('returns the first successful result', async () => {
    const clients = [
      createMockClient({
        upload: async () => {
          throw new Error('primary down');
        },
      }),
      createMockClient({ upload: async () => 'QmBackup' }),
    ];

    const cid = await withFailover(clients, (c) => c.upload(new Uint8Array()));
    expect(cid).toBe('QmBackup');
  });

  it('throws MeshkitError when all nodes fail', async () => {
    const clients = [
      createMockClient({
        upload: async () => {
          throw new Error('a');
        },
      }),
      createMockClient({
        upload: async () => {
          throw new Error('b');
        },
      }),
    ];

    await expect(
      withFailover(clients, (c) => c.upload(new Uint8Array())),
    ).rejects.toMatchObject({
      name: 'MeshkitError',
      message: expect.stringContaining('All nodes failed'),
      causes: [expect.any(Error), expect.any(Error)],
    });
  });
});

describe('withPrimary', () => {
  it('uses only the first client', async () => {
    let secondCalled = false;
    const clients = [
      createMockClient({ pin: async () => undefined }),
      createMockClient({
        pin: async () => {
          secondCalled = true;
        },
      }),
    ];

    await withPrimary(clients, (c) => c.pin('QmX'));
    expect(secondCalled).toBe(false);
  });

  it('throws when no clients are available', async () => {
    await expect(withPrimary([], (c) => c.pin('QmX'))).rejects.toBeInstanceOf(
      MeshkitError,
    );
  });

  it('wraps primary failure in MeshkitError', async () => {
    const clients = [
      createMockClient({
        listKeys: async () => {
          throw new Error('keystore locked');
        },
      }),
    ];

    await expect(withPrimary(clients, (c) => c.listKeys())).rejects.toMatchObject({
      name: 'MeshkitError',
      message: expect.stringContaining('Primary node failed'),
    });
  });
});
