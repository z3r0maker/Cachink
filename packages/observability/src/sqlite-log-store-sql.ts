export interface SqliteDatabase {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params: unknown[]): Promise<void>;
  getAllAsync<T>(sql: string, params?: unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: unknown[]): Promise<T | null>;
}

export type ArchiveFn = (jsonData: string, filename: string) => Promise<void>;

export interface SqliteLogStoreConfig {
  readonly deviceId: string;
  readonly retentionDays?: number;
  readonly archiveFn?: ArchiveFn;
  readonly dedupWindowMs?: number;
}

const TABLE = '__cachink_observability_log';

export { TABLE };

export const CREATE_TABLE_SQL = `
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

export const ADD_DURATION_MS_SQL = `
ALTER TABLE ${TABLE} ADD COLUMN duration_ms INTEGER;
`;

export const CREATE_INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS idx_obs_log_type_ts ON ${TABLE}(type, timestamp);
CREATE INDEX IF NOT EXISTS idx_obs_log_operation ON ${TABLE}(operation);`;

export interface LogQueryOptions {
  readonly since?: string;
  readonly operation?: string;
  readonly source?: string;
  readonly limit?: number;
}

export async function countByType(
  db: SqliteDatabase,
  type: string,
  since: string,
): Promise<number> {
  const r = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM ${TABLE} WHERE type = '${type}' AND timestamp >= ?`,
    [since],
  );
  return r?.cnt ?? 0;
}

export async function lastErrorTimestamp(
  db: SqliteDatabase,
  since: string,
): Promise<string | null> {
  const r = await db.getFirstAsync<{ timestamp: string }>(
    `SELECT timestamp FROM ${TABLE} WHERE type = 'error' AND timestamp >= ? ORDER BY timestamp DESC LIMIT 1`,
    [since],
  );
  return r?.timestamp ?? null;
}

export async function groupBy(
  db: SqliteDatabase,
  col: string,
  type: string,
  since: string,
): Promise<Record<string, number>> {
  const rows = await db.getAllAsync<Record<string, unknown>>(
    `SELECT ${col}, COUNT(*) as cnt FROM ${TABLE} WHERE type = '${type}' AND timestamp >= ? GROUP BY ${col}`,
    [since],
  );
  const result: Record<string, number> = {};
  for (const row of rows) {
    const key = row[col] as string | null;
    if (key) result[key] = row.cnt as number;
  }
  return result;
}

export function buildQuery(
  type: 'audit' | 'error' | null,
  opts: LogQueryOptions,
): { sql: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }
  if (opts.since) {
    conditions.push('timestamp >= ?');
    params.push(opts.since);
  }
  if (opts.operation) {
    conditions.push('operation = ?');
    params.push(opts.operation);
  }
  if (opts.source) {
    conditions.push('source = ?');
    params.push(opts.source);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = opts.limit ?? 200;
  params.push(limit);

  return {
    sql: `SELECT * FROM ${TABLE} ${where} ORDER BY timestamp DESC LIMIT ?`,
    params,
  };
}
