import { describe, expect, it } from 'vitest';
import { createContext } from '../src/context.js';

describe('createContext', () => {
  it('uses the first active node as primaryNode', () => {
    const meshkit = {
      activeNodes: ['http://primary:5001', 'http://backup:5001'],
    };

    expect(createContext(meshkit as never)).toEqual({
      meshkit,
      primaryNode: 'http://primary:5001',
    });
  });

  it('throws when no active nodes are available', () => {
    expect(() => createContext({ activeNodes: [] } as never)).toThrow(
      /No active Meshkit nodes/i,
    );
  });
});
