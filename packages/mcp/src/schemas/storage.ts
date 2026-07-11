import { z } from 'zod';

export const uploadSchema = z
  .object({
    content: z
      .string()
      .optional()
      .describe('UTF-8 text content to upload'),
    base64: z
      .string()
      .optional()
      .describe('Base64-encoded binary content to upload'),
  })
  .refine((data) => data.content !== undefined || data.base64 !== undefined, {
    message: 'Either content or base64 is required',
  });

export const retrieveSchema = {
  cid: z.string().describe('IPFS CID to retrieve'),
};

export const pinSchema = {
  cid: z.string().describe('IPFS CID to pin'),
};

export type UploadInput = z.infer<typeof uploadSchema>;
export type RetrieveInput = z.infer<z.ZodObject<typeof retrieveSchema>>;
export type PinInput = z.infer<z.ZodObject<typeof pinSchema>>;
