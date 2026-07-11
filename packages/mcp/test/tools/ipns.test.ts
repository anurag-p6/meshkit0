import { describe, expect, it, vi } from 'vitest';
import type { MeshkitContext } from '../../src/context.js';
import {
  handleGenerateKey,
  handleListKeys,
  handlePublishName,
  handleResolve,
} from '../../src/tools/ipns.js';

function createMockContext(): MeshkitContext {
  return {
    primaryNode: 'http://127.0.0.1:5001',
    meshkit: {
      activeNodes: ['http://127.0.0.1:5001'],
      upload: vi.fn(),
      retrieve: vi.fn(),
      pin: vi.fn(),
      publishName: vi
        .fn()
        .mockResolvedValue({ name: 'QmName', value: '/ipfs/QmValue' }),
      resolveName: vi.fn(),
      resolveAndRetrieve: vi
        .fn()
        .mockResolvedValue(new TextEncoder().encode('resolved')),
      generateKey: vi.fn().mockResolvedValue({ id: 'QmKeyId', name: 'latest' }),
      listKeys: vi
        .fn()
        .mockResolvedValue([{ id: 'QmSelf', name: 'self' }]),
      listPins: vi.fn(),
    },
  };
}

describe('IPNS tool handlers', () => {
  it('handlePublishName publishes with optional fields', async () => {
    const ctx = createMockContext();
    const result = await handlePublishName(ctx, {
      value: 'QmValue',
      key: 'latest',
      ttl: '1m',
    });

    expect(ctx.meshkit.publishName).toHaveBeenCalledWith('QmValue', {
      key: 'latest',
      ttl: '1m',
    });
    expect(result.content[0]?.text).toContain('QmName');
  });

  it('handlePublishName omits options when only value is provided', async () => {
    const ctx = createMockContext();
    await handlePublishName(ctx, { value: 'QmValue' });

    expect(ctx.meshkit.publishName).toHaveBeenCalledWith('QmValue', undefined);
  });

  it('handlePublishName passes lifetime without other options', async () => {
    const ctx = createMockContext();
    await handlePublishName(ctx, { value: 'QmValue', lifetime: '24h' });

    expect(ctx.meshkit.publishName).toHaveBeenCalledWith('QmValue', {
      lifetime: '24h',
    });
  });

  it('handleResolve retrieves resolved content', async () => {
    const ctx = createMockContext();
    const result = await handleResolve(ctx, { name: '/ipns/QmName' });

    expect(ctx.meshkit.resolveAndRetrieve).toHaveBeenCalledWith('/ipns/QmName');
    expect(result.content[0]?.text).toContain('resolved');
  });

  it('handleGenerateKey creates a keystore entry', async () => {
    const ctx = createMockContext();
    const result = await handleGenerateKey(ctx, {
      name: 'weekly',
      type: 'ed25519',
    });

    expect(ctx.meshkit.generateKey).toHaveBeenCalledWith('weekly', {
      type: 'ed25519',
    });
    expect(result.content[0]?.text).toContain('QmKeyId');
  });

  it('handleGenerateKey omits options when type is not provided', async () => {
    const ctx = createMockContext();
    await handleGenerateKey(ctx, { name: 'weekly' });

    expect(ctx.meshkit.generateKey).toHaveBeenCalledWith('weekly', undefined);
  });

  it('handleListKeys returns keystore entries', async () => {
    const ctx = createMockContext();
    const result = await handleListKeys(ctx);

    expect(ctx.meshkit.listKeys).toHaveBeenCalled();
    expect(result.content[0]?.text).toContain('QmSelf');
  });
});
