import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { init, resolveRepoPath } from '@ipfs-meshkit/meshkit';
import { hasKubo, removeDir } from './helpers.js';

const testDir = dirname(fileURLToPath(import.meta.url));
const MISSING_REPO = join(testDir, '.ipfs-missing-repo');
const TEST_PORT = 15_004;
const TEST_GATEWAY_PORT = 18_004;
const TEST_HOST = '127.0.0.1';
const repoPath = resolveRepoPath(MISSING_REPO);

describe.skipIf(!hasKubo())('repo init integration', () => {
  beforeAll(async () => {
    await removeDir(repoPath);
  });

  afterAll(async () => {
    await removeDir(repoPath);
  });

  it('rejects init:false when the repo path does not exist', async () => {
    await expect(
      init({
        localNode: {
          repo: MISSING_REPO,
          host: TEST_HOST,
          port: TEST_PORT,
          gatewayPort: TEST_GATEWAY_PORT,
          init: false,
        },
      }),
    ).rejects.toThrow(/does not exist/);
  });
});
