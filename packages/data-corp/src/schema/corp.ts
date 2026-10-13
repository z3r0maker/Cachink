import { pgSchema, timestamp } from 'drizzle-orm/pg-core';

/**
 * The one Postgres schema MEXIA's command center lives in (ADR-124 §2). No
 * table here references another schema, so `pg_dump -n corp` is the whole of
 * it when the area moves to its own database.
 */
export const corp = pgSchema('corp');

/** An instant as an ISO string, the way data-pg's tables carry them. */
export const at = (name: string) => timestamp(name, { withTimezone: true, mode: 'string' });
