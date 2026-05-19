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

const BROKEN_RESULT: Omit<ObservabilityHealth, 'status'> = {
  tableExists: false, rowCount: 0, oldestEntry: null,
  newestEntry: null, lastWriteSucceeded: false, dbSizeBytes: null,
};

export async function checkObservabilityHealth(
  db: SqliteDatabase,
): Promise<ObservabilityHealth> {
  const tableExists = await checkTableExists(db);
  if (tableExists === null) return { status: 'broken', ...BROKEN_RESULT };
  if (!tableExists) return { status: 'broken', ...BROKEN_RESULT };

  const rowInfo = await fetchRowInfo(db);
  const lastWriteSucceeded = await testWriteDelete(db);
  const dbSizeBytes = await estimateDbSize(db);

  const status: ObservabilityHealth['status'] =
    lastWriteSucceeded ? 'healthy' : 'degraded';

  return { status, tableExists, lastWriteSucceeded, dbSizeBytes, ...rowInfo };
}

async function checkTableExists(db: SqliteDatabase): Promise<boolean | null> {
  try {
    const result = await db.getFirstAsync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table' AND name=?`,
      [TABLE],
    );
    return (result?.cnt ?? 0) > 0;
  } catch {
    return null;
  }
}

async function fetchRowInfo(db: SqliteDatabase): Promise<{
  rowCount: number; oldestEntry: string | null; newestEntry: string | null;
}> {
  try {
    const countResult = await db.getFirstAsync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM ${TABLE}`,
    );
    const oldest = await db.getFirstAsync<{ timestamp: string }>(
      `SELECT timestamp FROM ${TABLE} ORDER BY timestamp ASC LIMIT 1`,
    );
    const newest = await db.getFirstAsync<{ timestamp: string }>(
      `SELECT timestamp FROM ${TABLE} ORDER BY timestamp DESC LIMIT 1`,
    );
    return {
      rowCount: countResult?.cnt ?? 0,
      oldestEntry: oldest?.timestamp ?? null,
      newestEntry: newest?.timestamp ?? null,
    };
  } catch {
    return { rowCount: 0, oldestEntry: null, newestEntry: null };
  }
}

async function testWriteDelete(db: SqliteDatabase): Promise<boolean> {
  try {
    const testId = `__health_check_${ulid()}`;
    await db.runAsync(
      `INSERT INTO ${TABLE} (id, type, timestamp, device_id) VALUES (?, 'audit', ?, 'health-check')`,
      [testId, new Date().toISOString()],
    );
    await db.runAsync(`DELETE FROM ${TABLE} WHERE id = ?`, [testId]);
    return true;
  } catch {
    return false;
  }
}

async function estimateDbSize(db: SqliteDatabase): Promise<number | null> {
  try {
    const pageCount = await db.getFirstAsync<{ page_count: number }>(
      'PRAGMA page_count',
    );
    const pageSize = await db.getFirstAsync<{ page_size: number }>(
      'PRAGMA page_size',
    );
    if (pageCount && pageSize) {
      return pageCount.page_count * pageSize.page_size;
    }
    return null;
  } catch {
    return null;
  }
}
