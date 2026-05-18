/**
 * logMigrationEvent — direct SQL insert for migration lifecycle events.
 *
 * Called BEFORE the LogStore is initialized (chicken-and-egg: migrations
 * run before the observability table is guaranteed to exist). This function
 * ensures the table exists, then writes the event directly.
 *
 * If the table-create or insert fails, the error is silently swallowed —
 * migration logging must never block the actual migration.
 */

import { ulid } from 'ulid';
import type { SqliteDatabase } from './sqlite-log-store.js';

const TABLE = '__cachink_observability_log';

const ENSURE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${TABLE} (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('audit', 'error')),
  timestamp TEXT NOT NULL,
  operation TEXT,
  entity_type TEXT,
  entity_id TEXT,
  user_id TEXT,
  device_id TEXT NOT NULL,
  business_id TEXT,
  status TEXT CHECK (status IN ('success', 'error', NULL)),
  error_name TEXT,
  error_message TEXT,
  error_stack TEXT,
  source TEXT,
  metadata TEXT,
  context TEXT,
  duration_ms INTEGER
);`;

export interface MigrationEventMetadata {
  readonly fromVersion?: number;
  readonly toVersion?: number;
  readonly error?: string;
  readonly migrationCount?: number;
}

/**
 * Write a migration lifecycle event directly to the observability table.
 *
 * @param db - the raw SQLite database handle
 * @param status - 'success' or 'error'
 * @param deviceId - current device ID (may be empty if not yet resolved)
 * @param metadata - migration details
 */
export async function logMigrationEvent(
  db: SqliteDatabase,
  status: 'success' | 'error',
  deviceId: string,
  metadata: MigrationEventMetadata,
): Promise<void> {
  try {
    await db.execAsync(ENSURE_TABLE_SQL);
    await db.runAsync(
      `INSERT OR REPLACE INTO ${TABLE}
       (id, type, timestamp, operation, entity_type, entity_id,
        user_id, device_id, business_id, status, metadata)
       VALUES (?, 'audit', ?, 'system.migration', 'migration', '', NULL, ?, '', ?, ?)`,
      [
        ulid(),
        new Date().toISOString(),
        deviceId,
        status,
        JSON.stringify(metadata),
      ],
    );
  } catch {
    // Silently swallow — migration logging must never block the migration itself.
  }
}
