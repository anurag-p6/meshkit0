import { init, stopIPFSNode } from '@ipfs-meshkit/meshkit';

async function bootstrap() {
  const { meshkit, localNode } = await init({ localNode: true });

  console.log('Meshkit ready');
  console.log('  active nodes:', meshkit.activeNodes);
  console.log('  kubo managed:', localNode?.managed ?? false);

  const text = `hello from dummy-app @ ${new Date().toISOString()}`;
  const cid = await meshkit.upload(new TextEncoder().encode(text));
  console.log('  uploaded cid:', cid);

  const retrieved = new TextDecoder().decode(await meshkit.retrieve(cid));
  console.log('  retrieved:', retrieved);

  if (localNode?.managed) {
    await stopIPFSNode(localNode);
    console.log('  kubo stopped');
  }

  console.log('dummy-app ok');
}

bootstrap().catch((err) => {
  console.error('dummy-app failed:', err);
  process.exit(1);
});
