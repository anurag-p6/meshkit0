import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import { join } from 'node:path';
import { MeshkitNodeError } from './types.js';

function runIpfsCommand(
  binary: string,
  repo: string,
  args: string[],
): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, args, {
      env: { ...process.env, IPFS_PATH: repo },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.once('error', (error) => {
      reject(new MeshkitNodeError(`ipfs ${args.join(' ')} failed.`, { cause: error }));
    });

    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new MeshkitNodeError(
          `ipfs ${args.join(' ')} exited with code ${code ?? 'unknown'}: ${stderr.trim()}`,
        ),
      );
    });
  });
}

async function repoExists(repo: string): Promise<boolean> {
  try {
    await access(join(repo, 'config'));
    return true;
  } catch {
    return false;
  }
}

function formatApiAddress(host: string, port: number): string {
  if (host.includes(':')) {
    return `/ip6/${host}/tcp/${port}`;
  }
  return `/ip4/${host}/tcp/${port}`;
}

/**
 * Initialize the repo if needed and align Kubo's API listen address with Meshkit options.
 */
export async function ensureRepoConfigured(
  binary: string,
  repo: string,
  host: string,
  port: number,
  gatewayPort: number,
  init: boolean,
): Promise<void> {
  const exists = await repoExists(repo);

  if (!exists) {
    if (!init) {
      throw new MeshkitNodeError(
        `Kubo repo does not exist at ${repo}. Set init: true or create the repo first.`,
      );
    }
    await runIpfsCommand(binary, repo, ['init']);
  }

  const apiAddress = formatApiAddress(host, port);
  const gatewayAddress = formatApiAddress(host, gatewayPort);
  await runIpfsCommand(binary, repo, ['config', 'Addresses.API', apiAddress]);
  await runIpfsCommand(binary, repo, ['config', 'Addresses.Gateway', gatewayAddress]);
}
