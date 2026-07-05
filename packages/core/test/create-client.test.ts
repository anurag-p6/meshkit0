import { beforeEach, describe, expect, it, vi } from 'vitest';

const ipfs = {
  add: vi.fn(),
  cat: vi.fn(),
  pin: { add: vi.fn() },
  id: vi.fn(),
  name: {
    publish: vi.fn(),
    resolve: vi.fn(),
  },
  key: {
    gen: vi.fn(),
    list: vi.fn(),
  },
};

vi.mock('kubo-rpc-client', () => ({
  create: vi.fn(() => ipfs),
}));

import { create } from 'kubo-rpc-client';
import { createMeshkitClient } from '../src/create-client.js';

describe('createMeshkitClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes custom headers to kubo-rpc-client', () => {
    createMeshkitClient({
      apiUrl: 'http://127.0.0.1:5001',
      headers: { Authorization: 'Bearer test' },
    });

    expect(create).toHaveBeenCalledWith({
      url: 'http://127.0.0.1:5001',
      headers: { Authorization: 'Bearer test' },
    });
  });

  it('upload returns the CID string from Kubo', async () => {
    ipfs.add.mockResolvedValue({ cid: { toString: () => 'QmUpload' } });

    const client = createMeshkitClient({ apiUrl: 'http://127.0.0.1:5001' });
    await expect(client.upload(new Uint8Array([1, 2]))).resolves.toBe('QmUpload');
    expect(ipfs.add).toHaveBeenCalledWith(new Uint8Array([1, 2]), { pin: false });
  });

  it('retrieve concatenates streamed chunks', async () => {
    async function* chunks() {
      yield new Uint8Array([1, 2]);
      yield new Uint8Array([3]);
    }
    ipfs.cat.mockReturnValue(chunks());

    const client = createMeshkitClient({ apiUrl: 'http://127.0.0.1:5001' });
    await expect(client.retrieve('QmX')).resolves.toEqual(new Uint8Array([1, 2, 3]));
  });

  it('publishName prefixes values with /ipfs/', async () => {
    ipfs.name.publish.mockResolvedValue({
      name: 'k51Test',
      value: '/ipfs/QmDoc',
    });

    const client = createMeshkitClient({ apiUrl: 'http://127.0.0.1:5001' });
    const result = await client.publishName('QmDoc', { key: 'docs' });

    expect(ipfs.name.publish).toHaveBeenCalledWith('/ipfs/QmDoc', { key: 'docs' });
    expect(result).toEqual({ name: 'k51Test', value: '/ipfs/QmDoc' });
  });

  it('resolveName returns the last resolved path', async () => {
    async function* paths() {
      yield '/ipfs/QmFirst';
      yield '/ipfs/QmFinal';
    }
    ipfs.name.resolve.mockReturnValue(paths());

    const client = createMeshkitClient({ apiUrl: 'http://127.0.0.1:5001' });
    await expect(client.resolveName('k51Test', { nocache: true })).resolves.toBe(
      '/ipfs/QmFinal',
    );
    expect(ipfs.name.resolve).toHaveBeenCalledWith('/ipns/k51Test', { nocache: true });
  });

  it('resolveAndRetrieve follows IPNS to content', async () => {
    async function* paths() {
      yield '/ipfs/QmDoc';
    }
    ipfs.name.resolve.mockReturnValue(paths());

    async function* chunks() {
      yield new Uint8Array([4, 5]);
    }
    ipfs.cat.mockReturnValue(chunks());

    const client = createMeshkitClient({ apiUrl: 'http://127.0.0.1:5001' });
    await expect(client.resolveAndRetrieve('k51Test')).resolves.toEqual(
      new Uint8Array([4, 5]),
    );
    expect(ipfs.cat).toHaveBeenCalledWith('QmDoc');
  });

  it('generateKey and listKeys map Kubo key records', async () => {
    ipfs.key.gen.mockResolvedValue({ id: 'k51Gen', name: 'docs' });
    ipfs.key.list.mockResolvedValue([{ id: 'k51Self', name: 'self' }]);

    const client = createMeshkitClient({ apiUrl: 'http://127.0.0.1:5001' });
    await expect(client.generateKey('docs', { type: 'rsa' })).resolves.toEqual({
      id: 'k51Gen',
      name: 'docs',
    });
    await expect(client.listKeys()).resolves.toEqual([{ id: 'k51Self', name: 'self' }]);
  });

  it('healthCheck calls ipfs.id()', async () => {
    ipfs.id.mockResolvedValue({});

    const client = createMeshkitClient({ apiUrl: 'http://127.0.0.1:5001' });
    await client.healthCheck();

    expect(ipfs.id).toHaveBeenCalledOnce();
  });
});
