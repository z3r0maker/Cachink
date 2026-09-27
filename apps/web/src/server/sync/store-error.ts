import 'server-only';

import { ForeignRowError, RowRefusedError, TransientWriteError } from '@xangarro/application';
import type { Delta, PushableTable } from '@xangarro/contracts';

/**
 * A failed push write, as the use case understands it (ADR-118).
 *
 * - **42501** — RLS refused an upsert because an id belongs to another business
 *   (audit DB-SYNC-05). It is the signal, not a crash: `ForeignRowError`, and
 *   the use case narrows the batch to the row and answers DUPLICATE_CONFLICT.
 * - **A timeout, a lock, a deadlock, a lost connection** — about the moment,
 *   not about any row: `TransientWriteError`, so the batch is not split into a
 *   hundred more statements that would each hit the same wall.
 * - **A value the schema refuses** — class 22 (a NUL, bad text for a number or
 *   a date, too long, out of range), NOT NULL, CHECK — and **a unique key other
 *   than the id** that another row holds (`idx_tickets_device_folio`): the same
 *   row fails the same way every time, so `RowRefusedError`, answered terminally
 *   once narrowed to the row (audit DB3-SYNC-01 c). They used to be INTERNAL,
 *   which a phone retries forever.
 * - Anything else is returned as it came, for the use case to isolate and
 *   answer retryable — a 23505 on the primary key included: ON CONFLICT (id)
 *   absorbs every such conflict, so one that escapes is a race, not the row.
 */
const RLS_VIOLATION = '42501';
const UNIQUE_VIOLATION = '23505';
const TRANSIENT_CODES: ReadonlySet<string> = new Set([
  '57014', // query_canceled — statement_timeout
  '55P03', // lock_not_available — lock_timeout
  '40001', // serialization_failure
  '40P01', // deadlock_detected
  'CONNECTION_CLOSED',
  'CONNECTION_DESTROYED',
  'CONNECTION_ENDED',
  'ECONNRESET',
]);
// Class 08: connection exception. Class 53: insufficient resources.
const TRANSIENT_CLASSES = ['08', '53'];
// Class 22: data exception. 23502 not_null_violation, 23514 check_violation.
const INVALID_CODES: ReadonlySet<string> = new Set(['23502', '23514']);
const INVALID_CLASS = '22';

interface PgError {
  code?: string;
  constraint_name?: string;
}

/** The driver's error: Drizzle wraps it, and the SQLSTATE is on `cause`. */
function pgError(error: unknown): PgError {
  const e = error as (PgError & { cause?: PgError }) | null;
  return e?.code !== undefined ? e : (e?.cause ?? {});
}

export function storeError(
  error: unknown,
  table: PushableTable,
  deltas: readonly Delta[],
): unknown {
  const { code, constraint_name: constraint } = pgError(error);
  if (code === RLS_VIOLATION) {
    return new ForeignRowError(table, deltas.length === 1 ? String(deltas[0]?.rowId) : '*');
  }
  if (code === undefined) return error;
  if (TRANSIENT_CODES.has(code) || TRANSIENT_CLASSES.includes(code.slice(0, 2))) {
    return new TransientWriteError(error);
  }
  if (INVALID_CODES.has(code) || code.startsWith(INVALID_CLASS)) {
    return new RowRefusedError('invalid', error);
  }
  if (code === UNIQUE_VIOLATION && constraint !== undefined && !constraint.endsWith('_pkey')) {
    return new RowRefusedError('duplicate', error);
  }
  return error;
}
