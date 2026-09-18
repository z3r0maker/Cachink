import 'server-only';

/**
 * Server entry for activation-code minting.
 *
 * The logic lives in `lib/activation-code.ts` so the conformance tooling can
 * mint codes with the **same** function rather than a second copy of it. This
 * file keeps the `server-only` guard on the path the app actually uses;
 * `node:crypto` in the pure module means a client import would fail the build
 * anyway.
 */
export * from '../lib/activation-code';
