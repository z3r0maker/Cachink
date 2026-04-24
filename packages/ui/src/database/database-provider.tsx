/**
 * DatabaseProvider — Vite/Vitest/Tauri fallback variant.
 *
 * This file is the "shared entry" in the CLAUDE.md §5.3 platform-extension
 * pattern. Both consumers of `@cachink/ui` and tools that don't honour
 * platform extensions (Vitest, Storybook, Playwright) resolve here by
 * default. Metro auto-picks `./database-provider.native.tsx` on mobile.
 *
 * Phase 1C-M2-T01 ships the real desktop wiring in Commit 2 — Tauri's
 * `@tauri-apps/plugin-sql` + the Drizzle sqlite-proxy driver. For Commit 1
 * this file re-exports from `./database-provider.web.tsx`, which is a thin
 * stub that errors on initialization (never exercised in tests because
 * they use the `database` prop to inject a pre-built db).
 */

// Re-export context + hook + types + AsyncDatabaseProvider for consumers.
export {
  DatabaseContext,
  useDatabase,
  AsyncDatabaseProvider,
  TestDatabaseProvider,
  type DatabaseProviderProps,
  type AsyncDatabaseProviderProps,
} from './_internal';

export { runMigrations, splitStatements } from './run-migrations';

// Default platform DatabaseProvider — Vite picks this file; Metro overrides
// with .native.tsx. Tests never run this concrete impl; they use the
// `database` prop injection via <DatabaseProvider database={fake} />.
export { DatabaseProvider } from './database-provider.web';
