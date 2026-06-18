import { init, listPins, setupGracefulShutdown } from '@ipfs-meshkit/meshkit';

async function bootstrap() {
  const { meshkit, localNode } = await init({ localNode: true });

  setupGracefulShutdown(localNode);

  console.log('Meshkit ready');
  console.log('  repo:', localNode?.repo ?? '(attached to external daemon)');
  console.log('  active nodes:', meshkit.activeNodes);
  console.log('  kubo managed:', localNode?.managed ?? false);
  console.log('  Ctrl+C stops Kubo gracefully — ./.ipfs data stays on disk');

  const text = `hello from dummy-app @ ${new Date().toISOString()}`;
  const cid = await meshkit.upload(new TextEncoder().encode(text));
  await meshkit.pin(cid);
  console.log('  uploaded & pinned cid:', cid);

  const pins = await listPins(meshkit.activeNodes[0]);
  console.log('  pinned cids:', pins.length);

  const retrieved = new TextDecoder().decode(await meshkit.retrieve(cid));
  console.log('  retrieved:', retrieved);

  console.log('\nServer running — press Ctrl+C to shut down gracefully');
}

bootstrap().catch((err) => {
  console.error('dummy-app failed:', err);
  process.exit(1);
});
