import { MeshkitNodeError } from './types.js';

interface PinLsLine {
  Cid?: string;
  Keys?: Record<string, { Type?: string }>;
  Pins?: string[];
}

/**
 * List all pinned CIDs on a Kubo node. Useful for migration scripts and backups.
 */
export async function listPins(apiUrl: string): Promise<string[]> {
  const url = new URL('/api/v0/pin/ls', apiUrl);
  url.searchParams.set('type', 'all');
  url.searchParams.set('stream', 'true');

  const response = await fetch(url, { method: 'POST' });
  if (!response.ok) {
    throw new MeshkitNodeError(
      `Failed to list pins at ${apiUrl} (HTTP ${response.status}).`,
    );
  }

  const body = await response.text();
  return parsePinLsResponse(body);
}

/** Parse newline-delimited JSON from Kubo `pin ls` stream output. */
export function parsePinLsResponse(body: string): string[] {
  const cids = new Set<string>();

  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const parsed = JSON.parse(trimmed) as PinLsLine;
    if (parsed.Cid) {
      cids.add(parsed.Cid);
    }
    if (parsed.Keys) {
      for (const cid of Object.keys(parsed.Keys)) {
        cids.add(cid);
      }
    }
    if (parsed.Pins) {
      for (const cid of parsed.Pins) {
        cids.add(cid);
      }
    }
  }

  return [...cids];
}
