/**
 * createLogStore — factory that builds the device's LogStore.
 *
 * - Development: SqliteLogStore with 30-day retention.
 * - Production: SqliteLogStore with 7-day retention.
 *
 * The log is local. It once could also be dual-written to an HTTP backend;
 * that path was retired with the `bug-report` edge function (N-81, ADR-140).
 *
 * The factory initializes the SQLite table on first call.
 */

import {
  SqliteLogStore,
  type SqliteDatabase,
  type SqliteLogStoreConfig,
} from './sqlite-log-store.js';
import type { LogStore } from './log-store.js';

export interface CreateLogStoreOptions {
  readonly db: SqliteDatabase;
  readonly deviceId: string;
  /** Defaults to false (production). */
  readonly isDev?: boolean;
}

export async function createLogStore(opts: CreateLogStoreOptions): Promise<LogStore> {
  const retentionDays = opts.isDev ? 30 : 7;

  const config: SqliteLogStoreConfig = {
    deviceId: opts.deviceId,
    retentionDays,
  };

  const local = new SqliteLogStore(opts.db, config);
  await local.initialize();

  // Auto-prune on startup
  void local.prune(retentionDays).catch(() => {});

  return local;
}
