/**
 * __sync_row_status — the cloud outcome of every pushed row (migration 0001).
 *
 * `pending` until the server answers; `accepted` carries the server's
 * `serverSeq` (retention may purge only rows with serverSeq <= the pull's
 * `acknowledgedThrough`); `rejected` keeps the contract error code, message
 * and retryability so the row is shown in "No enviados" instead of lost.
 */

import { index, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const syncRowStatus = sqliteTable(
  '__sync_row_status',
  {
    tableName: text('table_name').notNull(),
    rowId: text('row_id').notNull(),
    status: text('status', { enum: ['pending', 'accepted', 'rejected'] }).notNull(),
    serverSeq: integer('server_seq'),
    code: text('code'),
    message: text('message'),
    retryable: integer('retryable', { mode: 'boolean' }).notNull().default(false),
    attempts: integer('attempts').notNull().default(0),
    retryAfter: text('retry_after'),
    lastAttemptAt: text('last_attempt_at'),
  },
  (t) => [
    primaryKey({ columns: [t.tableName, t.rowId] }),
    index('idx_sync_row_status_status').on(t.status),
  ],
);
