import { describe, expect, it } from 'vitest';
import { extractCidFromPath, toIpfsPath, toIpnsPath } from '../../src/ipns/paths.js';

describe('toIpfsPath', () => {
  it('prefixes bare CIDs', () => {
    expect(toIpfsPath('QmFoo')).toBe('/ipfs/QmFoo');
  });

  it('leaves existing /ipfs paths unchanged', () => {
    expect(toIpfsPath('/ipfs/QmFoo')).toBe('/ipfs/QmFoo');
  });

  it('trims whitespace', () => {
    expect(toIpfsPath('  QmFoo  ')).toBe('/ipfs/QmFoo');
  });
});

describe('toIpnsPath', () => {
  it('prefixes bare name hashes', () => {
    expect(toIpnsPath('k51qzi5uqu5d')).toBe('/ipns/k51qzi5uqu5d');
  });

  it('leaves existing /ipns paths unchanged', () => {
    expect(toIpnsPath('/ipns/k51qzi5uqu5d')).toBe('/ipns/k51qzi5uqu5d');
  });
});

describe('extractCidFromPath', () => {
  it('extracts CID from /ipfs path', () => {
    expect(extractCidFromPath('/ipfs/QmBar')).toBe('QmBar');
  });

  it('rejects non-ipfs paths', () => {
    expect(() => extractCidFromPath('QmBar')).toThrow(/Expected IPFS path/);
  });

  it('rejects empty CID segment', () => {
    expect(() => extractCidFromPath('/ipfs/')).toThrow(/No CID found/);
  });
});
