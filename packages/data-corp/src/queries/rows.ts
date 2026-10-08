import type { LedgerEntry, NewLedgerEntry } from '@xangarro/application/corp';
import { isAccountKey, isMovementKind, type JournalLine } from '@xangarro/domain/corp';

import type { entries, entryLines } from '../schema/ledger.js';

/**
 * Ledger rows → the domain's shapes, parsed and never asserted (CLAUDE.md
 * §2.8): an unknown account or kind, a non-bigint amount or a third partner
 * is a broken row, and reading it throws rather than guessing.
 */
export type EntryRow = typeof entries.$inferSelect;
export type LineRow = typeof entryLines.$inferSelect;

function toLine(row: LineRow): JournalLine {
  if (!isAccountKey(row.cuenta))
    throw new Error(`corp line ${row.id} has unknown cuenta ${row.cuenta}`);
  if (typeof row.debe !== 'bigint' || typeof row.haber !== 'bigint') {
    throw new Error(`corp line ${row.id} amounts are not bigint`);
  }
  const base = { cuenta: row.cuenta, debe: row.debe, haber: row.haber };
  if (row.socio === null) return base;
  if (row.socio !== 1 && row.socio !== 2)
    throw new Error(`corp line ${row.id} has socio ${row.socio}`);
  return { ...base, socio: row.socio };
}

export function toEntry(row: EntryRow, lines: readonly LineRow[]): LedgerEntry {
  if (!isMovementKind(row.kind)) throw new Error(`corp entry ${row.id} has kind ${row.kind}`);
  return {
    id: row.id,
    fecha: row.fecha,
    projectId: row.projectId,
    kind: row.kind,
    concepto: row.concepto,
    contraparte: row.contraparte,
    moneda: row.moneda,
    montoOriginal: row.montoOriginal,
    tipoCambio: row.tipoCambio,
    deducible: row.deducible,
    source: row.source,
    sourceRef: row.sourceRef,
    reversesEntryId: row.reversesEntryId,
    // The capture as written, for the audit trail: its amounts are stored as strings.
    payload: row.payload as NewLedgerEntry['payload'],
    createdBy: row.createdBy,
    lines: lines.map(toLine),
  };
}
