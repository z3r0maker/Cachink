import { bigint, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Shared column shapes for the cloud schema.
 *
 * The device stores ISO strings and SQLite `numeric(..., bigint)`; Postgres has
 * real types, so the cloud uses `timestamptz` and `bigint`. **The column names
 * are identical on both sides** — `tests/drift.test.ts` enforces that, because
 * the sync wire format addresses columns by name and a silent rename would
 * corrupt rows rather than fail loudly.
 *
 * Ids stay `text`: they are ULIDs (ADR-010), not UUIDs, and are minted on the
 * device before the server ever sees them.
 */
export const auditColumns = {
  businessId: text('business_id').notNull(),
  deviceId: text('device_id').notNull(),
  createdByUserId: text('created_by_user_id'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'string' }),
} as const;

/** Money is integer centavos everywhere (CLAUDE.md §2.8) — never numeric/float. */
export const centavos = (name: string) => bigint(name, { mode: 'bigint' });

/** A calendar date the device wrote as `YYYY-MM-DD`; kept as text for parity. */
export const isoDate = (name: string) => text(name);

export { jsonb, text, timestamp, uuid };
