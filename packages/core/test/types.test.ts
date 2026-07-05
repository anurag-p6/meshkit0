import { describe, expect, it } from 'vitest';
import { MeshkitError } from '../src/types.js';

describe('MeshkitError', () => {
  it('includes aggregated cause messages', () => {
    const error = new MeshkitError('All nodes failed', [
      new Error('timeout'),
      new Error('connection refused'),
    ]);

    expect(error.name).toBe('MeshkitError');
    expect(error.message).toContain('All nodes failed');
    expect(error.message).toContain('timeout');
    expect(error.message).toContain('connection refused');
    expect(error.causes).toHaveLength(2);
  });

  it('omits cause suffix when there are no causes', () => {
    const error = new MeshkitError('At least one node URL is required');
    expect(error.message).toBe('At least one node URL is required');
    expect(error.causes).toEqual([]);
  });
});
