import { describe, expect, it } from 'vitest';
import { parseConfig } from '../src/config.js';

describe('parseConfig', () => {
  it('defaults to local Kubo when MESHKIT_NODES is unset', () => {
    expect(parseConfig({})).toEqual({
      nodes: ['http://127.0.0.1:5001'],
      localNode: false,
    });
  });

  it('parses comma-separated node URLs', () => {
    expect(
      parseConfig({
        MESHKIT_NODES: 'http://127.0.0.1:5001, https://backup.example.com:5001',
      }),
    ).toEqual({
      nodes: ['http://127.0.0.1:5001', 'https://backup.example.com:5001'],
      localNode: false,
    });
  });

  it('parses optional auth headers from JSON', () => {
    expect(
      parseConfig({
        MESHKIT_NODES: 'http://127.0.0.1:5001',
        MESHKIT_HEADERS: '{"Authorization":"Bearer token"}',
      }),
    ).toEqual({
      nodes: ['http://127.0.0.1:5001'],
      headers: { Authorization: 'Bearer token' },
      localNode: false,
    });
  });

  it('rejects empty MESHKIT_NODES', () => {
    expect(() => parseConfig({ MESHKIT_NODES: '  ,  ' })).toThrow(
      /at least one URL/i,
    );
  });

  it('rejects invalid node URLs', () => {
    expect(() => parseConfig({ MESHKIT_NODES: 'not-a-url' })).toThrow(
      /Invalid node URL/i,
    );
  });

  it('rejects non-http(s) protocols', () => {
    expect(() => parseConfig({ MESHKIT_NODES: 'ftp://127.0.0.1:5001' })).toThrow(
      /http or https/i,
    );
  });

  it('rejects invalid MESHKIT_HEADERS JSON', () => {
    expect(() =>
      parseConfig({
        MESHKIT_NODES: 'http://127.0.0.1:5001',
        MESHKIT_HEADERS: '{bad json',
      }),
    ).toThrow(/valid JSON/i);
  });

  it('rejects non-object MESHKIT_HEADERS', () => {
    expect(() =>
      parseConfig({
        MESHKIT_NODES: 'http://127.0.0.1:5001',
        MESHKIT_HEADERS: '["not","object"]',
      }),
    ).toThrow(/JSON object/i);
  });

  it('rejects non-string header values', () => {
    expect(() =>
      parseConfig({
        MESHKIT_NODES: 'http://127.0.0.1:5001',
        MESHKIT_HEADERS: '{"count":1}',
      }),
    ).toThrow(/must be a string/i);
  });

  it('defaults when MESHKIT_NODES is whitespace only', () => {
    expect(parseConfig({ MESHKIT_NODES: '   ' })).toEqual({
      nodes: ['http://127.0.0.1:5001'],
      localNode: false,
    });
  });

  it('ignores trailing commas in MESHKIT_NODES', () => {
    expect(parseConfig({ MESHKIT_NODES: 'http://127.0.0.1:5001,' })).toEqual({
      nodes: ['http://127.0.0.1:5001'],
      localNode: false,
    });
  });

  it('accepts https node URLs', () => {
    expect(
      parseConfig({ MESHKIT_NODES: 'https://kubo.example.com:5001' }),
    ).toEqual({
      nodes: ['https://kubo.example.com:5001'],
      localNode: false,
    });
  });

  it('rejects ws:// node URLs', () => {
    expect(() =>
      parseConfig({ MESHKIT_NODES: 'ws://127.0.0.1:5001' }),
    ).toThrow(/http or https/i);
  });

  it('rejects null JSON for MESHKIT_HEADERS', () => {
    expect(() =>
      parseConfig({
        MESHKIT_NODES: 'http://127.0.0.1:5001',
        MESHKIT_HEADERS: 'null',
      }),
    ).toThrow(/JSON object/i);
  });

  it('treats empty header object as unset', () => {
    expect(
      parseConfig({
        MESHKIT_NODES: 'http://127.0.0.1:5001',
        MESHKIT_HEADERS: '{}',
      }),
    ).toEqual({
      nodes: ['http://127.0.0.1:5001'],
      localNode: false,
    });
  });

  it('ignores whitespace-only MESHKIT_HEADERS', () => {
    expect(
      parseConfig({
        MESHKIT_NODES: 'http://127.0.0.1:5001',
        MESHKIT_HEADERS: '   ',
      }),
    ).toEqual({
      nodes: ['http://127.0.0.1:5001'],
      localNode: false,
    });
  });

  it('enables local Kubo when MESHKIT_LOCAL_NODE is true', () => {
    expect(parseConfig({ MESHKIT_LOCAL_NODE: 'true' })).toEqual({
      nodes: ['http://127.0.0.1:5001'],
      localNode: true,
    });
  });

  it('accepts common truthy and falsy values for MESHKIT_LOCAL_NODE', () => {
    expect(parseConfig({ MESHKIT_LOCAL_NODE: '1' }).localNode).toBe(true);
    expect(parseConfig({ MESHKIT_LOCAL_NODE: 'yes' }).localNode).toBe(true);
    expect(parseConfig({ MESHKIT_LOCAL_NODE: '0' }).localNode).toBe(false);
    expect(parseConfig({ MESHKIT_LOCAL_NODE: 'no' }).localNode).toBe(false);
  });

  it('rejects invalid MESHKIT_LOCAL_NODE values', () => {
    expect(() => parseConfig({ MESHKIT_LOCAL_NODE: 'maybe' })).toThrow(
      /MESHKIT_LOCAL_NODE/i,
    );
  });
});
