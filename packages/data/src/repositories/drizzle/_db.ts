/**
 * Driver-agnostic Drizzle database alias used by every Drizzle repository
 * implementation.
 *
 * We target three runtime drivers across the app:
 *
 *   - `better-sqlite3` (sync) — used only by tests (`:memory:` databases).
 *   - `expo-sqlite` (async) — used by the mobile app in Phase 1C-M2.
 *   - `@tauri-apps/plugin-sql` (async) — used by the desktop app in Phase 1C-M2.
 *
 * Rather than pin repositories to one of those, we type `db` as the union
 * `BaseSQLiteDatabase<'sync' | 'async', …>`. All repo methods are declared
 * `async` so awaiting a `.get()` / `.all()` / `.run()` works identically
 * whether the underlying driver is synchronous or not.
 *
 * The second type parameter (`unknown`) is the result type returned by
 * `run()`; repositories never rely on it so `unknown` is safe here.
 */

import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';
import type * as schema from '../../schema/index.js';

export type CachinkSchema = typeof schema;
export type CachinkDatabase = BaseSQLiteDatabase<'sync' | 'async', unknown, CachinkSchema>;
