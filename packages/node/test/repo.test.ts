import { describe, expect, it } from 'vitest';
import { DEFAULT_REPO, resolveRepoPath } from '../src/repo.js';

describe('resolveRepoPath', () => {
  it('defaults to .ipfs', () => {
    expect(resolveRepoPath()).toContain('.ipfs');
    expect(resolveRepoPath(DEFAULT_REPO)).toBe(resolveRepoPath('.ipfs'));
  });

  it('resolves relative paths to absolute', () => {
    const resolved = resolveRepoPath('./custom-ipfs');
    expect(resolved).toMatch(/custom-ipfs$/);
    expect(resolved.startsWith('/')).toBe(true);
  });
});
