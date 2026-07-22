import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFilOneClient } from '../src/create-filone-client.js';
import { MeshkitError } from '../src/types.js';

// ---------------------------------------------------------------------------
// Minimal config used across all tests
// ---------------------------------------------------------------------------
const CONFIG = {
  accessKeyId: 'FHTESTACCESSKEYID',
  secretAccessKey: 'test-secret-key-value',
  bucket: 'test-bucket',
  endpoint: 'https://eu-west-1.s3.fil.one',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResponse(status: number, body: BodyInit = ''): Response {
  return new Response(body, { status });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createFilOneClient', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  describe('upload', () => {
    it('returns the CIDv1 of the uploaded bytes', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(200)));

      const client = createFilOneClient(CONFIG);
      const data = new TextEncoder().encode('hello filecoin');
      const cid = await client.upload(data);

      // CIDv1 strings start with "b" (base32 encoding)
      expect(cid).toMatch(/^b[a-z2-7]+$/);
    });

    it('sends a signed PUT request to the correct URL', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeResponse(200));
      vi.stubGlobal('fetch', fetchMock);

      const client = createFilOneClient(CONFIG);
      const data = new TextEncoder().encode('invoice data');
      const cid = await client.upload(data);

      expect(fetchMock).toHaveBeenCalledOnce();
      // aws4fetch passes a signed Request object as the first argument
      const req = fetchMock.mock.calls[0][0] as Request;
      expect(req.url).toBe(`https://eu-west-1.s3.fil.one/test-bucket/${cid}`);
      expect(req.method).toBe('PUT');
    });

    it('throws MeshkitError when the server returns a non-2xx status', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(makeResponse(403, 'AccessDenied')),
      );

      const client = createFilOneClient(CONFIG);
      await expect(
        client.upload(new TextEncoder().encode('data')),
      ).rejects.toBeInstanceOf(MeshkitError);
    });

    it('produces identical CIDs for identical content (content-addressed)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(200)));

      const client = createFilOneClient(CONFIG);
      const data = new TextEncoder().encode('same content');

      const cid1 = await client.upload(data);
      const cid2 = await client.upload(data);

      expect(cid1).toBe(cid2);
    });

    it('produces different CIDs for different content', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(200)));

      const client = createFilOneClient(CONFIG);

      const cid1 = await client.upload(new TextEncoder().encode('invoice-001'));
      const cid2 = await client.upload(new TextEncoder().encode('invoice-002'));

      expect(cid1).not.toBe(cid2);
    });
  });

  describe('retrieve', () => {
    it('returns the bytes stored at the given CID', async () => {
      const original = new TextEncoder().encode('invoice payload');
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(original.buffer)),
      );

      const client = createFilOneClient(CONFIG);
      const result = await client.retrieve(
        'bafkreihdwdcefgh4dqkjv67uzcmw7ojee6xedzdetojuzjevtenxquvyku',
      );

      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toEqual(original);
    });

    it('sends a signed GET request to the correct URL', async () => {
      const fetchMock = vi
        .fn()
        .mockResolvedValue(new Response(new Uint8Array(4).buffer));
      vi.stubGlobal('fetch', fetchMock);

      const client = createFilOneClient(CONFIG);
      const cid = 'bafkreiabcdef';
      await client.retrieve(cid);

      const req = fetchMock.mock.calls[0][0] as Request;
      expect(req.url).toBe(`https://eu-west-1.s3.fil.one/test-bucket/${cid}`);
      expect(req.method).toBe('GET');
    });

    it('throws MeshkitError on 404', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(makeResponse(404, 'NoSuchKey')),
      );

      const client = createFilOneClient(CONFIG);
      await expect(client.retrieve('bafkreimissing')).rejects.toBeInstanceOf(
        MeshkitError,
      );
    });
  });

  describe('pin', () => {
    it('silently succeeds (no-op — fil.one has no pin layer)', async () => {
      const client = createFilOneClient(CONFIG);
      await expect(
        client.pin('bafkreiabcdef'),
      ).resolves.toBeUndefined();
    });
  });

  describe('healthCheck', () => {
    it('resolves when the bucket HEAD returns 200', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(200)));

      const client = createFilOneClient(CONFIG);
      await expect(client.healthCheck()).resolves.toBeUndefined();
    });

    it('resolves when the bucket HEAD returns 404 (bucket exists, no listing)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(404)));

      const client = createFilOneClient(CONFIG);
      await expect(client.healthCheck()).resolves.toBeUndefined();
    });

    it('throws MeshkitError on 403 (bad credentials)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeResponse(403)));

      const client = createFilOneClient(CONFIG);
      await expect(client.healthCheck()).rejects.toBeInstanceOf(MeshkitError);
    });
  });

  describe('unsupported IPNS / key / pin operations', () => {
    it.each([
      ['publishName', (c: ReturnType<typeof createFilOneClient>) => c.publishName('/ipfs/abc')],
      ['resolveName', (c: ReturnType<typeof createFilOneClient>) => c.resolveName('k51abc')],
      ['resolveAndRetrieve', (c: ReturnType<typeof createFilOneClient>) => c.resolveAndRetrieve('k51abc')],
      ['generateKey', (c: ReturnType<typeof createFilOneClient>) => c.generateKey('my-key')],
      ['listKeys', (c: ReturnType<typeof createFilOneClient>) => c.listKeys()],
      ['listPins', (c: ReturnType<typeof createFilOneClient>) => c.listPins()],
    ])('%s throws MeshkitError', async (_name, call) => {
      const client = createFilOneClient(CONFIG);
      await expect(call(client)).rejects.toBeInstanceOf(MeshkitError);
    });
  });

  describe('config defaults', () => {
    it('uses eu-west-1.s3.fil.one when no endpoint is provided', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeResponse(200));
      vi.stubGlobal('fetch', fetchMock);

      const client = createFilOneClient({
        accessKeyId: CONFIG.accessKeyId,
        secretAccessKey: CONFIG.secretAccessKey,
        bucket: CONFIG.bucket,
        // endpoint intentionally omitted
      });

      const data = new TextEncoder().encode('default endpoint test');
      const cid = await client.upload(data);

      const req = fetchMock.mock.calls[0][0] as Request;
      expect(req.url).toContain('eu-west-1.s3.fil.one');
      expect(req.url).toContain(cid);
    });

    it('strips a trailing slash from a custom endpoint', async () => {
      const fetchMock = vi.fn().mockResolvedValue(makeResponse(200));
      vi.stubGlobal('fetch', fetchMock);

      const client = createFilOneClient({
        ...CONFIG,
        endpoint: 'https://eu-west-1.s3.fil.one/',
      });

      await client.upload(new TextEncoder().encode('trailing slash'));

      const req = fetchMock.mock.calls[0][0] as Request;
      expect(req.url).not.toContain('//test-bucket');
    });
  });
});
