import { describe, expect, it, vi } from 'vitest';
import { MeshkitError } from '@ipfs-meshkit/meshkit';
import type { MeshkitContext } from '../../src/context.js';
import { uploadSchema } from '../../src/schemas/storage.js';
import {
  handleListPins,
  handlePin,
  handleRetrieve,
  handleUpload,
} from '../../src/tools/storage.js';

function createMockContext(): MeshkitContext {
  return {
    primaryNode: 'http://127.0.0.1:5001',
    meshkit: {
      activeNodes: ['http://127.0.0.1:5001'],
      upload: vi.fn().mockResolvedValue('QmUpload'),
      retrieve: vi.fn().mockResolvedValue(new TextEncoder().encode('hello')),
      pin: vi.fn().mockResolvedValue(undefined),
      publishName: vi.fn(),
      resolveName: vi.fn(),
      resolveAndRetrieve: vi.fn(),
      generateKey: vi.fn(),
      listKeys: vi.fn(),
      listPins: vi.fn().mockResolvedValue(['QmA', 'QmB']),
    },
  };
}

describe('storage tool handlers', () => {
  it('handleUpload uploads UTF-8 content and returns CID', async () => {
    const ctx = createMockContext();
    const result = await handleUpload(ctx, { content: 'hello' });

    expect(ctx.meshkit.upload).toHaveBeenCalledWith(
      new TextEncoder().encode('hello'),
    );
    expect(result.content[0]?.text).toContain('QmUpload');
  });

  it('handleRetrieve returns text-encoded content', async () => {
    const ctx = createMockContext();
    const result = await handleRetrieve(ctx, { cid: 'QmTest' });

    expect(ctx.meshkit.retrieve).toHaveBeenCalledWith('QmTest');
    expect(result.content[0]?.text).toContain('"encoding": "text"');
    expect(result.content[0]?.text).toContain('hello');
  });

  it('handlePin pins a CID', async () => {
    const ctx = createMockContext();
    const result = await handlePin(ctx, { cid: 'QmPin' });

    expect(ctx.meshkit.pin).toHaveBeenCalledWith('QmPin');
    expect(result.content[0]?.text).toContain('"pinned": true');
  });

  it('handleListPins lists pins from the primary node via meshkit', async () => {
    const ctx = createMockContext();

    const result = await handleListPins(ctx);

    expect(ctx.meshkit.listPins).toHaveBeenCalled();
    expect(result.content[0]?.text).toContain('QmA');
    expect(result.content[0]?.text).toContain('QmB');
  });

  it('handleUpload surfaces MeshkitError messages', async () => {
    const ctx = createMockContext();
    vi.mocked(ctx.meshkit.upload).mockRejectedValue(
      new MeshkitError('No reachable nodes'),
    );

    await expect(handleUpload(ctx, { content: 'x' })).rejects.toThrow(
      /No reachable nodes/i,
    );
  });

  it('handleUpload accepts base64 input', async () => {
    const ctx = createMockContext();
    await handleUpload(ctx, { base64: 'aGVsbG8=' });

    expect(ctx.meshkit.upload).toHaveBeenCalledWith(
      new TextEncoder().encode('hello'),
    );
  });

  it('handleRetrieve returns base64 for binary content', async () => {
    const ctx = createMockContext();
    vi.mocked(ctx.meshkit.retrieve).mockResolvedValue(
      Uint8Array.from([0xff, 0xfe]),
    );

    const result = await handleRetrieve(ctx, { cid: 'QmBinary' });

    expect(result.content[0]?.text).toContain('"encoding": "base64"');
  });

  it('handleListPins returns an empty array', async () => {
    const ctx = createMockContext();
    vi.mocked(ctx.meshkit.listPins).mockResolvedValue([]);

    const result = await handleListPins(ctx);

    expect(result.content[0]?.text).toContain('"pins": []');
  });
});

describe('uploadSchema', () => {
  it('rejects empty input', () => {
    const result = uploadSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(
        /Either content or base64/i,
      );
    }
  });

  it('accepts text content', () => {
    expect(uploadSchema.safeParse({ content: 'hello' }).success).toBe(true);
  });

  it('accepts base64 content', () => {
    expect(uploadSchema.safeParse({ base64: 'aGVsbG8=' }).success).toBe(true);
  });
});
