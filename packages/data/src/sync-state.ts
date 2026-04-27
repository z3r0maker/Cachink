/**
 * Typed helpers for the `__cachink_sync_state` key/value table (ADR-029,
 * ADR-030). Every sync-client component — the LAN client's push queue,
 * the pull loop, the pairing flow — stores its cursors and auth material
 * here rather than in `app_config` so Phase 1C's existing AppConfigRepository
 * stays untouched and local-only.
 *
 * Scopes used today:
 *
 *   - `localPushHwm`            — highest `__cachink_change_log.id`
 *                                 already pushed to the LAN server
 *                                 (ADR-029 push path).
 *   - `serverPullHwm`           — highest `serverSeq` this client has
 *                                 pulled from the LAN server.
 *   - `auth.serverUrl`          — LAN server base URL, e.g.
 *                                 `http://192.168.1.5:43812`.
 *   - `auth.accessToken`        — per-device bearer token issued by
 *                                 `/api/v1/pair`.
 *   - `auth.businessId`         — ULID returned by the server at pair time.
 *   - `auth.pairedAt`           — ISO 8601 timestamp.
 *   - `lanRole`                 — 'host' | 'client'. Captured at wizard
 *                                 time on desktop so the LanGate knows
 *                                 which screen to render after the user
 *                                 picks LAN mode. Unset on mobile (the
 *                                 wizard only exposes the client card
 *                                 there so the default is 'client').
 *   - `lanHostReady`            — boolean. Stamped `true` once the
 *                                 bundled Tauri LAN server reports ready
 *                                 (Slice 8 A2 revision). Replaces the
 *                                 pre-revision `auth.accessToken =
 *                                 'cachink-host'` sentinel: hosts don't
 *                                 pair, so they have no real bearer
 *                                 token — the gate uses this scope
 *                                 instead to decide "host is past the
 *                                 LanHostScreen". Never written on
 *                                 clients.
 *   - `cloud.byoBackend`        — JSON `{projectUrl, anonKey, powersyncUrl?}`
 *                                 written by Settings → Avanzado. When
 *                                 present it overrides the baked-in
 *                                 hosted defaults (ADR-035 BYO path).
 *
 * Values are always JSON-stringified so the column can remain a plain
 * `text` column. Reading a scope that doesn't exist returns `null` — no
 * thrown error, because "never synced before" is a first-class state.
 *
 * The helpers purposely accept the driver-agnostic `CachinkDatabase`
 * alias so they run identically on `better-sqlite3` (tests),
 * `expo-sqlite` (mobile), and `@tauri-apps/plugin-sql` (desktop).
 */

import { sql } from 'drizzle-orm';
import type { CachinkDatabase } from './repositories/drizzle/_db.js';

/** All supported sync-state scope keys. Extending is cheap — add a literal. */
export type SyncStateScope =
  | 'localPushHwm'
  | 'serverPullHwm'
  | 'auth.serverUrl'
  | 'auth.accessToken'
  | 'auth.businessId'
  | 'auth.pairedAt'
  | 'lanRole'
  | 'lanHostReady'
  | 'cloud.byoBackend';

/**
 * Read a scope's value. Returns `null` when the scope row doesn't exist.
 *
 * Caller is responsible for the value's runtime type — JSON.parse returns
 * `unknown` by design. Every call site either asserts the expected shape
 * with Zod or uses the returned value via a narrower wrapper in this file.
 */
export async function readSyncState(
  db: CachinkDatabase,
  scope: SyncStateScope,
): Promise<unknown | null> {
  const rows = (await db.all(
    sql`SELECT "value" FROM "__cachink_sync_state" WHERE "scope" = ${scope} LIMIT 1`,
  )) as Array<{ value: string }>;
  const first = rows[0];
  if (!first) return null;
  try {
    return JSON.parse(first.value);
  } catch {
    // Malformed JSON in the state table is a bug — surface it instead of
    // returning a subtly wrong value.
    throw new Error(`sync-state scope "${scope}" holds non-JSON value`);
  }
}

/**
 * Upsert a scope's value. `value` is serialised via `JSON.stringify` so
 * callers never touch raw SQL quoting.
 */
export async function writeSyncState(
  db: CachinkDatabase,
  scope: SyncStateScope,
  value: unknown,
): Promise<void> {
  const serialised = JSON.stringify(value);
  await db.run(
    sql`INSERT INTO "__cachink_sync_state" ("scope", "value") VALUES (${scope}, ${serialised})
        ON CONFLICT ("scope") DO UPDATE SET "value" = excluded."value"`,
  );
}

/**
 * Clear every sync-state row. Used by "Desemparejar este dispositivo" in
 * Settings (Slice 5 C19) to return the device to the unpaired state.
 */
export async function clearSyncState(db: CachinkDatabase): Promise<void> {
  await db.run(sql`DELETE FROM "__cachink_sync_state"`);
}

/**
 * Read the numeric high-water-mark for push or pull. Returns 0 when the
 * scope has never been written — the correct semantic for "start from the
 * beginning".
 */
export async function readHwm(
  db: CachinkDatabase,
  scope: 'localPushHwm' | 'serverPullHwm',
): Promise<number> {
  const raw = await readSyncState(db, scope);
  if (raw === null) return 0;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  throw new Error(`sync-state scope "${scope}" holds non-numeric value`);
}

/** Typed sibling of {@link writeSyncState} for the two HWM scopes. */
export async function writeHwm(
  db: CachinkDatabase,
  scope: 'localPushHwm' | 'serverPullHwm',
  value: number,
): Promise<void> {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`HWM must be a non-negative integer; received ${String(value)}`);
  }
  await writeSyncState(db, scope, value);
}
