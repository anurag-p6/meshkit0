import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { init, setupGracefulShutdown } from '@ipfs-meshkit/meshkit';
import pkg from '../package.json' with { type: 'json' };
import { parseConfig } from './config.js';
import { createContext } from './context.js';
import { logError, logInfo } from './logger.js';
import { createServer } from './server.js';

async function main(): Promise<void> {
  const config = parseConfig();

  if (config.localNode) {
    logInfo('Local Kubo enabled — will start or attach to a daemon');
  }

  logInfo(`Connecting to nodes: ${config.nodes.join(', ')}`);

  const { meshkit, localNode } = await init({
    nodes: config.nodes,
    ...(config.localNode ? { localNode: true } : {}),
    ...(config.headers !== undefined ? { headers: config.headers } : {}),
  });

  if (localNode !== undefined) {
    logInfo(
      localNode.managed
        ? `Started local Kubo at ${localNode.url}`
        : `Attached to existing Kubo at ${localNode.url}`,
    );
    setupGracefulShutdown(localNode);
  }

  const ctx = createContext(meshkit);

  logInfo(`Active nodes: ${meshkit.activeNodes.join(', ')}`);

  const server = createServer(ctx, pkg.version);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  logInfo('Meshkit MCP server running on stdio');
}

main().catch((error: unknown) => {
  logError('Fatal error', error);
  process.exit(1);
});
