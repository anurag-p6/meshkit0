import { describe, expect, it } from 'vitest';
import { filterHealthy } from '../src/health.js';
import { createMockClient } from './helpers/mock-client.js';

describe('filterHealthy', () => {
  it('keeps reachable nodes in priority order', async () => {
    const clients = [
      createMockClient({
        healthCheck: async () => {
          throw new Error('down');
        },
      }),
      createMockClient({ healthCheck: async () => undefined }),
      createMockClient({ healthCheck: async () => undefined }),
    ];
    const urls = ['http://a:5001', 'http://b:5001', 'http://c:5001'];

    const result = await filterHealthy(clients, urls);

    expect(result.urls).toEqual(['http://b:5001', 'http://c:5001']);
    expect(result.failed).toEqual(['http://a:5001']);
    expect(result.clients).toHaveLength(2);
  });

  it('returns empty healthy set when all nodes fail', async () => {
    const clients = [
      createMockClient({
        healthCheck: async () => {
          throw new Error('down');
        },
      }),
    ];

    const result = await filterHealthy(clients, ['http://a:5001']);

    expect(result.clients).toHaveLength(0);
    expect(result.failed).toEqual(['http://a:5001']);
  });
});
