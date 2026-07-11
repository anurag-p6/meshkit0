import { z } from 'zod';

export const publishNameSchema = {
  value: z
    .string()
    .describe('CID or /ipfs/... path to publish under IPNS'),
  key: z
    .string()
    .optional()
    .describe('Keystore label from ipfs_generate_key (default: node self key)'),
  ttl: z
    .string()
    .optional()
    .describe('Cache hint for resolvers, e.g. "1m", "1h"'),
  lifetime: z
    .string()
    .optional()
    .describe('Record validity window, e.g. "24h", "48h"'),
};

export const resolveSchema = {
  name: z
    .string()
    .describe('IPNS name or /ipns/... path to resolve and retrieve'),
};

export const generateKeySchema = {
  name: z.string().describe('Keystore label for the new IPNS key'),
  type: z
    .enum(['ed25519', 'rsa'])
    .optional()
    .describe('Key type (default: ed25519)'),
};

export type PublishNameInput = z.infer<z.ZodObject<typeof publishNameSchema>>;
export type ResolveInput = z.infer<z.ZodObject<typeof resolveSchema>>;
export type GenerateKeyInput = z.infer<z.ZodObject<typeof generateKeySchema>>;
