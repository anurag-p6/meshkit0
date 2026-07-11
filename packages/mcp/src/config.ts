export interface McpConfig {
  nodes: string[];
  headers?: Record<string, string> | undefined;
  /** Start or attach to a local Kubo daemon before connecting. */
  localNode: boolean;
}

const DEFAULT_NODES = ['http://127.0.0.1:5001'];

export function parseConfig(env: NodeJS.ProcessEnv = process.env): McpConfig {
  const nodes = parseNodes(env.MESHKIT_NODES);
  const headers = parseHeaders(env.MESHKIT_HEADERS);
  const localNode = parseLocalNode(env.MESHKIT_LOCAL_NODE);

  return {
    nodes,
    localNode,
    ...(headers !== undefined ? { headers } : {}),
  };
}

function parseLocalNode(raw: string | undefined): boolean {
  if (raw === undefined || raw.trim() === '') {
    return false;
  }

  switch (raw.trim().toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
      return true;
    case '0':
    case 'false':
    case 'no':
      return false;
    default:
      throw new Error(
        'MESHKIT_LOCAL_NODE must be true/false (or 1/0, yes/no)',
      );
  }
}

function parseNodes(raw: string | undefined): string[] {
  if (raw === undefined || raw.trim() === '') {
    return [...DEFAULT_NODES];
  }

  const nodes = raw
    .split(',')
    .map((node) => node.trim())
    .filter((node) => node.length > 0);

  if (nodes.length === 0) {
    throw new Error('MESHKIT_NODES must contain at least one URL');
  }

  for (const node of nodes) {
    validateNodeUrl(node);
  }

  return nodes;
}

function validateNodeUrl(node: string): void {
  let url: URL;
  try {
    url = new URL(node);
  } catch {
    throw new Error(`Invalid node URL in MESHKIT_NODES: ${node}`);
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`Node URL must use http or https: ${node}`);
  }
}

function parseHeaders(
  raw: string | undefined,
): Record<string, string> | undefined {
  if (raw === undefined || raw.trim() === '') {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('MESHKIT_HEADERS must be valid JSON');
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('MESHKIT_HEADERS must be a JSON object');
  }

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value !== 'string') {
      throw new Error(`MESHKIT_HEADERS value for "${key}" must be a string`);
    }
    headers[key] = value;
  }

  return Object.keys(headers).length > 0 ? headers : undefined;
}
