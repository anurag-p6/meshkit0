import { create } from 'kubo-rpc-client';
import type { MeshkitClient, MeshkitConfig } from './types.js';

function concatChunks(chunks: Uint8Array[], totalLength: number): Uint8Array {
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export function createMeshkitClient(config: MeshkitConfig): MeshkitClient {
  const ipfs = create(
    config.headers
      ? { url: config.apiUrl, headers: config.headers }
      : { url: config.apiUrl },
  );

  return {
    async upload(data: Uint8Array): Promise<string> {
      const { cid } = await ipfs.add(data, { pin: false });
      return cid.toString();
    },

    async retrieve(cid: string): Promise<Uint8Array> {
      const chunks: Uint8Array[] = [];
      let totalLength = 0;

      for await (const chunk of ipfs.cat(cid)) {
        chunks.push(chunk);
        totalLength += chunk.length;
      }

      return concatChunks(chunks, totalLength);
    },

    async pin(cid: string): Promise<void> {
      await ipfs.pin.add(cid);
    },

    async healthCheck(): Promise<void> {
      await ipfs.id();
    },
  };
}
