import { rm, access } from 'node:fs/promises';
import { join } from 'node:path';
import {
  extractCidFromPath,
  init,
  IPNS_TTL_FAST,
  stopIPFSNode,
  resolveRepoPath,
  type Meshkit,
} from '@ipfs-meshkit/meshkit';

const TEST_REPO = '.ipfs-ipns-test';
const TEST_PORT = 15_002;
const TEST_GATEWAY_PORT = 18_002;
const TEST_HOST = '127.0.0.1';
const TEST_URL = `http://${TEST_HOST}:${TEST_PORT}`;
const KEY_NAME = 'meshkit-ipns-test-key';
const repoPath = resolveRepoPath(TEST_REPO);

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed += 1;
    return;
  }
  console.error(`  ✗ ${message}`);
  failed += 1;
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function waitForResolve(
  meshkit: Meshkit,
  ipnsName: string,
  expectedCid: string,
  { timeoutMs = 30_000, intervalMs = 1_000 } = {},
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let lastPath = '';

  while (Date.now() < deadline) {
    lastPath = await meshkit.resolveName(ipnsName, { nocache: true });
    const cid = extractCidFromPath(lastPath);
    if (cid === expectedCid) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(
    `Timed out waiting for IPNS ${ipnsName} to resolve to ${expectedCid}; last path: ${lastPath}`,
  );
}

async function phaseOne(): Promise<{
  ipnsName: string;
  cidV1: string;
  payloadV1: string;
  cidV2: string;
  payloadV2: string;
}> {
  console.log('\n[phase 1] keys, publish, resolve, mutable update');

  const { meshkit, localNode } = await init({
    localNode: {
      repo: TEST_REPO,
      host: TEST_HOST,
      port: TEST_PORT,
      gatewayPort: TEST_GATEWAY_PORT,
    },
  });

  assert(localNode?.managed === true, 'spawned managed Kubo');
  assert(meshkit.activeNodes[0] === TEST_URL, 'connected to test node');

  const generatedKey = await meshkit.generateKey(KEY_NAME);
  const keys = await meshkit.listKeys();
  assert(
    keys.some((key) => key.name === KEY_NAME),
    `listKeys contains ${KEY_NAME}`,
  );

  const payloadV1 = `ipns-test-v1-${Date.now()}`;
  const cidV1 = await meshkit.upload(new TextEncoder().encode(payloadV1));
  await meshkit.pin(cidV1);

  const published = await meshkit.publishName(cidV1, {
    key: KEY_NAME,
    ttl: IPNS_TTL_FAST,
  });
  const ipnsName = `/ipns/${published.name}`;
  assert(published.name === generatedKey.id, 'publishName name matches key id');

  await waitForResolve(meshkit, ipnsName, cidV1);
  const resolvedV1 = await meshkit.resolveName(ipnsName, { nocache: true });
  assert(
    extractCidFromPath(resolvedV1) === cidV1,
    'resolveName returns v1 CID after publish',
  );

  const payloadV2 = `ipns-test-v2-${Date.now()}`;
  const cidV2 = await meshkit.upload(new TextEncoder().encode(payloadV2));
  await meshkit.pin(cidV2);
  await meshkit.publishName(cidV2, { key: KEY_NAME, ttl: IPNS_TTL_FAST });

  await waitForResolve(meshkit, ipnsName, cidV2);
  const resolvedV2 = await meshkit.resolveName(ipnsName, { nocache: true });
  assert(
    extractCidFromPath(resolvedV2) === cidV2,
    'resolveName returns v2 CID after re-publish',
  );
  assert(cidV2 !== cidV1, 'v2 CID differs from v1');

  const retrieved = new TextDecoder().decode(
    await meshkit.resolveAndRetrieve(ipnsName, { nocache: true }),
  );
  assert(retrieved === payloadV2, 'resolveAndRetrieve returns v2 bytes');

  if (localNode?.managed) {
    await stopIPFSNode(localNode);
  }

  return { ipnsName, cidV1, payloadV1, cidV2, payloadV2 };
}

async function phaseTwo(
  ipnsName: string,
  cidV2: string,
  payloadV2: string,
): Promise<void> {
  console.log('\n[phase 2] restart same repo, keys and IPNS survive');

  const { meshkit, localNode } = await init({
    localNode: {
      repo: TEST_REPO,
      host: TEST_HOST,
      port: TEST_PORT,
      gatewayPort: TEST_GATEWAY_PORT,
      init: false,
    },
  });

  assert(localNode?.managed === true, 'respawned Kubo on same repo');

  const keys = await meshkit.listKeys();
  assert(
    keys.some((key) => key.name === KEY_NAME),
    'key survived repo restart',
  );

  await waitForResolve(meshkit, ipnsName, cidV2);
  const retrieved = new TextDecoder().decode(
    await meshkit.resolveAndRetrieve(ipnsName, { nocache: true }),
  );
  assert(retrieved === payloadV2, 'resolveAndRetrieve works after restart');

  if (localNode?.managed) {
    await stopIPFSNode(localNode);
  }
}

async function main(): Promise<void> {
  console.log('meshkit IPNS integration test');

  if (await pathExists(repoPath)) {
    await rm(repoPath, { recursive: true, force: true });
  }

  const { ipnsName, cidV2, payloadV2 } = await phaseOne();
  await phaseTwo(ipnsName, cidV2, payloadV2);

  await rm(repoPath, { recursive: true, force: true });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
  console.log('all IPNS tests ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
