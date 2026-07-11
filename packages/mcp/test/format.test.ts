import { describe, expect, it } from 'vitest';
import {
  decodeUploadInput,
  encodeRetrievedBytes,
  encodeRetrievedBytesSafe,
  errorResult,
  textResult,
} from '../src/format.js';

describe('decodeUploadInput', () => {
  it('encodes text content as UTF-8 bytes', () => {
    const bytes = decodeUploadInput({ content: 'hello' });
    expect(new TextDecoder().decode(bytes)).toBe('hello');
  });

  it('decodes base64 content', () => {
    const bytes = decodeUploadInput({ base64: 'aGVsbG8=' });
    expect(new TextDecoder().decode(bytes)).toBe('hello');
  });

  it('prefers base64 when both are provided', () => {
    const bytes = decodeUploadInput({ content: 'ignored', base64: 'aGVsbG8=' });
    expect(new TextDecoder().decode(bytes)).toBe('hello');
  });

  it('throws when neither content nor base64 is provided', () => {
    expect(() => decodeUploadInput({})).toThrow(/Either content or base64/i);
  });

  it('uploads empty text content', () => {
    const bytes = decodeUploadInput({ content: '' });
    expect(bytes).toEqual(new Uint8Array());
  });

  it('uploads empty base64 payload', () => {
    const bytes = decodeUploadInput({ base64: '' });
    expect(bytes).toEqual(new Uint8Array());
  });

  it('encodes unicode text as UTF-8', () => {
    const bytes = decodeUploadInput({ content: 'hello 🌍' });
    expect(new TextDecoder().decode(bytes)).toBe('hello 🌍');
  });
});

describe('encodeRetrievedBytes', () => {
  it('returns text encoding for valid UTF-8', () => {
    const bytes = new TextEncoder().encode('hello');
    expect(encodeRetrievedBytes(bytes)).toEqual({
      content: 'hello',
      encoding: 'text',
    });
  });

  it('throws for invalid UTF-8', () => {
    const bytes = Uint8Array.from([0xff, 0xfe, 0xfd]);
    expect(() => encodeRetrievedBytes(bytes)).toThrow();
  });
});

describe('encodeRetrievedBytesSafe', () => {
  it('falls back to base64 for binary content', () => {
    const bytes = Uint8Array.from([0xff, 0xfe, 0xfd]);
    const result = encodeRetrievedBytesSafe(bytes);
    expect(result.encoding).toBe('base64');
    expect(Buffer.from(result.content, 'base64')).toEqual(Buffer.from(bytes));
  });

  it('returns text encoding for empty content', () => {
    expect(encodeRetrievedBytesSafe(new Uint8Array())).toEqual({
      content: '',
      encoding: 'text',
    });
  });

  it('preserves unicode in text encoding', () => {
    const bytes = new TextEncoder().encode('café 🚀');
    expect(encodeRetrievedBytesSafe(bytes)).toEqual({
      content: 'café 🚀',
      encoding: 'text',
    });
  });
});

describe('MCP result helpers', () => {
  it('formats JSON text results', () => {
    expect(textResult({ cid: 'QmTest' })).toEqual({
      content: [{ type: 'text', text: '{\n  "cid": "QmTest"\n}' }],
    });
  });

  it('formats error results', () => {
    expect(errorResult('upload failed')).toEqual({
      isError: true,
      content: [{ type: 'text', text: 'upload failed' }],
    });
  });
});
