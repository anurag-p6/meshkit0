import { AwsClient } from 'aws4fetch';
import { CID } from 'multiformats/cid';
import { sha256 } from 'multiformats/hashes/sha2';
import * as raw from 'multiformats/codecs/raw';
import { MeshkitError } from './types.js';
import type { MeshkitClient } from './types.js';

/**
 * Configuration for a fil.one S3-compatible storage bucket.
 *
 * Get your access key at https://app.fil.one → API Keys → Create Key.
 * The endpoint format is: https://<region>.s3.fil.one
 */
export interface FilOneConfig {
  /** fil.one access key ID (format: FHXXXXXXXXXXXXXXXX). */
  accessKeyId: string;

  /** fil.one secret access key. Shown only once at key creation. */
  secretAccessKey: string;

  /** Target bucket name, created in the fil.one dashboard. */
  bucket: string;

  /**
   * S3 endpoint for your fil.one region.
   * @default "https://eu-west-1.s3.fil.one"
   */
  endpoint?: string;
}

const DEFAULT_ENDPOINT = 'https://eu-west-1.s3.fil.one';

/**
 * Compute a CIDv1 (raw codec, sha2-256) from raw bytes.
 *
 * The same bytes always produce the same CID — this is the content-address
 * used as the S3 object key, preserving the content-addressed semantics of
 * the MeshkitClient interface without requiring a running IPFS node.
 */
async function computeCid(data: Uint8Array): Promise<string> {
  const hash = await sha256.digest(data);
  return CID.create(1, raw.code, hash).toString();
}

const NOT_SUPPORTED = (op: string) => async (): Promise<never> => {
  throw new MeshkitError(
    `${op} is not supported by the fil.one client — fil.one is an object store and has no IPFS keystore or pinning layer`,
  );
};

/**
 * Create a MeshkitClient backed by fil.one (Filecoin-native S3-compatible
 * object storage) instead of a Kubo node.
 *
 * Files are stored at <endpoint>/<bucket>/<cidv1> where the CID is computed
 * locally from the raw bytes — no IPFS daemon required.
 *
 * Operations not supported by an object store (IPNS publish/resolve, key
 * management, pin management) throw a MeshkitError explaining the limitation.
 *
 * @example
 * ```ts
 * import { createFilOneClient, Meshkit } from '@ipfs-meshkit/core';
 *
 * const client = createFilOneClient({
 *   accessKeyId: process.env.FIL_ACCESS_KEY!,
 *   secretAccessKey: process.env.FIL_SECRET_KEY!,
 *   bucket: 'my-invoices',
 * });
 *
 * // Use directly as a single-node client
 * const cid = await client.upload(data);
 * const bytes = await client.retrieve(cid);
 * ```
 */
export function createFilOneClient(config: FilOneConfig): MeshkitClient {
  const endpoint = (config.endpoint ?? DEFAULT_ENDPOINT).replace(/\/$/, '');
  const { bucket } = config;

  const aws = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: 's3',
  });

  function objectUrl(key: string): string {
    return `${endpoint}/${bucket}/${key}`;
  }

  async function upload(data: Uint8Array): Promise<string> {
    const cid = await computeCid(data);
    const url = objectUrl(cid);

    const res = await aws.fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: data.buffer as BodyInit,
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new MeshkitError(
        `fil.one upload failed [${res.status}]: ${body || res.statusText}`,
      );
    }

    return cid;
  }

  async function retrieve(cid: string): Promise<Uint8Array> {
    const res = await aws.fetch(objectUrl(cid), { method: 'GET' });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new MeshkitError(
        `fil.one retrieve failed [${res.status}] for CID ${cid}: ${body || res.statusText}`,
      );
    }

    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
  }

  async function healthCheck(): Promise<void> {
    // HEAD on the bucket root — cheapest possible authenticated request.
    // fil.one returns 200 for a valid bucket, 403/404 for bad credentials/missing bucket.
    const res = await aws.fetch(`${endpoint}/${bucket}`, { method: 'HEAD' });

    if (!res.ok && res.status !== 404) {
      throw new MeshkitError(
        `fil.one health check failed [${res.status}]: verify accessKeyId, secretAccessKey, and bucket name`,
      );
    }
  }

  return {
    upload,
    retrieve,

    // fil.one is an object store — there is no pin layer.
    // Silently succeed so callers that unconditionally call pin() after upload
    // do not need special-casing.
    async pin(_cid: string): Promise<void> {},

    publishName: NOT_SUPPORTED('publishName'),
    resolveName: NOT_SUPPORTED('resolveName'),
    resolveAndRetrieve: NOT_SUPPORTED('resolveAndRetrieve'),
    generateKey: NOT_SUPPORTED('generateKey'),
    listKeys: NOT_SUPPORTED('listKeys'),
    listPins: NOT_SUPPORTED('listPins'),

    healthCheck,
  };
}
