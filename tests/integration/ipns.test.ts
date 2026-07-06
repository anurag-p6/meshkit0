import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  extractCidFromPath,
  init,
  IPNS_TTL_FAST,
  listPins,
  resolveRepoPath,
  type IPFSNodeHandle,
} from '@ipfs-meshkit/meshkit';
import {
  hasKubo,
  removeDir,
  stopManagedNode,
  waitForIpnsResolve,
} from './helpers.js';

const testDir = dirname(fileURLToPath(import.meta.url));
const TEST_REPO = join(testDir, '.ipfs-ipns-test');
const TEST_PORT = 15_002;
const TEST_GATEWAY_PORT = 18_002;
const TEST_HOST = '127.0.0.1';
const TEST_URL = `http://${TEST_HOST}:${TEST_PORT}`;
const KEY_NAME = 'meshkit-ipns-test-key';
const repoPath = resolveRepoPath(TEST_REPO);

const localNodeOptions = {
  repo: TEST_REPO,
  host: TEST_HOST,
  port: TEST_PORT,
  gatewayPort: TEST_GATEWAY_PORT,
} as const;

describe.skipIf(!hasKubo())('IPNS integration', () => {
  let ipnsName = '';
  let cidV2 = '';
  let payloadV2 = '';

  beforeAll(async () => {
    await removeDir(repoPath);
  });

  afterAll(async () => {
    await removeDir(repoPath);
  });

  describe.sequential('mutable naming', () => {
    it('phase 1: keys, publish, resolve, mutable update', async () => {
      let localNode: IPFSNodeHandle | undefined;

      try {
        const result = await init({ localNode: localNodeOptions });
        localNode = result.localNode;
        const { meshkit } = result;

        expect(localNode?.managed).toBe(true);
        expect(meshkit.activeNodes[0]).toBe(TEST_URL);

        const generatedKey = await meshkit.generateKey(KEY_NAME);
        const keys = await meshkit.listKeys();
        expect(keys.some((key) => key.name === KEY_NAME)).toBe(true);

        const payloadV1 = `ipns-test-v1-${Date.now()}`;
        const cidV1 = await meshkit.upload(new TextEncoder().encode(payloadV1));
        await meshkit.pin(cidV1);

        const published = await meshkit.publishName(cidV1, {
          key: KEY_NAME,
          ttl: IPNS_TTL_FAST,
        });
        ipnsName = `/ipns/${published.name}`;
        expect(published.name).toBe(generatedKey.id);

        await waitForIpnsResolve(meshkit, ipnsName, cidV1);
        const resolvedV1 = await meshkit.resolveName(ipnsName, { nocache: true });
        expect(extractCidFromPath(resolvedV1)).toBe(cidV1);

        payloadV2 = `ipns-test-v2-${Date.now()}`;
        cidV2 = await meshkit.upload(new TextEncoder().encode(payloadV2));
        await meshkit.pin(cidV2);
        await meshkit.publishName(cidV2, { key: KEY_NAME, ttl: IPNS_TTL_FAST });

        await waitForIpnsResolve(meshkit, ipnsName, cidV2);
        const resolvedV2 = await meshkit.resolveName(ipnsName, { nocache: true });
        expect(extractCidFromPath(resolvedV2)).toBe(cidV2);
        expect(cidV2).not.toBe(cidV1);

        const retrieved = new TextDecoder().decode(
          await meshkit.resolveAndRetrieve(ipnsName, { nocache: true }),
        );
        expect(retrieved).toBe(payloadV2);

        const pins = await listPins(localNode!.url);
        expect(pins).toContain(cidV2);
      } finally {
        await stopManagedNode(localNode);
      }
    });

    it('phase 2: restart same repo, keys and IPNS survive', async () => {
      let localNode: IPFSNodeHandle | undefined;

      try {
        const result = await init({
          localNode: { ...localNodeOptions, init: false },
        });
        localNode = result.localNode;
        const { meshkit } = result;

        expect(localNode?.managed).toBe(true);

        const keys = await meshkit.listKeys();
        expect(keys.some((key) => key.name === KEY_NAME)).toBe(true);

        await waitForIpnsResolve(meshkit, ipnsName, cidV2);
        const retrieved = new TextDecoder().decode(
          await meshkit.resolveAndRetrieve(ipnsName, { nocache: true }),
        );
        expect(retrieved).toBe(payloadV2);
      } finally {
        await stopManagedNode(localNode);
      }
    });
  });
});
