import { MeshkitError } from '@ipfs-meshkit/meshkit';
import type { MeshkitContext } from '../context.js';
import { errorResult, textResult } from '../format.js';

export async function runTool<T>(
  ctx: MeshkitContext,
  handler: (
    context: MeshkitContext,
    input: T,
  ) => Promise<ReturnType<typeof textResult>>,
  input: T,
): Promise<ReturnType<typeof textResult>> {
  try {
    return await handler(ctx, input);
  } catch (error) {
    return toToolError(error);
  }
}

export async function runToolNoInput(
  ctx: MeshkitContext,
  handler: (
    context: MeshkitContext,
  ) => Promise<ReturnType<typeof textResult>>,
): Promise<ReturnType<typeof textResult>> {
  try {
    return await handler(ctx);
  } catch (error) {
    return toToolError(error);
  }
}

function toToolError(error: unknown): ReturnType<typeof errorResult> {
  if (error instanceof MeshkitError || error instanceof Error) {
    return errorResult(error.message);
  }
  return errorResult('Unknown error');
}
