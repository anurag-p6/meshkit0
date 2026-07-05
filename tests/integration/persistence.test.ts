import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  init,
  listPins,
  resolveRepoPath,
  type IPFSNodeHandle,
} from '@ipfs-meshkit/meshkit';
import { hasKubo, pathExists, removeDir, stopManagedNode } from './helpers.js';

const testDir = dirname(fileURLToPath(import.meta.url));
const TEST_REPO = join(testDir, '.ipfs-test');
const TEST_PORT = 15_001;
const TEST_GATEWAY_PORT = 18_001;
const TEST_HOST = '127.0.0.1';
const TEST_URL = `http://${TEST_HOST}:${TEST_PORT}`;
const repoPath = resolveRepoPath(TEST_REPO);

const localNodeOptions = {
  repo: TEST_REPO,
  host: TEST_HOST,
  port: TEST_PORT,
  gatewayPort: TEST_GATEWAY_PORT,
} as const;

describe.skipIf(!hasKubo())('persistence integration', () => {
  let cid = '';
  let payload = '';

  beforeAll(async () => {
    await removeDir(repoPath);
  });

  afterAll(async () => {
    await removeDir(repoPath);
  });

  describe.sequential('repo lifecycle', () => {
    it('phase 1: start, upload, pin, list pins, graceful stop', async () => {
      let localNode: IPFSNodeHandle | undefined;

      try {
        const result = await init({ localNode: localNodeOptions });
        localNode = result.localNode;
        const { meshkit } = result;

        expect(localNode?.managed).toBe(true);
        expect(localNode?.repo).toBe(repoPath);
        expect(meshkit.activeNodes[0]).toBe(TEST_URL);

        payload = `persistence-test-${Date.now()}`;
        cid = await meshkit.upload(new TextEncoder().encode(payload));
        await meshkit.pin(cid);

        const pins = await listPins(localNode!.url);
        expect(pins).toContain(cid);
      } finally {
        await stopManagedNode(localNode);
      }

      expect(await pathExists(join(repoPath, 'blocks'))).toBe(true);
    });

    it('phase 2: restart same repo, verify data survived shutdown', async () => {
      let localNode: IPFSNodeHandle | undefined;

      try {
        const result = await init({
          localNode: { ...localNodeOptions, init: false },
        });
        localNode = result.localNode;
        const { meshkit } = result;

        expect(localNode?.managed).toBe(true);
        expect(localNode?.repo).toBe(repoPath);

        const retrieved = new TextDecoder().decode(await meshkit.retrieve(cid));
        expect(retrieved).toBe(payload);

        const pins = await listPins(localNode!.url);
        expect(pins).toContain(cid);
      } finally {
        await stopManagedNode(localNode);
      }
    });
  });
});
