import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { MeshkitContext } from '../context.js';
import { encodeRetrievedBytesSafe, textResult } from '../format.js';
import {
  generateKeySchema,
  publishNameSchema,
  resolveSchema,
  type GenerateKeyInput,
  type PublishNameInput,
  type ResolveInput,
} from '../schemas/ipns.js';
import { runTool, runToolNoInput } from './run-tool.js';

export async function handlePublishName(
  ctx: MeshkitContext,
  input: PublishNameInput,
): Promise<ReturnType<typeof textResult>> {
  const options = {
    ...(input.key !== undefined ? { key: input.key } : {}),
    ...(input.ttl !== undefined ? { ttl: input.ttl } : {}),
    ...(input.lifetime !== undefined ? { lifetime: input.lifetime } : {}),
  };

  const result = await ctx.meshkit.publishName(
    input.value,
    Object.keys(options).length > 0 ? options : undefined,
  );

  return textResult({ name: result.name, value: result.value });
}

export async function handleResolve(
  ctx: MeshkitContext,
  input: ResolveInput,
): Promise<ReturnType<typeof textResult>> {
  const bytes = await ctx.meshkit.resolveAndRetrieve(input.name);
  const encoded = encodeRetrievedBytesSafe(bytes);
  return textResult({ name: input.name, ...encoded });
}

export async function handleGenerateKey(
  ctx: MeshkitContext,
  input: GenerateKeyInput,
): Promise<ReturnType<typeof textResult>> {
  const options =
    input.type !== undefined ? { type: input.type } : undefined;
  const key = await ctx.meshkit.generateKey(input.name, options);
  return textResult({ id: key.id, name: key.name });
}

export async function handleListKeys(
  ctx: MeshkitContext,
): Promise<ReturnType<typeof textResult>> {
  const keys = await ctx.meshkit.listKeys();
  return textResult({ keys });
}

export function registerIpnsTools(server: McpServer, ctx: MeshkitContext): void {
  server.tool(
    'ipfs_publish_name',
    'Publish an IPNS record pointing at a CID or /ipfs/... path',
    publishNameSchema,
    async (input) => runTool(ctx, handlePublishName, input),
  );

  server.tool(
    'ipfs_resolve',
    'Resolve an IPNS name and retrieve its content',
    resolveSchema,
    async (input) => runTool(ctx, handleResolve, input),
  );

  server.tool(
    'ipfs_generate_key',
    'Create a named IPNS signing key in the node keystore',
    generateKeySchema,
    async (input) => runTool(ctx, handleGenerateKey, input),
  );

  server.tool(
    'ipfs_list_keys',
    'List IPNS keys in the node keystore',
    async () => runToolNoInput(ctx, handleListKeys),
  );
}
