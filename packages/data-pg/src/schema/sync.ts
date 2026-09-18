/**
 * Sync bookkeeping (B-08, B-09). Portal-only: none of these cross the wire.
 *
 * **The cursor.** `sync_log.seq` used to be an identity column, assigned at
 * INSERT rather than at commit. Two writers could take 5 and 6, commit 6
 * first, and a pull serving `max(seq) = 6` would hand out a cursor above a row
 * that had not committed yet — which that device then never pulls (audit
 * DB-SYNC-01, reproduced). Now each tenant has one counter row in
 * `sync_cursors`, incremented under its row lock: a writer holds the lock until
 * commit, so within a tenant seqs commit in order, and a reader that serves the
 * **committed** counter can never serve a cursor above an in-flight row.
 */

import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { tenantStamps } from './_columns';

const seq = (name: string) => bigint(name, { mode: 'number' });
const at = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' });

/** One row per tenant: the last seq handed out. */
export const syncCursors = pgTable('sync_cursors', {
  businessId: text('business_id').primaryKey(),
  lastSeq: seq('last_seq').notNull().default(0),
});

/**
 * What devices pull: one row per change to a DOWN or HYBRID row. UP rows are
 * never logged here (DB-SYNC-03) — no device pulls them, so logging them would
 * make every pull scan past other phones' sales.
 */
export const syncLog = pgTable(
  'sync_log',
  {
    seq: seq('seq').notNull(),
    tableName: text('table_name').notNull(),
    rowId: text('row_id').notNull(),
    op: text('op', { enum: ['insert', 'update'] }).notNull(),
    ...tenantStamps,
  },
  (t) => [primaryKey({ columns: [t.businessId, t.seq] })],
);

/**
 * The serverSeq each pushed row was accepted at — one row per row, not per
 * push. Answers the idempotent re-push ("same row, same serverSeq") and is what
 * `acknowledgedThrough` is made of.
 */
export const syncReceipts = pgTable(
  'sync_receipts',
  {
    tableName: text('table_name').notNull(),
    rowId: text('row_id').notNull(),
    seq: seq('seq').notNull(),
    deviceId: text('device_id').notNull(),
    rowUpdatedAt: at('row_updated_at').notNull(),
    receivedAt: at('received_at').notNull(),
    businessId: text('business_id').notNull(),
  },
  (t) => [primaryKey({ columns: [t.businessId, t.tableName, t.rowId] })],
);

/**
 * Rejected rows are **never dropped** (ADR-053 Q4). The server stores the
 * reason, the portal shows it as a human sentence, and the device retries —
 * which updates this row rather than adding one.
 */
export const syncRejections = pgTable(
  'sync_rejections',
  {
    id: text('id').primaryKey(),
    deviceId: text('device_id').notNull(),
    tableName: text('table_name').notNull(),
    rowId: text('row_id').notNull(),
    clientSeq: integer('client_seq'),
    code: text('code').notNull(),
    message: text('message'),
    payload: jsonb('payload'),
    receivedAt: at('received_at').notNull(),
    resolvedAt: at('resolved_at'),
    ...tenantStamps,
  },
  (t) => [
    uniqueIndex('sync_rejections_device_row_uq').on(t.businessId, t.deviceId, t.tableName, t.rowId),
    index('sync_rejections_business_idx').on(t.businessId, t.resolvedAt),
  ],
);
