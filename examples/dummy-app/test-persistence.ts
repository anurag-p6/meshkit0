import { rm, access } from 'node:fs/promises';
import { join } from 'node:path';
import {
  init,
  listPins,
  stopIPFSNode,
  resolveRepoPath,
} from '@ipfs-meshkit/meshkit';

const TEST_REPO = '.ipfs-test';
const TEST_PORT = 15_001;
const TEST_GATEWAY_PORT = 18_001;
const TEST_HOST = '127.0.0.1';
const TEST_URL = `http://${TEST_HOST}:${TEST_PORT}`;
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

async function phaseOne(): Promise<{ cid: string; payload: string }> {
  console.log('\n[phase 1] start, upload, pin, list pins, graceful stop');

  const { meshkit, localNode } = await init({
    localNode: {
      repo: TEST_REPO,
      host: TEST_HOST,
      port: TEST_PORT,
      gatewayPort: TEST_GATEWAY_PORT,
    },
  });

  assert(localNode?.managed === true, 'spawned managed Kubo');
  assert(localNode?.repo === repoPath, `repo path is ${repoPath}`);
  assert(meshkit.activeNodes[0] === TEST_URL, 'connected to test node');

  const payload = `persistence-test-${Date.now()}`;
  const cid = await meshkit.upload(new TextEncoder().encode(payload));
  await meshkit.pin(cid);

  const pins = await listPins(localNode!.url);
  assert(pins.includes(cid), `pin list contains ${cid}`);

  if (localNode?.managed) {
    await stopIPFSNode(localNode);
  }

  assert(await pathExists(join(repoPath, 'blocks')), 'repo blocks dir exists on disk after stop');

  return { cid, payload };
}

async function phaseTwo(cid: string, originalPayload: string): Promise<void> {
  console.log('\n[phase 2] restart same repo, verify data survived shutdown');

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

  const retrieved = new TextDecoder().decode(await meshkit.retrieve(cid));
  assert(retrieved === originalPayload, 'retrieved same bytes after restart');

  const pins = await listPins(localNode!.url);
  assert(pins.includes(cid), 'pin survived restart');

  if (localNode?.managed) {
    await stopIPFSNode(localNode);
  }
}

async function main(): Promise<void> {
  console.log('meshkit persistence integration test');

  if (await pathExists(repoPath)) {
    await rm(repoPath, { recursive: true, force: true });
  }

  const { cid, payload } = await phaseOne();
  await phaseTwo(cid, payload);

  await rm(repoPath, { recursive: true, force: true });

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
  console.log('all persistence tests ok');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
