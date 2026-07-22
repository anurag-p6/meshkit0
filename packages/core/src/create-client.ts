import { create } from 'kubo-rpc-client';
import {
  extractCidFromPath,
  toIpfsPath,
  toIpnsPath,
} from './ipns/paths.js';
import type {
  IpnsKeyGenOptions,
  IpnsPublishOptions,
  IpnsResolveOptions,
} from './ipns/types.js';
import type { MeshkitClient, MeshkitConfig, StoredObject } from './types.js';
import { MeshkitError } from './types.js';

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

  async function resolveName(
    name: string,
    options?: IpnsResolveOptions,
  ): Promise<string> {
    const ipnsPath = toIpnsPath(name);
    let resolved = '';

    for await (const path of ipfs.name.resolve(ipnsPath, options)) {
      resolved = path;
    }

    if (!resolved) {
      throw new Error(`IPNS name not found or empty result: ${ipnsPath}`);
    }

    return resolved;
  }

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

    async publishName(value: string, options?: IpnsPublishOptions) {
      const ipfsPath = toIpfsPath(value);
      const res = await ipfs.name.publish(ipfsPath, options);
      return { name: res.name, value: res.value };
    },

    resolveName,

    async resolveAndRetrieve(name: string, options?: IpnsResolveOptions) {
      const path = await resolveName(name, options);
      const cid = extractCidFromPath(path);
      const chunks: Uint8Array[] = [];
      let totalLength = 0;

      for await (const chunk of ipfs.cat(cid)) {
        chunks.push(chunk);
        totalLength += chunk.length;
      }

      return concatChunks(chunks, totalLength);
    },

    async generateKey(name: string, options?: IpnsKeyGenOptions) {
      const key = await ipfs.key.gen(name, options);
      return { id: key.id, name: key.name };
    },

    async listKeys() {
      const keys = await ipfs.key.list();
      return keys.map((key) => ({ id: key.id, name: key.name }));
    },

    async listPins(): Promise<string[]> {
      const cids = new Set<string>();
      for await (const { cid } of ipfs.pin.ls({ type: 'all' })) {
        cids.add(cid.toString());
      }
      return [...cids];
    },

    list() {
      throw new MeshkitError('list() is not supported on Kubo — use listPins() instead');
    },

    async healthCheck(): Promise<void> {
      await ipfs.id();
    },
  };
}
