import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MeshkitContext } from './context.js';
import { registerIpnsTools } from './tools/ipns.js';
import { registerStorageTools } from './tools/storage.js';

export function createServer(
  ctx: MeshkitContext,
  version: string,
): McpServer {
  const server = new McpServer({
    name: 'meshkit',
    version,
  });

  registerStorageTools(server, ctx);
  registerIpnsTools(server, ctx);

  return server;
}
