/**
 * «Desvincular y borrar» (MvDesvincularBorrar; aviso §7, LFPDPPP
 * cancelación): empties every table this device keeps (ventas, gastos,
 * turnos, catálogo, NIP hashes, settings, sync cursors and the change log),
 * with `secure_delete` on, so SQLite overwrites what it deletes. Compacting
 * the file afterwards (VACUUM, WAL checkpoint) is a bonus, not the guarantee:
 * on the phone it can fail while another statement is open, and a wipe whose
 * rows are already gone must not report failure for it.
 *
 * The schema and the migration record stay: the app links again without
 * migrating from scratch. Whether the rows were sent is the caller's
 * question, asked before this runs; this function never checks.
 */

import { sql } from 'drizzle-orm';
import type { XangarroDatabase } from './repositories/drizzle/_db.js';
import { readStringColumn, type RawRow } from './migrator/raw-row.js';

/** The migrator's own record, never wiped (`run-migrations.ts`, `legacy-tracker.ts`). */
const KEEP = new Set(['__xangarro_migrations', '__cachink_migrations']);

export class LocalWipeError extends Error {
  readonly code = 'LOCAL_WIPE_FAILED' as const;
  override readonly cause: unknown;

  constructor(cause: unknown) {
    super(
      `Could not wipe this device's data: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
    this.name = 'LocalWipeError';
    this.cause = cause;
  }
}

async function tablesToWipe(db: XangarroDatabase): Promise<string[]> {
  const rows = (await db.all(
    sql.raw(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`),
  )) as RawRow[];
  return rows
    .map((r) => readStringColumn(r, 'name'))
    .filter((name): name is string => name !== null && !KEEP.has(name));
}

async function emptyAll(db: XangarroDatabase, tables: readonly string[]): Promise<void> {
  // The change-log triggers fire on insert and update only, so a DELETE
  // writes nothing back.
  for (const table of tables) await db.run(sql.raw(`DELETE FROM "${table.replace(/"/g, '""')}"`));
}

export interface LocalWipeResult {
  /** Tables emptied: every one but the migration record. */
  readonly tables: number;
  /** False when the driver refused VACUUM; the rows are gone either way. */
  readonly compacted: boolean;
}

export async function wipeLocalData(db: XangarroDatabase): Promise<LocalWipeResult> {
  let tables: string[];
  try {
    tables = await tablesToWipe(db);
    await db.all(sql.raw('PRAGMA secure_delete = ON'));
    await db.run(sql.raw('PRAGMA foreign_keys = OFF'));
    try {
      await emptyAll(db, tables);
    } finally {
      await db.run(sql.raw('PRAGMA foreign_keys = ON'));
    }
  } catch (error) {
    throw new LocalWipeError(error);
  }
  return { tables: tables.length, compacted: await compactar(db) };
}

/** Shrinks the file and folds the WAL back in; false when the driver refuses. */
async function compactar(db: XangarroDatabase): Promise<boolean> {
  try {
    await db.run(sql.raw('VACUUM'));
    await db.all(sql.raw('PRAGMA wal_checkpoint(TRUNCATE)'));
    return true;
  } catch {
    return false;
  }
}
