import { describe, expect, it, vi } from 'vitest';
import { listPins, parsePinLsResponse } from '../src/pins.js';
import { MeshkitNodeError } from '../src/types.js';

describe('parsePinLsResponse', () => {
  it('parses stream lines with Cid field', () => {
    const body = [
      '{"Cid":"QmFoo","Type":"recursive"}',
      '{"Cid":"QmBar","Type":"recursive"}',
    ].join('\n');

    expect(parsePinLsResponse(body)).toEqual(['QmFoo', 'QmBar']);
  });

  it('parses Keys and Pins legacy formats', () => {
    const body = [
      '{"Keys":{"QmA":{"Type":"recursive"}}}',
      '{"Pins":["QmB"]}',
    ].join('\n');

    expect(parsePinLsResponse(body)).toEqual(['QmA', 'QmB']);
  });

  it('deduplicates CIDs', () => {
    const body = '{"Cid":"QmDup"}\n{"Cid":"QmDup"}\n';
    expect(parsePinLsResponse(body)).toEqual(['QmDup']);
  });
});

describe('listPins', () => {
  it('fetches and parses pin ls from Kubo RPC', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => '{"Cid":"QmListed","Type":"recursive"}\n',
      })),
    );

    await expect(listPins('http://127.0.0.1:5001')).resolves.toEqual(['QmListed']);

    const [requestUrl, requestInit] = vi.mocked(fetch).mock.calls[0]!;
    expect(String(requestUrl)).toBe(
      'http://127.0.0.1:5001/api/v0/pin/ls?type=all&stream=true',
    );
    expect(requestInit).toEqual({ method: 'POST' });
  });

  it('throws MeshkitNodeError on HTTP failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 500,
      })),
    );

    await expect(listPins('http://127.0.0.1:5001')).rejects.toBeInstanceOf(
      MeshkitNodeError,
    );
  });

  it('throws when pin ls body contains invalid JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        text: async () => 'not-json\n',
      })),
    );

    await expect(listPins('http://127.0.0.1:5001')).rejects.toThrow(SyntaxError);
  });
});
