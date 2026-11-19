/**
 * Migration 0015 — `caja_turno_id` on `client_payments` (ADR-146, M5).
 *
 * An abono had no turno, so every expected-cash figure guessed it from the
 * day, and a second turno the same day counted the first one's cash abonos
 * (a false faltante). The abono now carries the turno whose drawer received
 * it, as `expenses` has since 0004. Nullable: a row written before this
 * column, or received with no turno open, belongs to no drawer.
 *
 * The change-log triggers record ids, not columns, so the outbox carries the
 * new column with no trigger change. Postgres side: data-pg 0058.
 */

export const migration0015Sql = `
-- 0015_client_payments_turno
--> statement-breakpoint
ALTER TABLE client_payments ADD COLUMN caja_turno_id TEXT
`;
