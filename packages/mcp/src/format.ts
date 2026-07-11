import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export type ContentEncoding = 'text' | 'base64';

export interface EncodedContent {
  content: string;
  encoding: ContentEncoding;
}

export interface UploadInput {
  content?: string | undefined;
  base64?: string | undefined;
}

export function decodeUploadInput(input: UploadInput): Uint8Array {
  if (input.base64 !== undefined) {
    return Uint8Array.from(Buffer.from(input.base64, 'base64'));
  }

  if (input.content !== undefined) {
    return new TextEncoder().encode(input.content);
  }

  throw new Error('Either content or base64 is required');
}

export function encodeRetrievedBytes(bytes: Uint8Array): EncodedContent {
  const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  return { content: text, encoding: 'text' };
}

export function encodeRetrievedBytesSafe(bytes: Uint8Array): EncodedContent {
  try {
    return encodeRetrievedBytes(bytes);
  } catch {
    return {
      content: Buffer.from(bytes).toString('base64'),
      encoding: 'base64',
    };
  }
}

export function textResult(data: unknown): CallToolResult {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
  };
}

export function errorResult(message: string): CallToolResult {
  return {
    isError: true,
    content: [{ type: 'text', text: message }],
  };
}
