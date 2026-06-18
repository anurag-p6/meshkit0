import { resolve } from 'node:path';

/** Default Kubo repo directory relative to the process cwd. */
export const DEFAULT_REPO = '.ipfs';

/** Resolve a repo path to an absolute filesystem path. */
export function resolveRepoPath(repo: string = DEFAULT_REPO): string {
  return resolve(repo);
}
