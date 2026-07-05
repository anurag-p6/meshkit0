import type { MeshkitClient } from '../../src/types.js';

export function createMockClient(
  overrides: Partial<MeshkitClient> = {},
): MeshkitClient {
  return {
    upload: async () => 'QmMock',
    retrieve: async () => new Uint8Array(),
    pin: async () => undefined,
    publishName: async () => ({
      name: '/ipns/QmMock',
      value: '/ipfs/QmMock',
    }),
    resolveName: async () => '/ipfs/QmMock',
    resolveAndRetrieve: async () => new Uint8Array(),
    generateKey: async () => ({ name: 'self', id: 'QmSelf' }),
    listKeys: async () => [{ name: 'self', id: 'QmSelf' }],
    healthCheck: async () => undefined,
    ...overrides,
  };
}
