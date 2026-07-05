import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  init,
  resolveRepoPath,
  type IPFSNodeHandle,
} from '@ipfs-meshkit/meshkit';
import { hasKubo, removeDir, stopManagedNode } from './helpers.js';

const testDir = dirname(fileURLToPath(import.meta.url));
const TEST_REPO = join(testDir, '.ipfs-attach-test');
const TEST_PORT = 15_003;
const TEST_GATEWAY_PORT = 18_003;
const TEST_HOST = '127.0.0.1';
const repoPath = resolveRepoPath(TEST_REPO);

const localNodeOptions = {
  repo: TEST_REPO,
  host: TEST_HOST,
  port: TEST_PORT,
  gatewayPort: TEST_GATEWAY_PORT,
} as const;

describe.skipIf(!hasKubo())('attach integration', () => {
  beforeAll(async () => {
    await removeDir(repoPath);
  });

  afterAll(async () => {
    await removeDir(repoPath);
  });

  it('reuses a healthy daemon instead of spawning a second one', async () => {
    let firstNode: IPFSNodeHandle | undefined;
    let secondNode: IPFSNodeHandle | undefined;

    try {
      const first = await init({ localNode: localNodeOptions });
      firstNode = first.localNode;
      expect(firstNode?.managed).toBe(true);

      const payload = `attach-test-${Date.now()}`;
      const cid = await first.meshkit.upload(new TextEncoder().encode(payload));

      const second = await init({ localNode: localNodeOptions });
      secondNode = second.localNode;
      expect(secondNode?.managed).toBe(false);

      const retrieved = new TextDecoder().decode(await second.meshkit.retrieve(cid));
      expect(retrieved).toBe(payload);
    } finally {
      await stopManagedNode(secondNode);
      await stopManagedNode(firstNode);
    }
  });
});
