import { hasKubo } from './tests/integration/helpers.js';

if (process.env.SKIP_INTEGRATION === '1') {
  // Explicit opt-out: integration files may be reported as skipped.
} else if (!hasKubo()) {
  throw new Error(
    'Integration tests require Kubo on PATH. Install from https://docs.ipfs.tech/install/ ' +
      'or set SKIP_INTEGRATION=1 to skip intentionally.',
  );
}
