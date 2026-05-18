/**
 * createLogStore — factory that builds the correct LogStore for the environment.
 *
 * - Development: SqliteLogStore with 30-day retention.
 * - Production: SqliteLogStore with 7-day retention.
 * - Production + remote: DualLogStore (local + HTTP remote).
 *
 * The factory initializes the SQLite table on first call.
 */

import { SqliteLogStore, type SqliteDatabase, type SqliteLogStoreConfig } from './sqlite-log-store.js';
import { DualLogStore } from './dual-log-store.js';
import { HttpRemoteLogStore, type HttpRemoteLogStoreConfig } from './http-remote-log-store.js';
import type { LogStore } from './log-store.js';

export interface CreateLogStoreOptions {
  readonly db: SqliteDatabase;
  readonly deviceId: string;
  /** Defaults to false (production). */
  readonly isDev?: boolean;
  /** If provided, enables dual-write to remote. */
  readonly remote?: HttpRemoteLogStoreConfig;
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

  if (opts.remote) {
    const remote = new HttpRemoteLogStore(opts.remote);
    return new DualLogStore(local, remote);
  }

  return local;
}
