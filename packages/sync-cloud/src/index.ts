/**
 * @cachink/sync-cloud — PowerSync + Postgres integration. Phase 1E.
 *
 * Only loaded when the user selects Cloud mode in the first-run wizard
 * (dynamic import in `@cachink/ui/sync`). PowerSync is the sync engine;
 * the Postgres backend defaults to Cachink-hosted Supabase but accepts a
 * BYO override via Settings → Avanzado.
 *
 * See CLAUDE.md §7.3, ADR-008, and ADR-035.
 */

export * from './schema/index.js';
export * from './streams/index.js';
export * from './auth/index.js';
export * from './bridge/index.js';
export * from './client/index.js';

export const __version__ = '0.0.0';
