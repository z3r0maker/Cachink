/**
 * checkObservabilityHealth — self-diagnostic for the observability system.
 *
 * Verifies:
 *   1. Table exists
 *   2. Row count
 *   3. Oldest entry timestamp
 *   4. Test write + delete (write path functional)
 *   5. DB size estimate
 *
 * Used by the Telemetría stats row to show a live health indicator.
 */

import { ulid } from 'ulid';
import type { SqliteDatabase } from './sqlite-log-store.js';

const TABLE = '__cachink_observability_log';

export interface ObservabilityHealth {
  readonly status: 'healthy' | 'degraded' | 'broken';
  readonly tableExists: boolean;
  readonly rowCount: number;
  readonly oldestEntry: string | null;
  readonly newestEntry: string | null;
  readonly lastWriteSucceeded: boolean;
  readonly dbSizeBytes: number | null;
}

export async function checkObservabilityHealth(
  db: SqliteDatabase,
): Promise<ObservabilityHealth> {
  let tableExists = false;
  let rowCount = 0;
  let oldestEntry: string | null = null;
  let newestEntry: string | null = null;
  let lastWriteSucceeded = false;
  let dbSizeBytes: number | null = null;

  // 1. Check table exists
  try {
    const result = await db.getFirstAsync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name=?`,
      [TABLE],
    );
    tableExists = (result?.cnt ?? 0) > 0;
  } catch {
    return {
      status: 'broken',
      tableExists: false,
      rowCount: 0,
      oldestEntry: null,
      newestEntry: null,
      lastWriteSucceeded: false,
      dbSizeBytes: null,
    };
  }

  if (!tableExists) {
    return {
      status: 'broken',
      tableExists: false,
      rowCount: 0,
      oldestEntry: null,
      newestEntry: null,
      lastWriteSucceeded: false,
      dbSizeBytes: null,
    };
  }

  // 2. Count rows + oldest/newest
  try {
    const countResult = await db.getFirstAsync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM ${TABLE}`,
    );
    rowCount = countResult?.cnt ?? 0;

    const oldest = await db.getFirstAsync<{ timestamp: string }>(
      `SELECT timestamp FROM ${TABLE} ORDER BY timestamp ASC LIMIT 1`,
    );
    oldestEntry = oldest?.timestamp ?? null;

    const newest = await db.getFirstAsync<{ timestamp: string }>(
      `SELECT timestamp FROM ${TABLE} ORDER BY timestamp DESC LIMIT 1`,
    );
    newestEntry = newest?.timestamp ?? null;
  } catch {
    // Degraded — can't read but table exists
  }

  // 3. Test write + delete
  try {
    const testId = `__health_check_${ulid()}`;
    await db.runAsync(
      `INSERT INTO ${TABLE} (id, type, timestamp, device_id) VALUES (?, 'audit', ?, 'health-check')`,
      [testId, new Date().toISOString()],
    );
    await db.runAsync(`DELETE FROM ${TABLE} WHERE id = ?`, [testId]);
    lastWriteSucceeded = true;
  } catch {
    lastWriteSucceeded = false;
  }

  // 4. DB size estimate (page_count * page_size)
  try {
    const pageCount = await db.getFirstAsync<{ page_count: number }>(
      'PRAGMA page_count',
    );
    const pageSize = await db.getFirstAsync<{ page_size: number }>(
      'PRAGMA page_size',
    );
    if (pageCount && pageSize) {
      dbSizeBytes = pageCount.page_count * pageSize.page_size;
    }
  } catch {
    // Non-critical
  }

  const status: ObservabilityHealth['status'] =
    tableExists && lastWriteSucceeded ? 'healthy' :
    tableExists ? 'degraded' : 'broken';

  return {
    status,
    tableExists,
    rowCount,
    oldestEntry,
    newestEntry,
    lastWriteSucceeded,
    dbSizeBytes,
  };
}
