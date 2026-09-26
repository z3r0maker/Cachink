import 'server-only';

import { ForeignRowError, TransientWriteError } from '@xangarro/application';
import type { Delta, PushableTable } from '@xangarro/contracts';

/**
 * A failed push write, as the use case understands it (ADR-110).
 *
 * - **42501** — RLS refused an upsert because an id belongs to another business
 *   (audit DB-SYNC-05). It is the signal, not a crash: `ForeignRowError`, and
 *   the use case narrows the batch to the row and answers DUPLICATE_CONFLICT.
 * - **A timeout, a lock, a deadlock, a lost connection** — about the moment,
 *   not about any row: `TransientWriteError`, so the batch is not split into a
 *   hundred more statements that would each hit the same wall.
 * - Anything else is returned as it came, for the use case to isolate.
 */
const RLS_VIOLATION = '42501';
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

function pgCode(error: unknown): string | undefined {
  const e = error as { code?: string; cause?: { code?: string } } | null;
  return e?.code ?? e?.cause?.code;
}

export function storeError(
  error: unknown,
  table: PushableTable,
  deltas: readonly Delta[],
): unknown {
  const code = pgCode(error);
  if (code === RLS_VIOLATION) {
    return new ForeignRowError(table, deltas.length === 1 ? String(deltas[0]?.rowId) : '*');
  }
  if (code === undefined) return error;
  if (TRANSIENT_CODES.has(code) || TRANSIENT_CLASSES.includes(code.slice(0, 2))) {
    return new TransientWriteError(error);
  }
  return error;
}
